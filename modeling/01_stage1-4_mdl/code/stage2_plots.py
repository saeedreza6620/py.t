"""Figures and summary table for stage 2 (reads results of stage2_fit.py)."""
import json, os, math
import numpy as np, pandas as pd
import fick_core as fc
from cases import CASES
from plotstyle import plt, save, C, MARKERS, INK2
from stage2_fit import model, D, split, RES, FIG

F = pd.read_pickle(os.path.join(RES, "stage2_fits.pkl"))
curves = pd.read_pickle(os.path.join(RES, "stage2_curves.pkl"))


def degenerate(r):
    p = r["params"]
    if p["k_per_h"] < 1e-8: return True
    if "A" in p and p["A"] > 5 * 1.0 and r["amp_free"] and p["A"] > 50: return True
    if "b" in p and (p["b"] < 1e-6): return True        # boundary: burst not supported
    return False


pref = {}
for (case, form), g in F.groupby(["case", "formulation"]):
    base = g[g.kind == "F"].iloc[0]; bur = g[g.kind == "FB"].iloc[0]
    use_b = False
    if not degenerate(bur) and isinstance(bur["ci95"], dict) and "b" in bur["ci95"]:
        lo = bur["ci95"]["b"][0]
        if lo > 0 and bur["aicc"] < base["aicc"] - 2: use_b = True
    pref[(case, form)] = "FB" if use_b else "F"
json.dump({f"{k[0]}|{k[1]}": v for k, v in pref.items()}, open(os.path.join(RES, "stage2_preferred.json"), "w"), indent=1)

TITLES = {
 "C1_Jin2023_morphine": "Fig 2.1  Jin 2023, morphine GMS (printed data row)",
 "C2_Saravanan2011_diclofenac": "Fig 2.2  Saravanan 2011, diclofenac GMS (vector-extracted)",
 "C3_Kodra2026_ketoprofen": "Fig 2.3  Kodra 2026, ketoprofen GMS (digitized)",
 "C4_Zhang2023_vancomycin": "Fig 2.4  Zhang 2023, vancomycin GMS in dialysis bag (digitized)",
 "C5_Chang2023_gentamicin": "Fig 2.5  Chang 2023, gentamicin GMS (digitized, mg/mL)",
 "C6_Hu2024_gentamicin": "Fig 2.6  Hu 2024, gentamicin m-EmG net of background (digitized, mg)",
 "C7_Lan2017_bFGF": "Fig 2.7  Lan 2017, bFGF porous vs normal GMS (digitized)",
 "C8_Liu2022_icariin": "Fig 2.8  Liu 2022, icariin GMs (digitized)",
}
LOGX = {"C1_Jin2023_morphine", "C5_Chang2023_gentamicin", "C6_Hu2024_gentamicin", "C4_Zhang2023_vancomycin"}
ALL = pd.read_csv(os.path.join(os.path.dirname(RES), "data", "release_dataset_audited.csv"))

