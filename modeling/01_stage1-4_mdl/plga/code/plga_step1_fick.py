# PLGA/PLA microspheres — Step 1: Fick with D from formulas (no fitting), same workflow as the gelatin study
# t50 for 1b = 0.01835 C0 R^2 / (D Cs)
# Two Fick variants, both without fitted parameters:
#   1a  drug fully dissolved in the particle (Crank 1975, Eq. 6.20)            -> t50 = 0.0305 R^2 / D
#   1b  drug dispersed above its solubility (C0 >> Cs; moving dissolution front,
#       Higuchi-type sphere, solved numerically: A = total drug, C = min(A, Cs), dA/dt = div(D grad C))
# D = D_medium(Wilke–Chang, viscosity-corrected) x Mackie–Meares(phi = 1 - eps)  [diffusion in water-filled pores]
import json, numpy as np
from scipy.integrate import solve_ivp

# ---------------- general helpers ----------------
LEBAS = dict(C=14.8, H=3.7, O=7.4, O_me=9.1, O_eth=11.0, O_acid=12.0, N_prim=10.5, N_sec=12.0, N_tert=10.8,
             N_dbl=15.6, Cl=24.6, F=8.7, S=25.6, ring6=-15.0, ring5=-11.5)          # Poling et al. 5th ed., Table 11-5
def lebas(**n): return sum(LEBAS[k] * v for k, v in n.items())
def eta_water_cP(T): return 2.414e-2 * 10 ** (247.8 / (T - 140))
def wilke_chang_water(V, T): return 7.4e-8 * np.sqrt(2.6 * 18.015) * T / (eta_water_cP(T) * V ** 0.6)   # cm2/s
def mackie_meares(phi): return ((1 - phi) / (1 + phi)) ** 2
TAU50 = 0.0305

# ---------------- PARAMETER SET (every quantity the PLGA model will need; None = not reported) ----------------
# Steps that use each group: [1] Fick, [2] + porosity evolution / burst, [3] + hydrolysis & autocatalysis, [4] + erosion
FORMULATIONS = {
 "LNG-PLLA (Sivasankaran & Jonnalagadda 2022)": dict(
   source="Int. J. Pharm. 624 (2022) 121994; Tables 1, 5, 6, 7; Fig. 7 (digitized)",
   polymer=dict(type="PLLA (100:0)", LA_GA=(100, 0), Mw0_Da=None, PDI=None, end_group=None,      # [3]
                Tg_C=[58.14, 56.68, 54.49, 54.13, 56.07], crystallinity=[0.15, 0.04, None, None, None],  # [3] Table 5, batches 2-6
                density_g_cm3=1.25),                                                               # PLLA typical
   particle=dict(method="spray drying (DCM)", D50_um=[5.52, 5.16, 4.91, 4.11, 4.31],               # [1] Table 6
                 D10_um=[2.74, 2.70, 2.88, 1.07, 0.92], D90_um=[13.44, 10.09, 8.27, 8.56, 9.74],
                 porosity_eps0=None),                                                              # [1,2] not reported
   drug=dict(name="levonorgestrel", MW=312.45, formula="C21H28O2",
             V_LeBas=lebas(C=21, H=28, O=2, ring6=3, ring5=1),                                     # [1]
             loading_w=[0.0572, 0.1195, 0.1990, 0.3493, 0.5146],                                   # [1b] Table 1 (actual)
             drug_crystallinity=[0.0, 0.13, 0.33, 0.39, 0.59],                                     # Table 3
             Cs_medium_mg_ml=None, Cs_lower_bound_mg_ml=0.02),  # pure LNG (1 mg in 50 ml = 0.02 mg/ml) dissolved in < 4 h
   medium=dict(composition="50% EtOH + 0.1% Tween 20 + 0.01 M PBS, pH 7.4", T_K=310.15, volume_ml=50,
               eta_cP=1.7,   # ~40–45 wt% ethanol–water at 37 °C (assumption, ±20 %)
               sink=True),
   kinetics=dict(k_hydrolysis=None, k_autocatalytic=None),                                         # [3] later
   batches=["#2", "#3", "#4", "#5", "#6"],
   data_file="lng_fig7_digitized.json",
   day28=[72.21, 73.13, 96.02, 99.65, 99.19]),                                                     # Table 7
}
EPS_BAND = (0.02, 0.30)     # initial water-filled porosity, used ONLY because it is not reported
CS_BAND = (0.02, 1.0)       # mg/ml, LNG solubility in the release medium; 0.02 = lower bound from the paper's own control

# ---------------- solvers ----------------
def frac_dissolved(t, D, R):                          # Step 1a, Crank sphere series
    tau = D * np.asarray(t, float)[:, None] / R**2; n = np.arange(1, 300)
    return 1 - 6 / np.pi**2 * (np.exp(-(n * np.pi)**2 * tau) / n**2).sum(1)

def frac_dispersed(t, D, R, C0, Cs):
    """Step 1b: drug dispersed above solubility in a sphere, perfect sink, pseudo-steady state (valid for C0 >> Cs;
    Higuchi 1963 / Roseman & Higuchi sphere, see Siepmann & Siepmann 2012). Dissolution front at x = r'/R obeys
    t = C0 R^2 / (6 D Cs) * (1 - 3 x^2 + 2 x^3); released fraction = 1 - x^3."""
    x = np.linspace(1, 0, 4001); tt = C0 * R**2 / (6 * D * Cs) * (1 - 3 * x**2 + 2 * x**3)
    return np.interp(np.asarray(t, float), tt, 1 - x**3, right=1.0)

