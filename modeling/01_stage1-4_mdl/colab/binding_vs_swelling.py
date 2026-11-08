# %% [markdown]
# # Two ways to slow diffusion, compared without fitting
# (1) Abbasi et al. 2008: D depends on local water content (Fujita type) -> at most ~4-5x slower here.
# (2) Reversible drug-matrix binding (ion-exchange type, the topic of Abdekhodaie & Wu, Biomaterials 2006):
#     with fast, linear, reversible binding, only free drug diffuses and D_eff = D / (1 + K_b),
#     K_b = bound/free ratio at equilibrium (Crank, The Mathematics of Diffusion, ch. 14).
#     Linear binding gives the strongest slow-down for a given K_b (Langmuir saturation only weakens it).
# NOTE: the exact equations of Abdekhodaie & Wu (2006) were not available; this is the generic binding form.

# %% Setup (re-uses literature_D_forward.py objects)
import os, numpy as np, pandas as pd, matplotlib
if "LIT" not in globals():
    matplotlib.use("Agg")
    here = os.path.dirname(os.path.abspath(__file__))
    exec(open(os.path.join(here, "literature_D_forward.py")).read())
import matplotlib.pyplot as plt
from matplotlib.gridspec import GridSpec

# required bound/free ratio so that literature D reproduces the observed time scale
LIT["Kb_required_hi"] = LIT.Dgel_hi / LIT.D_app_fit - 1
LIT["Kb_required_lo"] = LIT.Dgel_lo / LIT.D_app_fit - 1
LIT["Kb_required_film"] = D_FILM_LOW / LIT.D_app_fit - 1
LIT.to_csv("binding_required_Kb.csv", index=False)
print(LIT[["drug", "formulation", "Kb_required_lo", "Kb_required_hi", "Kb_required_film"]].to_string(index=False))
SW = TAU50_SW / TAU50_F
print(f"Abbasi swelling slow-down factor (beta_d = 8.5): {SW:.2f}")

# %% Figure: binding sweep vs data (4 cases) + required K_b for all formulations
NAVY, BLUE, ORANGE, GREEN, GREY = "#0E1B4D", "#2F5CF0", "#EB6834", "#1BAF7A", "#8A93AB"
SHOW = [("Gentamicin GMS (Chang)", "1.0dM-G"), ("Vancomycin GMS", "pH 7.4"), ("Diclofenac GMS", "GM1 (9.8%)"), ("bFGF GMS", "A porous")]
KB = [0, 1e2, 1e4, 1e6, 1e8]
KCOL = plt.cm.Purples(np.linspace(0.35, 0.95, len(KB)))
fig = plt.figure(figsize=(17, 9.2)); gs = GridSpec(2, 4, height_ratios=[1, 1.05], hspace=0.55, wspace=0.18)
tt = np.logspace(-3, np.log10(60 * 86400), 600)
for j, (case, name) in enumerate(SHOW):
    ax = fig.add_subplot(gs[0, j]); d = DATA[case]
    D0, Dlo, Dhi = D_gel_range(case); R = (radius(case, name) or 17.5) * 1e-4
    for kb, c in zip(KB, KCOL):
        ax.plot(tt, fick_F(Dhi / (1 + kb) * tt / R**2) * 100, color=c, lw=2.4, label=f"K_b = {kb:.0e}" if kb else "K_b = 0 (no binding)")
    ax.plot(tt, interp_curve(MASTER["swell"], Dhi * tt / R**2) * 100, color=ORANGE, lw=2, ls="--", label="Abbasi swelling (no binding)")
    t, y = map(lambda a: np.array(a, float), d["series"][name]); yn = y if d["unit"] == "%" else 100 * y / y.max()
    ax.plot(t * 3600, yn, "o", color=NAVY, ms=6, mec="white", label="data", zorder=5)
    ax.set_xscale("log"); ax.set_xlim(1e-3, 60 * 86400); ax.set_ylim(-3, 105)
    for lab, s in [("1 s", 1), ("1 h", 3600), ("1 d", 86400)]:
        ax.axvline(s, color="#E1E6F3", lw=1, zorder=0); ax.text(s, 100.5, lab, fontsize=8, color=GREY, ha="center")
    ax.set_title(f"{DRUG[case][0]} — {SRC[case]} ({name.split(' (')[0]})", fontsize=10.5, loc="left")
    ax.set_xlabel("time (s, log)")
    if j == 0: ax.set_ylabel("released (%)"); ax.legend(fontsize=7.8, loc="center left")
ax = fig.add_subplot(gs[1, :])
lab = [f"{r.drug} {r.formulation.split(' (')[0]}" for r in LIT.itertuples()]; x = np.arange(len(LIT))
ax.vlines(x, LIT.Kb_required_lo, LIT.Kb_required_hi, color=BLUE, lw=10, alpha=.8, label="required K_b with hydrated-gel D (range)")
ax.plot(x, LIT.Kb_required_film, "D", color=GREEN, ms=8, label="required K_b with lowest film D")
ax.axhline(SW - 1, color=ORANGE, lw=2, ls="--"); ax.text(len(LIT) - 0.5, (SW - 1) * 1.6, "equivalent slow-down of Abbasi swelling (≈ 4.4×)", color="#C24E17", ha="right", fontsize=9.5)
ax.set_yscale("log"); ax.set_ylim(1, 1e9); ax.set_xticks(x); ax.set_xticklabels(lab, rotation=35, ha="right", fontsize=9)
ax.set_ylabel("bound / free drug ratio K_b needed"); ax.legend(fontsize=9, loc="upper left")
ax.set_title("How strong would drug–gelatin binding have to be? (D_eff = D / (1 + K_b), no fitting of D)", loc="left", fontsize=11)
fig.suptitle("Binding (ion-exchange type) vs swelling (Abbasi 2008) as the slow-down mechanism", x=0.01, ha="left", fontsize=13)
plt.savefig(f"{OUTD}/litD_4_binding_vs_swelling.png", dpi=170, bbox_inches="tight"); plt.close()
print("saved", f"{OUTD}/litD_4_binding_vs_swelling.png")