for ci, case in enumerate(TITLES):
    g = D[D.case_id == case]
    forms = list(dict.fromkeys(g.sort_values("formulation").formulation))
    fig, axs = plt.subplots(2, 1, figsize=(6.6, 5.6), gridspec_kw=dict(height_ratios=[2.3, 1]), sharex=True)
    ax, axr = axs
    pct = "%" in g.y_unit.iloc[0]; s = 100 if pct else 1
    tmax = g.time_h.max()
    for i, form in enumerate(forms):
        gg = g[g.formulation == form].sort_values("time_h")
        t = gg.time_h.values; y = gg.y_value.values
        sp = split[f"{case}|{form}"]; ntr = sp["n_train"]
        kind = pref[(case, form)]
        amp_free = CASES[case]["amplitude"] == "free"
        tt = np.logspace(math.log10(max(t.min() * 0.3, 1e-3)), math.log10(tmax * 1.05), 400) if case in LOGX else np.linspace(1e-4, tmax * 1.03, 400)
        th = curves[(case, form, kind, "full")]
        ax.plot(tt, model(np.array(th), tt, kind, amp_free) * s, "-", color=C[i], lw=1.6)
        if (case, form, kind, "train") in curves:
            th2 = curves[(case, form, kind, "train")]
            ax.plot(tt, model(np.array(th2), tt, kind, amp_free) * s, "--", color=C[i], lw=1.1)
        ax.plot(t[:ntr], y[:ntr], MARKERS[i], color=C[i], ms=5.5, label=f"{form} ({'F+burst' if kind=='FB' else 'F'})")
        ax.plot(t[ntr:], y[ntr:], MARKERS[i], color=C[i], ms=5.5, mfc="white", mew=1.3)
        ax.axvline(sp["t_split_h"], color=C[i], lw=0.7, ls=":")
        res = y - model(np.array(th), t, kind, amp_free) * s
        axr.plot(t, res, MARKERS[i] + "-", color=C[i], ms=4, lw=0.8)
        # excluded points (occluded etc.) shown as grey x if they have a value
        ex = ALL[(ALL.case_id == case) & (ALL.formulation == form) & (ALL.include_in_fit == False) & ALL.y_value.notna()]
        if len(ex): ax.plot(ex.time_h, ex.y_value, "x", color=INK2, ms=5)
    axr.axhline(0, color=INK2, lw=0.8)
    if case in LOGX: ax.set_xscale("log")
    ax.set_ylabel(g.y_unit.iloc[0].split("(")[0].strip() if not pct else "cumulative release (%)")
    axr.set_ylabel("residual\n(data − full fit)"); axr.set_xlabel("time (h)")
    ax.legend(fontsize=7.5, loc="lower right" if case not in LOGX else "upper left")
    ax.set_title(TITLES[case], fontsize=9.5, loc="left")
    save(fig, os.path.join(FIG, f"Fig2_{ci+1}_{case}.png"))

# summary table of the preferred models
rows = []
for (case, form), kind in pref.items():
    r = F[(F.case == case) & (F.formulation == form) & (F.kind == kind)].iloc[0]
    rb = F[(F.case == case) & (F.formulation == form) & (F.kind == "FB")].iloc[0]
    p = r["params"]; se = r["se"] if isinstance(r["se"], dict) else {}
    corr = None
    if isinstance(r["corr"], list) and len(r["corr"]) > 1: corr = r["corr"][0][1]
    rows.append(dict(case=case, formulation=form, preferred=kind, n=r["n"], p=r["p"],
                     k_per_h=p["k_per_h"], k_se=se.get("k_per_h"), b=p.get("b"), b_se=se.get("b"),
                     A=p.get("A"), A_se=se.get("A"), corr_k_second=corr,
                     burst_fit_b=rb["params"].get("b"), burst_degenerate=degenerate(rb),
                     full_RMSE=r["full_RMSE"], full_MAE=r["full_MAE"], early_RMSE=r["early_RMSE"], late_RMSE=r["late_RMSE"],
                     train_RMSE=r.get("train_RMSE"), test_RMSE=r.get("test_RMSE"), test_MAE=r.get("test_MAE"),
                     t_split_h=split[f"{case}|{form}"]["t_split_h"], fick_adequate_until_h=r["fick_adequate_until_h"],
                     residual_signs=r["residual_signs"], R_um=r.get("R_um"), Dapp_cm2_s=r.get("Dapp_cm2_s"),
                     Dapp_low=r.get("Dapp_low"), Dapp_high=r.get("Dapp_high"), R_unc_source=r.get("R_unc_source")))
T = pd.DataFrame(rows); T.to_csv(os.path.join(RES, "stage2_summary.csv"), index=False)
pd.set_option("display.width", 250)
print(T[["case", "formulation", "preferred", "k_per_h", "k_se", "b", "A", "full_RMSE", "test_RMSE", "early_RMSE", "late_RMSE", "Dapp_cm2_s", "residual_signs"]].to_string())
