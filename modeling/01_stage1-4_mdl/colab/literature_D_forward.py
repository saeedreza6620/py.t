# %% [markdown]
# # Forward prediction with literature diffusivities (no fitting)
# Step A: constant D taken from independent measurements / physical estimates -> Fick sphere -> compare with data.
# Step B: same D as the wet-gel value D_eq in the Abbasi et al. (2008) water-dependent relation -> compare.
# Run after (or inside) gelatin_release_model.py; it re-uses DATA, fick_F, MASTER, MASTER_B, BETAS, interp_curve.

# %% Setup
import os, numpy as np, pandas as pd, matplotlib
if "fick_F" not in globals():
    matplotlib.use("Agg")
    exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "gelatin_release_model.py")).read())
import matplotlib.pyplot as plt
from scipy.optimize import brentq
OUTD = "figures_litD"; os.makedirs(OUTD, exist_ok=True)

# %% Free-solution diffusivity at 37 C (Stokes-Einstein estimate; labelled as estimate)
kB, T, ETA = 1.380649e-23, 310.15, 0.692e-3           # J/K, K, Pa s (water, 37 C)
def D0_small(MW, rho=1.3):                               # radius from molecular volume (rho in g/cm3)
    r = (3 * MW / (4 * np.pi * rho * 6.022e23)) ** (1 / 3) * 1e-2   # m
    return kB * T / (6 * np.pi * ETA * r) * 1e4           # cm2/s
def D0_protein(MW):                                       # hydrodynamic radius Rh(nm) = 0.0515 M^0.392
    r = 0.0515 * MW ** 0.392 * 1e-9
    return kB * T / (6 * np.pi * ETA * r) * 1e4
def mackie_meares(phi): return ((1 - phi) / (1 + phi)) ** 2

# Literature anchors (measured, independent of our release data)
ANCHORS = {
    "rhodamine B (479 Da) in GelMA 5-10% w/v, FRAP-type imaging [Dogan 2023]": (2.56e-6, 5.54e-6),
    "potassium sorbate (150 Da) in glycerol-plasticized 20% gelatin film, 5-35 C [Wang 2016]": (1.36e-8, 5.20e-8),
}
D_FILM_LOW = 1.36e-8   # lowest measured small-molecule D in a dense gelatin film -> conservative lower bound

DRUG = {  # case: (drug, MW, kind)
    "Morphine GMS": ("morphine", 285.3, "small"),
    "Diclofenac GMS": ("diclofenac Na", 318.1, "small"),
    "Ketoprofen GMS": ("ketoprofen", 254.3, "small"),
    "Vancomycin GMS": ("vancomycin", 1449.3, "small"),
    "Gentamicin GMS (Chang)": ("gentamicin", 477.6, "small"),
    "Gentamicin m-EmG (Hu)": ("gentamicin", 477.6, "small"),
    "bFGF GMS": ("bFGF", 17200.0, "protein"),
    "Icariin GMs": ("icariin", 676.7, "small"),
}
RFALLBACK = {"Icariin GMs": (5.0, 55.0), "bFGF GMS": (17.5, 17.5)}   # icariin: only 10-110 um diameter reported

def D_gel_range(case):
    _, MW, kind = DRUG[case]
    D0 = D0_small(MW) if kind == "small" else D0_protein(MW)
    lo, hi = (mackie_meares(0.30), mackie_meares(0.05)) if kind == "small" else (0.05, 0.60)
    return D0, D0 * lo, D0 * hi

def radii(case):
    R = DATA[case]["R"]
    vals = [v for v in (R.values() if isinstance(R, dict) else [R]) if v]
    return (min(vals), max(vals)) if vals else RFALLBACK[case]

def t_half_obs(t, y, unit):
    yn = y / 100 if unit == "%" else y / np.max(y)
    if unit == "%" and yn.max() < 0.75: yn = yn / yn.max()        # plateau-limited (e.g. morphine 59 %)
    i = int(np.argmax(yn >= 0.5))
    if yn[i] < 0.5: return np.nan
    return np.interp(0.5, [yn[i - 1], yn[i]], [t[i - 1], t[i]]) if i > 0 else t[0]

