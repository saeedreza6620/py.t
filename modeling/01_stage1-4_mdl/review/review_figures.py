# Figures for the literature review (all numbers either computed from stated equations or taken verbatim from papers)
import numpy as np, pandas as pd, matplotlib, re, os
matplotlib.use("Agg"); import matplotlib.pyplot as plt
from scipy.optimize import brentq
OUT = "figs"; os.makedirs(OUT, exist_ok=True)
NAVY, BLUE, ORANGE, GREEN, GREY, RED, PURP = "#0E1B4D", "#2F5CF0", "#EB6834", "#1BAF7A", "#6B7590", "#C8323C", "#7A4FD0"
plt.rcParams.update({"font.size": 10, "axes.spines.top": False, "axes.spines.right": False, "figure.dpi": 110})
src = open("/home/claude/mdl/stepD/stepD_formula_release.py").read()
exec(src[src.index("DATA = {"):src.index("DRUG_OF")])
def fick_F(tau):
    tau = np.atleast_1d(np.asarray(tau, float)); F = np.empty_like(tau); s = tau < 0.05
    F[s] = 6*np.sqrt(tau[s]/np.pi) - 3*tau[s]; n = np.arange(1, 200)[:, None]
    F[~s] = 1 - 6/np.pi**2*np.sum(np.exp(-(n*np.pi)**2*tau[~s])/n**2, axis=0); return np.clip(F, 0, 1)
TAU50 = brentq(lambda s: fick_F(s)[0]-0.5, 1e-5, 1)
RES = pd.read_csv("/home/claude/mdl/stepD/stepD_results.csv")

# ---- Fig 1: empirical model shapes (each normalised to reach 50 % at t = 1)
t = np.linspace(0, 4, 400)
fig, ax = plt.subplots(figsize=(8.6, 4.4))
ax.plot(t, np.clip(0.5*t, 0, 1)*100, color=GREY, lw=2, label="zero order, F = k₀t")
ax.plot(t, (1-np.exp(-np.log(2)*t))*100, color=BLUE, lw=2, label="first order, F = 1 − exp(−k₁t)")
ax.plot(t, np.clip(0.5*np.sqrt(t), 0, 1)*100, color=GREEN, lw=2, label="Higuchi, F = k_H t^½")
for n_, ls in [(0.43, "--"), (0.85, ":")]:
    ax.plot(t, np.clip(0.5*t**n_, 0, 1)*100, color=ORANGE, lw=2, ls=ls, label=f"Korsmeyer–Peppas, n = {n_}")
ax.plot(t, fick_F(TAU50*t)*100, color=NAVY, lw=2.6, label="Fick sphere (exact, Crank)")
for b in (0.6, 2.0):
    a = 1/np.log(2)**(1/b); ax.plot(t, (1-np.exp(-(t/a)**b))*100, color=PURP, lw=1.6, ls="-." if b < 1 else (0, (5, 2)), label=f"Weibull, b = {b}")
ax.axhline(50, color="#E1E6F3", lw=1, zorder=0); ax.axvline(1, color="#E1E6F3", lw=1, zorder=0)
ax.set_xlabel("t / t₅₀"); ax.set_ylabel("released (%)"); ax.set_ylim(0, 102); ax.legend(fontsize=8, ncol=2, loc="lower right")
ax.set_title("Shapes of common release models, all passing 50 % at t = t₅₀", loc="left", fontsize=11)
plt.tight_layout(); plt.savefig(f"{OUT}/f1_empirical_shapes.png", dpi=200); plt.close()

# ---- Fig 2: time-scale map, t50 = 0.0305 R²/D vs measured t50 of gelatin microspheres
R = np.logspace(-1, 2.3, 200)  # µm
fig, ax = plt.subplots(figsize=(8.6, 5))
for D, col, lab in [(1e-5, "#B8C4EA", "D = 10⁻⁵"), (1e-6, BLUE, "D = 10⁻⁶ (small drug in hydrated gelatin)"), (1e-7, "#5A78E8", "D = 10⁻⁷"), (1e-8, GREEN, "D = 10⁻⁸ (dense gelatin film)"), (1e-12, ORANGE, "D = 10⁻¹²"), (1e-14, RED, "D = 10⁻¹⁴")]:
    ax.plot(R, TAU50*(R*1e-4)**2/D, color=col, lw=2, label=f"Fick: {lab} cm²/s")