def t_at(tt, f, level=0.5):
    i = np.argmax(f >= level); return np.nan if f[i] < level else np.interp(level, [f[i-1], f[i]], [tt[i-1], tt[i]])

# ---------------- run ----------------
if __name__ == "__main__":
    import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
    plt.rcParams.update({"font.size": 10, "axes.spines.top": False, "axes.spines.right": False})
    key = list(FORMULATIONS)[0]; F = FORMULATIONS[key]; dr, pa, me = F["drug"], F["particle"], F["medium"]
    T = me["T_K"]; Dmed = wilke_chang_water(dr["V_LeBas"], T) * eta_water_cP(T) / me["eta_cP"]
    print(f"LNG: V_LeBas = {dr['V_LeBas']:.1f} cm3/mol; D in water 37 °C = {wilke_chang_water(dr['V_LeBas'], T):.3g}; "
          f"D in medium = {Dmed:.3g} cm2/s")
    data = json.load(open(F["data_file"]))
    extra = {"B2": [[28, 72.21]], "B5": [[12, 99.8], [28, 99.65]], "B6": [[4, 100.0], [28, 99.19]]}
    tt_h = np.logspace(-5, np.log10(28 * 24), 400); tt = tt_h * 3600
    fig, axs = plt.subplots(1, 5, figsize=(19, 4.4), sharey=True); rows = []
    for i, (b, ax) in enumerate(zip(F["batches"], axs)):
        k = "B" + b[1]; pts = np.array(data[k] + extra.get(k, [])); pts = pts[np.argsort(pts[:, 0])]
        R = pa["D50_um"][i] / 2 * 1e-4; w = dr["loading_w"][i]; C0 = w * F["polymer"]["density_g_cm3"] * 1000   # mg/ml
        D_lo, D_mid, D_hi = (Dmed * mackie_meares(1 - e) for e in (EPS_BAND[0], 0.10, EPS_BAND[1]))
        f1 = frac_dissolved(tt, D_mid, R); f1lo = frac_dissolved(tt, D_lo, R); f1hi = frac_dissolved(tt, D_hi, R)
        f2 = frac_dispersed(tt, D_mid, R, C0, CS_BAND[0]); f2hi = frac_dispersed(tt, D_mid, R, C0, CS_BAND[1])
        f2lo = frac_dispersed(tt, D_lo, R, C0, CS_BAND[0])
        ax.fill_between(tt_h, 100 * f1lo, 100 * f1hi, color="#2F5CF0", alpha=.15, lw=0)
        ax.plot(tt_h, 100 * f1, color="#2F5CF0", lw=2, label="Step 1a: Fick, drug dissolved (ε = 0.1; band ε = 0.02–0.3)")
        ax.fill_between(tt_h, 100 * f2lo, 100 * f2hi, color="#EB6834", alpha=.15, lw=0)
        ax.plot(tt_h, 100 * f2, color="#EB6834", lw=2, ls="--", label="Step 1b: Fick, drug dispersed, Cs = 0.02 mg/ml (band: Cs ≤ 1, ε ≥ 0.02)")
        ax.plot(pts[:, 0] * 24, pts[:, 1], "ko", ms=4.5, label="data, Fig. 7")
        ax.set_xscale("log"); ax.set_xlim(1e-5, 28 * 24); ax.set_ylim(0, 105)
        for s, l in ((1/3600, "1 s"), (1/60, "1 min"), (1, "1 h"), (24, "1 d"), (168, "1 wk")):
            ax.axvline(s, color="#dde2ef", lw=1, zorder=0); ax.text(s, 106, l, ha="center", fontsize=8, color="#6B7590")
        ax.set_title(f"batch {b}: LNG {100*w:.0f} % w/w, D50 = {pa['D50_um'][i]} µm", loc="left", fontsize=9.5)
        ax.set_xlabel("time (h, log)")
        t50d = np.interp(50, pts[:, 1], pts[:, 0] * 24) if pts[0, 1] < 50 else pts[0, 0] * 24
        rows.append(dict(batch=b, loading=w, R_um=R * 1e4, C0_mg_ml=C0, D_mid=D_mid,
                         t50_1a_s=TAU50 * R**2 / D_mid, t50_1a_range_s=(TAU50 * R**2 / D_hi, TAU50 * R**2 / D_lo),
                         t50_1b_s=t_at(tt, f2) , t50_1b_Cs1_s=t_at(tt, f2hi), t50_1b_slow_s=t_at(tt, f2lo),
                         t50_data_h=t50d, data_upper_bound=bool(pts[0, 1] >= 50)))
    axs[0].set_ylabel("cumulative LNG released (%)")
    h, l = axs[0].get_legend_handles_labels(); fig.legend(h, l, loc="lower center", ncol=3, frameon=False, fontsize=9)
    fig.suptitle("PLLA–levonorgestrel microparticles (Sivasankaran & Jonnalagadda 2022): Step 1 Fick with D from formulas vs data",
                 x=.01, ha="left", fontsize=11.5)
    fig.tight_layout(rect=(0, .1, 1, 1)); fig.savefig("plga_step1_LNG.png", dpi=160)
    for r in rows:
        print({k: (f"{v:.3g}" if isinstance(v, float) else v) for k, v in r.items()})
    json.dump(rows, open("plga_step1_LNG_results.json", "w"), indent=1, default=lambda o: list(o) if isinstance(o, tuple) else float(o))