TAU50_F = brentq(lambda s: fick_F(s)[0] - 0.5, 1e-6, 1)
TAU50_SW = brentq(lambda s: interp_curve(MASTER["swell"], s) - 0.5, 1e-6, 300)
TAU50_B12 = brentq(lambda s: interp_curve(MASTER_B[-1], s) - 0.5, 1e-6, 300)
print(f"tau50: Fick {TAU50_F:.4f} | Abbasi beta_d=8.5 {TAU50_SW:.4f} (x{TAU50_SW/TAU50_F:.1f}) | beta_d=12 {TAU50_B12:.4f} (x{TAU50_B12/TAU50_F:.1f})")

# %% Table: literature D vs fitted apparent D, predicted vs observed t50
rows = []
for case, d in DATA.items():
    D0, Dlo, Dhi = D_gel_range(case); Rlo, Rhi = radii(case)
    for name, (t, y) in d["series"].items():
        t = np.array(t, float); y = np.array(y, float)
        t50 = t_half_obs(t, y, d["unit"]) * 3600                       # s
        R = radius(case, name) or np.sqrt(Rlo * Rhi)
        Rcm = R * 1e-4
        fit = RES[(RES.case == case) & (RES.formulation == name) & (RES.model == "Fick (const D)")].iloc[0]
        Dapp = fit.k_per_h / 3600 * Rcm ** 2
        rows.append(dict(case=case, formulation=name, drug=DRUG[case][0], R_um=R, D0_est=D0, Dgel_lo=Dlo, Dgel_hi=Dhi,
                         D_app_fit=Dapp, t50_obs_h=t50 / 3600,
                         t50_pred_s_hi=TAU50_F * Rcm**2 / Dhi, t50_pred_s_lo=TAU50_F * Rcm**2 / Dlo,
                         t50_pred_s_film=TAU50_F * Rcm**2 / D_FILM_LOW,
                         t50_pred_s_abbasi=TAU50_SW * Rcm**2 / Dhi,
                         gap=t50 / (TAU50_F * Rcm**2 / Dhi), gap_film=t50 / (TAU50_F * Rcm**2 / D_FILM_LOW)))
LIT = pd.DataFrame(rows); LIT.to_csv("literature_D_forward.csv", index=False)
pd.set_option("display.float_format", lambda v: f"{v:.3g}")
print(LIT[["drug", "formulation", "R_um", "Dgel_lo", "Dgel_hi", "D_app_fit", "t50_obs_h", "t50_pred_s_hi", "t50_pred_s_film", "gap"]].to_string(index=False))

# %% Figure 1: where the diffusivities sit (log scale)
NAVY, BLUE, ORANGE, GREEN, GREY = "#0E1B4D", "#2F5CF0", "#EB6834", "#1BAF7A", "#8A93AB"
fig, ax = plt.subplots(figsize=(11, 6.4))
cases = list(DATA)
for i, case in enumerate(cases):
    D0, Dlo, Dhi = D_gel_range(case)
    ax.plot([Dlo, Dhi], [i, i], color=BLUE, lw=9, solid_capstyle="round", alpha=.85, label="hydrated gelatin: D0 x hindrance" if i == 0 else None)
    ax.plot(D0, i, "|", color=NAVY, ms=18, mew=2.5, label="free solution D0 (37 C, Stokes-Einstein)" if i == 0 else None)
    sub = LIT[LIT.case == case]
    ax.plot(sub.D_app_fit, [i] * len(sub), "o", color=ORANGE, ms=9, mec="white", label="apparent D fitted to release data" if i == 0 else None)
ax.axvspan(*ANCHORS["potassium sorbate (150 Da) in glycerol-plasticized 20% gelatin film, 5-35 C [Wang 2016]"], color=GREEN, alpha=.18, label="measured: small molecule in dense gelatin film")
ax.axvspan(*ANCHORS["rhodamine B (479 Da) in GelMA 5-10% w/v, FRAP-type imaging [Dogan 2023]"], color=NAVY, alpha=.10, label="measured: rhodamine B in GelMA hydrogel")
SRC = {"Morphine GMS": "Jin 2023", "Diclofenac GMS": "Saravanan 2011", "Ketoprofen GMS": "Kodra 2026", "Vancomycin GMS": "Zhang 2023",
       "Gentamicin GMS (Chang)": "Chang 2023", "Gentamicin m-EmG (Hu)": "Hu 2024", "bFGF GMS": "Lan 2017", "Icariin GMs": "Liu 2022"}