d = RES.dropna(subset=["t50_data_h"])
ax.scatter(d.R_um, d.t50_data_h*3600, s=55, color=NAVY, zorder=5, edgecolor="white", label="measured t₅₀, 8 gelatin papers (17 curves)")
for y, lab in [(1, "1 s"), (60, "1 min"), (3600, "1 h"), (86400, "1 d"), (604800, "1 wk")]:
    ax.axhline(y, color="#E1E6F3", lw=1, zorder=0); ax.text(0.105, y*1.15, lab, fontsize=8, color=GREY)
ax.set_xscale("log"); ax.set_yscale("log"); ax.set_xlim(0.1, 200); ax.set_ylim(1e-6, 1e8)
ax.set_xlabel("particle radius R (µm)"); ax.set_ylabel("time to release 50 %, t₅₀ (s)"); ax.legend(fontsize=7.6, loc="upper left")
ax.set_title("Time-scale map: diffusion prediction vs measured release of gelatin microspheres", loc="left", fontsize=11)
plt.tight_layout(); plt.savefig(f"{OUT}/f2_timescale_map.png", dpi=200); plt.close()

# ---- Fig 3: hydrogel diffusion models
phi = np.linspace(0, 0.6, 300)
fig, axs = plt.subplots(1, 2, figsize=(11.5, 4.3))
a = axs[0]
a.plot(phi, ((1-phi)/(1+phi))**2, color=BLUE, lw=2.4, label="Mackie–Meares, ((1−φ)/(1+φ))²")
pts = [("Kodra MS/K-1", 27.2), ("Kodra MS/K-2", 24.0), ("Kodra MS/K-3", 13.6), ("Zhang pH 7.4", 6.27), ("Zhang pH 6.0", 6.54)]
for k, (lab_, Q_) in enumerate(pts):
    p_ = 1/Q_; a.plot(p_, ((1-p_)/(1+p_))**2, "o", color=[GREEN, GREEN, GREEN, ORANGE, ORANGE][k], ms=7)
a.text(0.06, 0.93, "Kodra 2026 (Q = 13.6–27)", color=GREEN, fontsize=8); a.text(0.17, 0.55, "Zhang 2023 (Q ≈ 6.4)", color=ORANGE, fontsize=8)
a.axvspan(0.05, 0.30, color="#E1E6F3", alpha=.6, zorder=0); a.text(0.31, 0.35, "hydrated gelatin band\nφ = 0.05–0.30", fontsize=8, color=GREY)
a.set_xlabel("polymer volume fraction φ = 1/Q"); a.set_ylabel("D_gel / D_w"); a.set_ylim(0, 1.02); a.legend(fontsize=8)
a.set_title("(a) obstruction model with measured swelling", loc="left", fontsize=10.5)
b = axs[1]; cw = np.linspace(0, 1, 200)
for beta, col in [(3.2, GREEN), (6.8, BLUE), (9.8, RED)]:
    b.plot(cw, np.exp(-beta*(1-cw)), color=col, lw=2, label=f"β = {beta}")
b.set_yscale("log"); b.set_xlabel("local water content C_w / C_w,eq"); b.set_ylabel("D / D_eq"); b.legend(fontsize=8, title="Fujita-type, Abbasi 2008", title_fontsize=8)
b.set_title("(b) water-dependent diffusivity (β range of Abbasi 2008)", loc="left", fontsize=10.5)
plt.tight_layout(); plt.savefig(f"{OUT}/f3_hydrogel_models.png", dpi=200); plt.close()

# ---- Fig 4: degradation models vs Fick
tt = np.linspace(0, 3, 400)
fig, ax = plt.subplots(figsize=(8.4, 4.3))
ax.plot(tt, fick_F(TAU50*tt)*100, color=NAVY, lw=2.4, label="Fick sphere, constant D")
for k, ls in [(0.5, "--"), (1.5, ":")]:
    # D(t) = D0 exp(k t): tau = integral D dt / R² ; scaled so that k→0 reproduces Fick
    tau = TAU50*(np.exp(k*tt)-1)/k; ax.plot(tt, fick_F(tau)*100, color=BLUE, lw=2, ls=ls, label=f"bulk degradation, D = D₀ exp(kt), k·t₅₀,Fick = {k}")
for kk in [0.5]:
    F = 1-np.clip(1-0.2063*tt, 0, 1)**3; ax.plot(tt, F*100, color=ORANGE, lw=2.2, label="surface erosion (Hopfenberg sphere)")
ax.set_xlabel("t / t₅₀ of the constant-D Fick case"); ax.set_ylabel("released (%)"); ax.set_ylim(0, 102); ax.legend(fontsize=8)
ax.set_title("Degradation changes the shape: acceleration (bulk) or near-linear release (surface)", loc="left", fontsize=10.5)
plt.tight_layout(); plt.savefig(f"{OUT}/f4_degradation_models.png", dpi=200); plt.close()

