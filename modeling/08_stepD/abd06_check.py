# Applying our Step 1 / Step 2 workflow to Abdekhodaie & Wu 2006 (verapamil loading onto Sephadex SP C-25)
import numpy as np, json
from scipy.integrate import solve_ivp
from scipy.optimize import brentq

# ---- data digitized from Fig. 13 (p. 3661): fraction of drug remaining in solution vs time (min)
t_d = np.array([1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 18.0])
DATA = {
 "a: λ=40.67, C0=1.8": (40.67, 1.8, [0.346, 0.216, 0.155, 0.106, 0.103, 0.087, 0.078, 0.069, 0.069, 0.069, 0.069, 0.069]),
 "a: λ=82.33, C0=1.8": (82.33, 1.8, [0.566, 0.476, 0.439, 0.417, 0.40, 0.399, 0.381, 0.380, 0.381, 0.375, 0.372, 0.362]),
 "b: λ=40.67, C0=3.6": (40.67, 3.6, [0.514, 0.420, 0.381, 0.35, 0.344, 0.336, 0.336, 0.325, 0.318, 0.318, 0.317, 0.317]),
}
MW = 491.06                       # verapamil HCl, g/mol (C0 given in mg/ml)
CMAX, K = 0.229, 6056.0           # M, 1/M  (from equilibrium experiment, Fig. 12)
KADS_FIT = 0.133                  # (M s)^-1, fitted by the authors to the C0=1.8, λ=40.67 kinetic curve
# ---- diffusion coefficients (25 °C, verapamil, V_LeBas = 573 cm3/mol, r_s = 6.10 Å, Q = 12)
def eta_cP(T): return 2.414e-2 * 10 ** (247.8 / (T - 140))
T = 298.15; V = 573.0; rs_A = (3 * V / (4 * np.pi * 6.02214e23)) ** (1/3) * 1e8
Dw = 7.4e-8 * np.sqrt(2.6 * 18.015) * T / (eta_cP(T) * V ** 0.6)
Q = 12.0; phi = 1 / Q
D1 = Dw * ((1 - phi) / (1 + phi)) ** 2              # Step 1: Mackie–Meares
D2 = Dw * rs_A * Q ** -0.75 * np.exp(-1 / (Q - 1))  # Step 2: Eq. 26 (r_s in Å)
print(f"D_w={Dw:.3g}  r_s={rs_A:.2f} Å  Step1 D={D1:.3g}  Step2 D={D2:.3g}  (paper 3.21e-6)")

def run(lam, C0mg, D, R_um, kads, K=K, cmax=CMAX, binding=True, tmax=20*60, N=60):
    """Fick in the sphere for C (total drug in particle, as in the paper's Eq. 1) + finite well-stirred bath.
    Surface: adsorption–desorption kinetics of Eq. 6 (rate per unit solution volume). kads -> large = local equilibrium."""
    R = R_um * 1e-4; C0 = C0mg / MW                     # cm, M
    r = np.linspace(0, R, N + 1); rc = 0.5 * (r[1:] + r[:-1])
    Vc = 4/3 * np.pi * (r[1:]**3 - r[:-1]**3); A = 4 * np.pi * r**2
    Vp = 4/3 * np.pi * R**3; Vb = lam * Vp
    kdes = kads / K
    def rhs(t, y):
        C = y[:-1]; Cb = y[-1]
        F = np.zeros(N + 1)                                # inward-positive flux*area at faces (mol/s per L-cm3 mix; units cancel)
        F[1:-1] = D * A[1:-1] * (C[1:] - C[:-1]) / (rc[1:] - rc[:-1])   # flux from cell i+1 into cell i
        Cs = C[-1]
        if binding: rate = kads * Cb * (cmax - Cs) - kdes * Cs           # M/s, per solution volume
        else:       rate = kads * (Cb - Cs)                              # partition 1, no binding
        F[-1] = rate * Vb                                  # amount entering the sphere per s
        dC = (F[1:] - F[:-1]) / Vc
        dCb = -rate
        return np.append(dC, dCb)
    y0 = np.append(np.zeros(N), C0)
    sol = solve_ivp(rhs, (0, tmax), y0, method="BDF", rtol=1e-7, atol=1e-12, dense_output=True, max_step=tmax/50)
    return lambda t_s: sol.sol(t_s)[-1] / C0

def eq_remaining(lam, C0mg, K=K, cmax=CMAX):          # Eq. 29–30: equilibrium fraction remaining (no kinetics)
    C0 = C0mg / MW
    f = lambda m: cmax * K / (lam * (1 + K * C0 * m)) - (1 / m - 1)
    return brentq(f, 1e-9, 1 - 1e-12)

def t_frac(fun, plateau, frac=0.9, tmax=20*60):
    tt = np.logspace(-2, np.log10(tmax), 3000); y = fun(tt); target = 1 - frac * (1 - plateau)
    i = np.argmax(y <= target); return tt[i] if y[i] <= target else np.nan

