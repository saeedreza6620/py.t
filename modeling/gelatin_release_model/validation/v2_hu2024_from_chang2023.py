"""V2 — transfer test between two papers: Chang 2023 (Polymers 15:1504) -> Hu 2024 (Materials 17:3578).
Both: gentamicin (cationic), type-B gelatin, GA-crosslinked microspheres, drug loaded by soaking formed spheres.
Nothing is tuned on Hu:
  f_free : from Chang (plateau of the first release phase / final value), 1.0dM-G (0.83) and 2.5dM-G (0.54) as two bounds
  bound  : liberated in proportion to Hu's OWN measured mass loss of drug-free spheres (Fig. 3)
  D      : Wilke-Chang (gentamicin, 37 C) x Mackie-Meares (phi = 0.1); R = 8.05 um (Hu SEM)
Data: Hu Fig. 5 net release (drug-loaded minus drug-free background), normalised to the 8-24 d plateau.
A DIAGNOSTIC fit (f_weak, k_weak on Hu's first 24 h) is reported separately and is NOT part of the validation."""
from common import *
from grm import *
from scipy.optimize import least_squares
out = {}
d = pd.read_csv(os.path.join(DATA, "release_dataset_audited.csv"))
ch = d[d.case_id == "C5_Chang2023_gentamicin"]; hu = d[(d.case_id == "C6_Hu2024_gentamicin") & d.formulation.str.startswith("m-EmG net")]
# ---- Chang: free fraction = mean of 8-192 h plateau / day-32 value
ff = {}
for form, s in ch.groupby("formulation"):
    if form.startswith("0.5"): continue          # 0.5dM-G: early points missing in the figure
    y = s.set_index("time_h").y_value; ff[form] = float(y.loc[[8, 24, 48, 96, 192]].mean() / y.loc[768])
    out[f"chang_{form}"] = dict(f_free=r(ff[form], 3), early_fraction_of_plateau_1h=r(y.loc[1] / y.loc[[8, 24, 48, 96, 192]].mean(), 3),
                               early_fraction_of_plateau_2h=r(y.loc[2] / y.loc[[8, 24, 48, 96, 192]].mean(), 3))
# ---- Hu inputs
g = pd.read_csv(os.path.join(DATA, "hu2024_mass_remaining.csv"))
lib = Liberation.from_mass_remaining(g.t_day.values * DAY, g.mass_remaining_pct.values / 100)
Dw = float(wilke_chang(DRUGS["gentamicin"]["V"])); D = Dw * mackie_meares(0.1); R = 8.05e-4
t_h = hu.time_h.values; y_raw = hu.y_value.values; plateau = y_raw[(t_h >= 192) & (t_h <= 576)].mean(); y = 100 * y_raw / plateau
def part(f): return Particle([Pool(f, name="free"), Pool(1 - f, lib, "bound")], R, D)
for form, f in ff.items():
    pred = 100 * release(t_h * H, part(f))
    out[f"hu_pred_with_{form}"] = dict(f_free=r(f, 3), rmse_all=r(rmse(pred, y)), rmse_after_1d=r(rmse(pred[t_h >= 24], y[t_h >= 24])),
                                       rmse_first_8h=r(rmse(pred[t_h <= 8], y[t_h <= 8])), pred=np.round(pred, 1).tolist())
# ---- prediction B: the whole first-phase pool desorbs first order with the rate seen in Chang's PBS data at 1 h
k_ch = -np.log(1 - out["chang_1.0dM-G"]["early_fraction_of_plateau_1h"]) / H
def part_w(f): return Particle([Pool(f, Liberation("first_order", rate=k_ch), "weak"), Pool(1 - f, lib, "bound")], R, D)
predB = 100 * release(t_h * H, part_w(ff["1.0dM-G"]))
out["hu_pred_B_weak_rate_from_chang"] = dict(k_weak_per_h=r(k_ch * H, 3), half_life_h=r(np.log(2) / k_ch / H, 2), rmse_all=r(rmse(predB, y)),
                                             rmse_after_1d=r(rmse(predB[t_h >= 24], y[t_h >= 24])), rmse_first_8h=r(rmse(predB[t_h <= 8], y[t_h <= 8])),
                                             pred=np.round(predB, 1).tolist())