# ---- Fig 5: reversible binding slows release, D_eff = D/(1+K_b)
tt = np.logspace(-3, 9, 500)
Rcm, D = 10e-4, 5e-6
fig, ax = plt.subplots(figsize=(8.4, 4.3))
for Kb, col in [(0, NAVY), (1e2, "#5A78E8"), (1e4, BLUE), (1e6, PURP), (1e8, RED)]:
    ax.plot(tt, fick_F(D/(1+Kb)*tt/Rcm**2)*100, color=col, lw=2, label=f"K_b = {Kb:.0e}" if Kb else "no binding")
for y, lab in [(1, "1 s"), (3600, "1 h"), (86400, "1 d"), (604800, "1 wk"), (2.6e6, "1 mo")]:
    ax.axvline(y, color="#E1E6F3", lw=1, zorder=0); ax.text(y, 103, lab, fontsize=8, color=GREY, ha="center")
ax.set_xscale("log"); ax.set_ylim(0, 108); ax.set_xlabel("time (s, log)"); ax.set_ylabel("released (%)")
ax.legend(fontsize=8, title="R = 10 µm, D = 5×10⁻⁶ cm²/s", title_fontsize=8, loc="center left")
ax.set_title("Linear reversible binding (Crank ch. 14): each factor 100 in K_b shifts release by 100×", loc="left", fontsize=10.5)
plt.tight_layout(); plt.savefig(f"{OUT}/f5_binding.png", dpi=200); plt.close()

# ---- Fig 6: measured release curves of the 8 gelatin papers
fig, axs = plt.subplots(2, 4, figsize=(15, 7))
MK = ["o", "s", "^"]; COL = [BLUE, ORANGE, GREEN]
TITLE = {"Morphine GMS": "morphine — Jin 2023", "Diclofenac GMS": "diclofenac — Saravanan 2011", "Ketoprofen GMS": "ketoprofen — Kodra 2026", "Vancomycin GMS": "vancomycin — Zhang 2023",
         "Gentamicin GMS (Chang)": "gentamicin — Chang 2023", "Gentamicin m-EmG (Hu)": "gentamicin — Hu 2024", "bFGF GMS": "bFGF — Lan 2017", "Icariin GMs": "icariin — Liu 2022"}
for ax, (case, d) in zip(axs.ravel(), DATA.items()):
    for j, (name, (t_, y_)) in enumerate(d["series"].items()):
        t_, y_ = np.asarray(t_, float), np.asarray(y_, float)
        ax.plot(t_, y_, MK[j % 3] + "-", color=COL[j % 3], lw=1.4, ms=5, label=name)
    ax.set_title(TITLE[case], loc="left", fontsize=10); ax.set_xlabel("time (h)")
    ax.set_ylabel({"%": "released (%)", "mg/mL": "concentration (mg/mL)", "mg": "released (mg)"}[d["unit"]])
    ax.legend(fontsize=6.8)
fig.suptitle("Release data extracted from the full texts (figure and page cited in the reference list)", x=.01, ha="left", fontsize=12)
plt.tight_layout(); plt.savefig(f"{OUT}/f6_gelatin_release_data.png", dpi=170); plt.close()