def t_frac_data(t_min, y, plateau, frac=0.9):
    target = 1 - frac * (1 - plateau)
    tt = np.concatenate([[0], t_min * 60]); yy = np.concatenate([[1], y])
    i = np.argmax(yy <= target); return np.interp(target, [yy[i], yy[i-1]], [tt[i], tt[i-1]])

FAST = 1e4   # (M s)^-1: effectively instantaneous binding equilibrium at the surface
rows = []; curves = {}
for lab, (lam, C0mg, y) in DATA.items():
    y = np.array(y); pl_meas = y[-3:].mean(); pl_pred = eq_remaining(lam, C0mg)
    t90_data = t_frac_data(t_d, y, pl_meas)
    res = dict(case=lab, plateau_data=pl_meas, plateau_pred_Eq30=pl_pred, t90_data_s=t90_data)
    for R in (46, 100, 137):
        for nm, D in (("step1", D1), ("step2", D2)):
            f = run(lam, C0mg, D, R, FAST); res[f"t90_{nm}_R{R}_s"] = t_frac(f, f(1200))
    fpap = run(lam, C0mg, 3.21e-6, 100, KADS_FIT); res["t90_paperfit_R100_s"] = t_frac(fpap, fpap(1200))
    res["rms_paperfit"] = float(np.sqrt(np.mean((fpap(t_d * 60) - y) ** 2)))
    fnob = run(lam, C0mg, D2, 100, FAST, binding=False); res["plateau_noBinding"] = float(fnob(1200))
    rows.append(res)
    curves[lab] = dict(y=y.tolist(), lam=lam, C0=C0mg)
for r in rows:
    print(json.dumps({k: (round(v, 4) if isinstance(v, float) else v) for k, v in r.items()}, ensure_ascii=False))
json.dump(dict(rows=rows, D=dict(Dw=Dw, D1=D1, D2=D2, rs_A=rs_A)), open("abd06_results.json", "w"), ensure_ascii=False, indent=1, default=float)

# ---- figure
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
plt.rcParams.update({"font.size": 10.5, "axes.spines.top": False, "axes.spines.right": False})
fig, axs = plt.subplots(1, 3, figsize=(15, 5.4), sharey=True)
tt = np.logspace(-1, np.log10(1200), 600)
for ax, (lab, (lam, C0mg, y)) in zip(axs, DATA.items()):
    lo1, hi1 = run(lam, C0mg, D1, 46, FAST)(tt), run(lam, C0mg, D1, 137, FAST)(tt)
    ax.fill_between(tt, lo1, hi1, color="#2F5CF0", alpha=.15, lw=0, label="Step 1, R = 46–137 µm")
    ax.plot(tt, run(lam, C0mg, D1, 100, FAST)(tt), color="#2F5CF0", lw=2.2, label="Step 1: D = D_w × Mackie–Meares + Langmuir equilibrium")
    ax.plot(tt, run(lam, C0mg, D2, 100, FAST)(tt), color="#EB6834", lw=2, ls="--", label="Step 2: D = D_w × Eq. 26 + Langmuir equilibrium")
    ax.plot(tt, run(lam, C0mg, 3.21e-6, 100, KADS_FIT)(tt), color="#1BAF7A", lw=2, label="paper model: fitted K_ads = 0.133 (M s)⁻¹")
    ax.axhline(eq_remaining(lam, C0mg), color="#6B4FD8", lw=1.2, ls=":", label="equilibrium from Eq. 30 (K, C_max of Fig. 12)")
    ax.axhline(0.976 if lam < 50 else 0.988, color="#999999", lw=1, ls="-.", label="Fick without binding (plateau)")
    ax.plot(t_d * 60, y, "ks", ms=6, label="data, Fig. 13")
    ax.set_xscale("log"); ax.set_xlim(0.1, 1200); ax.set_ylim(0, 1.03)
    for s, l in ((1, "1 s"), (60, "1 min"), (600, "10 min")): ax.axvline(s, color="#dde2ef", lw=1, zorder=0); ax.text(s, 1.035, l, ha="center", fontsize=8.5, color="#6B7590")
    ax.set_title(lab.replace("a: ", "Fig. 13a  ").replace("b: ", "Fig. 13b  ") + " mg/ml", loc="left", fontsize=10.5)
    ax.set_xlabel("time (s, log)")
axs[0].set_ylabel("fraction of drug remaining in solution")
h,l=axs[0].get_legend_handles_labels(); fig.legend(h,l,loc="lower center",ncol=4,fontsize=8.6,frameon=False)
fig.suptitle("Abdekhodaie & Wu 2006: verapamil loading onto Sephadex SP C-25 — our Step 1 / Step 2 vs data", x=0.01, ha="left", fontsize=12)
fig.tight_layout(rect=(0,0.11,1,1)); fig.savefig("abd06_step12_vs_data.png", dpi=170)
