"""V1 — Cheng (2010) dissertation Ch. 2: GA-crosslinked basic gelatin spheres (R = 50 um swollen), acidic dye,
PBS with/without collagenase 373 ng/ml, five GA levels 0.125-0.875 % v/v. Data: vector extraction (tools/digitize_cheng2010.py).

Information flow (what is calibrated on what):
  D(GA)  : Cheng's published power law (Cheng fitted it to the first 3 days in PBS)                -> taken as given
  mu(GA) : Cheng's Eq. 2.12 with coefficient 10 (Cheng fitted it to the enzyme curves 0.125/0.375/0.875 %) -> taken as given
  f_free : OUR calibration, one number per GA level, from the PBS curves (Fig. 2.6A) only
  Test   : enzyme curves (Figs 2.7, 2.8). GA 0.25 % and 0.625 % were never used by Cheng or by us for any parameter
           -> genuine predictions (f_free interpolated in GA, mu and D from the relations)."""
from common import *
from grm import *
R = 50e-4
d = pd.read_csv(os.path.join(DATA, "cheng2010_release_vector.csv"))
d["ga"] = d.series.str.extract(r"GA ([0-9.]+)").astype(float)
d = d[d.t_day > 0.5]                                   # drop the origin markers
pbs = d[d.figure == "2.6A"]; enz = d[d.figure != "2.6A"]
out = dict(R_um=50, calibration={}, test={})
# ---- calibration: f_free from PBS, closed-form least squares  y = f * Phi(D t / R^2)
fm = {}
for ga, s in pbs.groupby("ga"):
    ph = release_analytical(D_cheng(ga) * s.t_day.values * DAY / R ** 2); y = s.release_pct.values / 100
    f = float(np.dot(ph, y) / np.dot(ph, ph)); fm[ga] = f
    out["calibration"][f"GA {ga}"] = dict(f_free=r(f, 4), D_cm2s=float(D_cheng(ga)), rmse_pct=r(100 * rmse(f * ph, y)), n=len(y))
gas = np.array(sorted(fm)); fms = np.array([fm[g] for g in gas])
f_of = lambda ga: float(np.interp(ga, gas, fms))
def particle(ga, f=None, coeff=10.0):
    f = f_of(ga) if f is None else f
    return Particle([Pool(f, name="free"), Pool(1 - f, Liberation("first_order", rate=float(mu_cheng(ga, coeff))), "bound")], R, float(D_cheng(ga)))
rows = []
for ga, s in enz.groupby("ga"):
    t = s.t_day.values * DAY; y = s.release_pct.values; eb = s.errbar_half_pct.values
    p = particle(ga); pred = 100 * release(t, p)
    held = ga in (0.25, 0.625)
    band = [100 * release(t, particle(ga, f)) for f in (fms.min(), fms.max())]
    within = np.isfinite(eb) & (np.abs(pred - y) <= eb)
    res = dict(role="prediction (held out)" if held else "consistency (mu fitted by Cheng on this curve)", f_free=r(f_of(ga), 4),
               mu_per_day=r(mu_cheng(ga) * DAY, 4), rmse_pct=r(rmse(pred, y)), max_abs_err_pct=r(np.abs(pred - y).max()),
               r2=r(r2(pred, y), 4), points=int(len(y)), points_with_errbar=int(np.isfinite(eb).sum()), within_errbar=int(within.sum()),
               rmse_band_pct=[r(rmse(b, y)) for b in band], t_day=s.t_day.round(2).tolist(), data=s.release_pct.round(2).tolist(),
               pred=np.round(pred, 2).tolist())
    if ga == 0.125:
        res["rmse_with_printed_coeff_0p1"] = r(rmse(100 * release(t, particle(ga, coeff=0.1)), y))
    out["test"][f"GA {ga}"] = res; rows.append((ga, held, res["rmse_pct"]))
out["summary"] = dict(rmse_heldout=[r(x[2]) for x in rows if x[1]], rmse_consistency=[r(x[2]) for x in rows if not x[1]],
                      pooled_rmse_all_enzyme=r(rmse(np.concatenate([v["pred"] for v in out["test"].values()]),
                                                    np.concatenate([v["data"] for v in out["test"].values()]))))
save("v1_cheng2010", out)
# ---- figure
col = {0.125: NAVY, 0.25: GRN, 0.375: ORG, 0.625: PUR, 0.875: BLUE}
fig, axs = plt.subplots(1, 3, figsize=(15, 4.4)); tt = np.linspace(0.01, 20, 220) * DAY
for ga, s in pbs.groupby("ga"):
    t3 = tt[tt <= 3.05 * DAY]
    axs[0].plot(t3 / DAY, 100 * fm[ga] * release_analytical(D_cheng(ga) * t3 / R ** 2), color=col[ga], lw=2, label=f"GA {ga} %: f_free = {fm[ga]:.3f}")
    axs[0].plot(s.t_day, s.release_pct, "s", color=col[ga], mfc="white", mew=1.5, ms=6)
for ga, s in enz.groupby("ga"):
    ax = axs[2] if ga in (0.25, 0.625) else axs[1]; o = out["test"][f"GA {ga}"]
    ax.plot(tt / DAY, 100 * release(tt, particle(ga)), color=col[ga], lw=2, label=f"GA {ga} %  RMSE {o['rmse_pct']:.1f}")
    if ga in (0.25, 0.625):
        lo = 100 * release(tt, particle(ga, fms.min())); hi = 100 * release(tt, particle(ga, fms.max()))
        ax.fill_between(tt / DAY, lo, hi, color=col[ga], alpha=.15, lw=0)
    ax.errorbar(s.t_day, s.release_pct, yerr=s.errbar_half_pct.fillna(0), fmt="o", color=col[ga], mfc="white", mew=1.5, ms=5.5, capsize=2.5, lw=1)
axs[0].set_title("(a) calibration: PBS, no enzyme (Fig. 2.6A)\nfree pool by Fick, one number per GA level", loc="left", fontsize=9.5)
axs[1].set_title("(b) collagenase: GA levels whose μ Cheng fitted\n(consistency check)", loc="left", fontsize=9.5)
axs[2].set_title("(c) collagenase: GA levels never used for any parameter\n(prediction; band = range of f_free)", loc="left", fontsize=9.5)
axs[0].set_xlim(0, 3.1); axs[0].set_ylim(0, 50)
for a in axs[1:]: a.set_xlim(0, 20); a.set_ylim(0, 108)
for a in axs: a.set_xlabel("time (day)"); a.set_ylabel("cumulative release (%)"); a.legend(fontsize=8, loc="lower right")
fig.tight_layout(); fig.savefig(os.path.join(FIG, "V1_cheng2010.png"), dpi=170); plt.close(fig)
print(json.dumps(out["calibration"], indent=1)); print({k: (v["role"][:10], v["rmse_pct"], v["within_errbar"], v["points_with_errbar"], v["rmse_band_pct"]) for k, v in out["test"].items()})
print(out["summary"], out["test"]["GA 0.125"]["rmse_with_printed_coeff_0p1"])