# ---- Fig 7: design-parameter effects from explicit numbers (Excel audit sheet)
fig, axs = plt.subplots(2, 3, figsize=(14, 7.6))
a = axs[0, 0]; xs = ["1 h", "4 h", "12 h"]
a.bar(np.arange(3)-0.2, [8.34, 4.51, 1.44], 0.4, color=BLUE, label="swelling ratio")
a2 = a.twinx(); a2.bar(np.arange(3)+0.2, [0.0103, 0.0062, 0.0046], 0.4, color=ORANGE, label="k_fast (h⁻¹)")
a.set_xticks(range(3)); a.set_xticklabels(xs); a.set_xlabel("glutaraldehyde cross-linking time"); a.set_ylabel("swelling ratio", color=BLUE); a2.set_ylabel("k_fast (h⁻¹)", color=ORANGE)
a.set_title("(a) Dinarvand 2005: cross-linking time", loc="left", fontsize=10); a2.spines["right"].set_visible(True)
a = axs[0, 1]; ga = ["12 %", "21 %", "35 %"]
a.plot(ga, [0.009, 0.0062, 0.004], "o-", color=ORANGE, label="k_fast"); a.plot(ga, [0.0035, 0.0019, 0.0008], "s-", color=NAVY, label="k_slow")
a.set_xlabel("glutaraldehyde level"); a.set_ylabel("rate constant (h⁻¹)"); a.legend(fontsize=8); a.set_title("(b) Dinarvand 2005: cross-linker level", loc="left", fontsize=10)
a = axs[0, 2]; frm = ["GE", "B1", "B2", "B3", "CMCS"]
a.plot(frm, [328, 346, 357, 396, 426], "o-", color=BLUE, label="equilibrium swelling (%)")
a3 = a.twinx(); a3.plot(frm, [76, 71, 67, 62, 48], "s--", color=ORANGE, label="encapsulation efficiency (%)"); a3.spines["right"].set_visible(True)
a.set_ylabel("swelling (%)", color=BLUE); a3.set_ylabel("EE (%)", color=ORANGE); a.set_xlabel("CMCS share: 0 → 100 %")
a.set_title("(c) Kanth 2017: blend ratio (5-FU)", loc="left", fontsize=10)
a = axs[1, 0]; dia = [7.03, 5.89, 4.63, 3.2, 2.29, 1.99]
a.bar(range(6), dia, color=GREEN); a.set_xticks(range(6)); a.set_xticklabels(list("ABCDEF")); a.set_ylabel("mean diameter (µm)")
a.set_title("(d) Mladenovska 2002: six series; r(size, release rate) = 0.945", loc="left", fontsize=10)
a = axs[1, 1]; a.bar(["20 %", "50 %", "80 %"], [17.4, 60, 96.6], color=PURP); a.set_xlabel("degree of cross-linking (genipin)"); a.set_ylabel("BMP-2 loading efficiency (%)")
a.set_title("(e) Solorio 2010: binding grows with cross-linking", loc="left", fontsize=10)
a = axs[1, 2]; frm2 = ["SD-CIP", "CIP–GA 10%", "CIP–GA 25%", "CIP–GA 75%"]
a.bar(np.arange(4)-0.2, [np.nan, 11, 14, np.nan], 0.4, color="#9AA6C8", label="1 h"); a.bar(np.arange(4)+0.2, [3, 23, 29, 1], 0.4, color=NAVY, label="6 h")
a.set_xticks(range(4)); a.set_xticklabels(frm2, fontsize=8); a.set_ylabel("dissolved (%)"); a.legend(fontsize=8)
a.set_title("(f) Monrreal-Ortega 2025: R ≈ 1.8 µm, still < 30 % in 6 h", loc="left", fontsize=10)
fig.suptitle("Design-parameter effects reported in the gelatin-microsphere literature (explicit numbers only, no interpolation)", x=.01, ha="left", fontsize=12)
plt.tight_layout(); plt.savefig(f"{OUT}/f7_design_parameters.png", dpi=170); plt.close()

# ---- Fig 8: Abbasi 2008 constants vs free-water diffusivity of caffeine
lab = ["5G 0M .10C", "5G 0M .05C", "5G 4M .10C", "5G 4M .05C", "4G 0M .10C", "4G 0M .05C", "4G 4M .10C", "4G 4M .05C"]
Dw = [4.4, 4.4, 3.5, 3.5, 5.6, 5.6, 4.8, 4.8]; Dc = [3.8, 3.2, 3.0, 3.3, 2.5, 2.5, 3.5, 3.5]
fig, ax = plt.subplots(figsize=(9, 4.2)); x = np.arange(8)
ax.bar(x-0.2, Dw, 0.4, color=BLUE, label="D water, eq (fitted)"); ax.bar(x+0.2, Dc, 0.4, color=ORANGE, label="D caffeine, eq (fitted)")
# Wilke–Chang caffeine in free water at 25 °C (Le Bas V ≈ 192 cm³/mol) and water self-diffusion at 25 °C (2.3e-5)
Dcaf = 7.4e-8*np.sqrt(2.6*18.015)*298.15/(0.890*192**0.6)
ax.axhline(Dcaf*1e5, color=RED, lw=2, ls="--"); ax.text(7.45, Dcaf*1e5+0.1, f"caffeine in free water ≈ {Dcaf*1e5:.2f}", color=RED, ha="right", fontsize=8.5)
ax.axhline(2.3, color=NAVY, lw=1.5, ls=":"); ax.text(7.45, 2.4, "water self-diffusion ≈ 2.3", color=NAVY, ha="right", fontsize=8.5)
ax.set_xticks(x); ax.set_xticklabels(lab, rotation=30, fontsize=8); ax.set_ylabel("D (×10⁻⁵ cm²/s)"); ax.legend(fontsize=8, loc="upper left")
ax.set_title("Abbasi 2008, Table 1: fitted gel diffusivities exceed the free-water limits", loc="left", fontsize=10.5)
plt.tight_layout(); plt.savefig(f"{OUT}/f8_abbasi_constants.png", dpi=200); plt.close()
print("done", TAU50, Dcaf)