ax.set_yticks(range(len(cases))); ax.set_yticklabels([f"{DRUG[c][0]} ({SRC[c]})" for c in cases])
ax.set_xscale("log"); ax.set_xlim(1e-15, 1e-4); ax.set_xlabel("diffusion coefficient D (cm²/s)")
ax.invert_yaxis(); ax.legend(loc="upper left", bbox_to_anchor=(0, -0.12), ncol=2, fontsize=8.5, frameon=False)
ax.set_title("Measured / estimated D in gelatin vs. D needed to fit the release curves", loc="left")
plt.tight_layout(); plt.savefig(f"{OUTD}/litD_1_diffusivity_map.png", dpi=200); plt.close()

# %% Figure 2: forward prediction (no fitting) vs data, log time from 1 ms to 60 days
fig, axs = plt.subplots(2, 4, figsize=(17, 7.6), sharey=True)
tt = np.logspace(-3, np.log10(60 * 86400), 600)                         # s
for ax, case in zip(axs.ravel(), cases):
    d = DATA[case]; D0, Dlo, Dhi = D_gel_range(case); Rlo, Rhi = radii(case); Rc = np.sqrt(Rlo * Rhi) * 1e-4
    lo = fick_F(Dlo * tt / Rc**2) * 100; hi = fick_F(Dhi * tt / Rc**2) * 100
    ax.fill_between(tt, lo, hi, color=BLUE, alpha=.35, lw=0, label="Fick, literature D (range)")
    ax.plot(tt, interp_curve(MASTER["swell"], Dhi * tt / Rc**2) * 100, color=ORANGE, lw=2.2, ls="--", label="Fick + swelling (Abbasi), D_eq = literature D")
    ax.plot(tt, fick_F(D_FILM_LOW * tt / Rc**2) * 100, color=GREEN, lw=2.2, label="Fick, lowest measured D (dense film)")
    for j, (name, (t, y)) in enumerate(d["series"].items()):
        t = np.array(t, float) * 3600; y = np.array(y, float)
        yn = y if d["unit"] == "%" else 100 * y / np.max(y)
        ax.plot(t, yn, ["o", "s", "^"][j], color=NAVY, ms=5.5, mec="white", label="extracted data" if j == 0 else None)
    ax.set_xscale("log"); ax.set_xlim(1e-3, 60 * 86400); ax.set_ylim(-3, 105)
    for lab, s in [("1 s", 1), ("1 min", 60), ("1 h", 3600), ("1 d", 86400), ("1 wk", 604800)]:
        ax.axvline(s, color="#E1E6F3", lw=1, zorder=0); ax.text(s, 101, lab, fontsize=7.5, color=GREY, ha="center")
    ax.set_title(f"{DRUG[case][0]} — {SRC[case]}" + (" (R assumed)" if case in RFALLBACK else ""), fontsize=10.5, loc="left")
    ax.set_xlabel("time (s, log)")
axs[0, 0].set_ylabel("released (%)"); axs[1, 0].set_ylabel("released (%)")
axs[0, 0].legend(fontsize=7.6, loc="center left")
fig.suptitle("Forward prediction with independent diffusivities (no parameter fitted) vs extracted release data", x=0.01, ha="left", fontsize=12.5)
plt.tight_layout(); plt.savefig(f"{OUTD}/litD_2_forward_vs_data.png", dpi=170); plt.close()

# %% Figure 3: the time gap
fig, ax = plt.subplots(figsize=(10, 4.6))
lab = [f"{r.drug} {r.formulation.split(' (')[0]}" for r in LIT.itertuples()]
x = np.arange(len(LIT))
ax.bar(x, LIT.gap, color=BLUE, alpha=.85, label="observed t50 / predicted t50 (hydrated-gel D)")
ax.bar(x, LIT.gap_film, color=GREEN, alpha=.9, width=.45, label="observed t50 / predicted t50 (lowest film D)")
ax.set_yscale("log"); ax.set_xticks(x); ax.set_xticklabels(lab, rotation=60, ha="right", fontsize=8.5)
ax.axhline(1, color=NAVY, lw=1); ax.set_ylabel("how many times slower than diffusion predicts")
ax.set_ylim(0.5, 1e10); ax.legend(fontsize=9, loc="upper left", ncol=2); ax.set_title("Observed release is 10²–10⁸ times slower than diffusion through gelatin predicts", loc="left", fontsize=11)
plt.tight_layout(); plt.savefig(f"{OUTD}/litD_3_time_gap.png", dpi=200); plt.close()
print("figures in", OUTD)