out["hu_data"] = dict(t_h=t_h.tolist(), y_pct_of_plateau=np.round(y, 1).tolist(), D_cm2s=D, tau_D_s=R ** 2 / (np.pi ** 2 * D))
# ---- diagnostic: what desorption law would the first 24 h need?  (fitted -> NOT validation)
fbest = ff["1.0dM-G"]
def model_w(p, t):
    fw, kw = p
    pp = Particle([Pool(max(fbest - fw, 0), name="free"), Pool(fw, Liberation("first_order", rate=kw), "weak"), Pool(1 - max(fbest - fw, 0) - fw, lib, "bound")], R, D)
    return 100 * release(t * H, pp)
m24 = t_h <= 24
fit = least_squares(lambda p: model_w(p, t_h[m24]) - y[m24], x0=[0.5, 1 / (3 * H)], bounds=([0, 1e-7], [fbest, 1e-2]), x_scale=[0.1, 1e-4])
pw = model_w(fit.x, t_h)
out["diagnostic_weak_pool_fit_on_hu_first_24h"] = dict(f_weak=r(fit.x[0], 3), k_weak_per_h=r(fit.x[1] * H, 4), half_life_h=r(np.log(2) / fit.x[1] / H, 2),
                                                        rmse_first_24h=r(rmse(pw[m24], y[m24])), rmse_after_1d=r(rmse(pw[t_h >= 24], y[t_h >= 24])),
                                                        note="fitted on Hu; shows the size of the missing mechanism, not a validation")
save("v2_hu2024_from_chang2023", out)
tt = np.concatenate([np.geomspace(0.05, 24, 80), np.linspace(24, 780, 120)[1:]])
fig, axs = plt.subplots(1, 2, figsize=(13, 4.3))
for ax, log in zip(axs, (True, False)):
    for form, ls in zip(ff, ("-", "--")):
        ax.plot(tt, 100 * release(tt * H, part(ff[form])), color=GRN, lw=2.2 if ls == "-" else 1.3, ls=ls, label=f"prediction, f_free = {ff[form]:.2f} (Chang {form})")
    ax.plot(tt, 100 * release(tt * H, part_w(ff["1.0dM-G"])), color=BLUE, lw=1.6, label=f"prediction B: first phase desorbs at Chang's PBS rate (t½ = {np.log(2) / k_ch / H:.2f} h)")
    ax.plot(tt, model_w(fit.x, tt), color=ORG, lw=1.3, ls=":", label=f"diagnostic only: + weak pool fitted on Hu ≤ 24 h (t½ = {np.log(2) / fit.x[1] / H:.1f} h)")
    ax.plot(t_h, y, "ko", ms=5, label="Hu 2024, net release (% of plateau)")
    ax.plot(g.t_day * 24, 100 - g.mass_remaining_pct, color=GREY, ls=":", lw=1.2, label="measured mass loss, drug-free spheres (%)")
    ax.set_ylim(0, 112); ax.set_ylabel("cumulative release (%)")
    if log: ax.set_xscale("log"); ax.set_xlim(0.5, 800); ax.set_xlabel("time (h, log)")
    else: ax.set_xlim(0, 800); ax.set_xlabel("time (h)")
axs[0].set_title("(a) Hu 2024 predicted with nothing tuned on Hu (log time)", loc="left", fontsize=9.5)
axs[1].set_title("(b) linear time", loc="left", fontsize=9.5); axs[1].legend(fontsize=7.6, loc="lower right")
fig.tight_layout(); fig.savefig(os.path.join(FIG, "V2_hu2024_from_chang2023.png"), dpi=170); plt.close(fig)
print(json.dumps({k: {kk: vv for kk, vv in v.items() if kk not in ("pred", "t_h", "y_pct_of_plateau")} for k, v in out.items()}, indent=1))
