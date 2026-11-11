"""V4 — negative control: Saravanan et al. 2011 (J Drug Target 19:96). Diclofenac sodium (anionic) in GA-crosslinked
type-B gelatin microspheres, three loadings (9.8 / 18.3 / 26.7 % w/w), R = 18.9 / 20.3 / 22.7 um, PBS 37 C, 30 days.
Question: can diffusion of free drug with an INDEPENDENT D explain the data? (It cannot: the model must not pass.)
The full multi-pool model is NOT testable on this paper: no mass-loss, swelling or binding data were reported, so the
liberation law of the retained drug is unknown. A fitted apparent D is reported as a diagnostic only."""
from common import *
from grm import *
from scipy.optimize import minimize_scalar
d = pd.read_csv(os.path.join(DATA, "saravanan2011_fig6_vector.csv")); d = d[d.time_day_raw > 0.5]
Rum = {"GM1": 18.945, "GM2": 20.31, "GM3": 22.705}
Dw = float(wilke_chang(DRUGS["diclofenac"]["V"])); tau50 = 0.030546524298
out = dict(Dw_cm2s=Dw, V_LeBas=DRUGS["diclofenac"]["V"], cases={})
for form, s in d.groupby("formulation", sort=False):
    k = form.split()[0]; R = Rum[k] * 1e-4; t = s.time_day_raw.values * DAY; y = s.release_pct.values
    t50_obs = float(np.interp(50, y, s.time_day_raw.values))
    pred = {f"phi={phi}": tau50 * R ** 2 / (Dw * mackie_meares(phi)) for phi in (0.05, 0.1, 0.3)}
    obj = lambda lD: rmse(100 * release_analytical(10 ** lD * t / R ** 2), y)
    fit = minimize_scalar(obj, bounds=(-18, -8), method="bounded")
    out["cases"][k] = dict(R_um=Rum[k], t50_obs_day=r(t50_obs, 2), t50_fick_s={kk: r(v, 4) for kk, v in pred.items()},
                           ratio_obs_over_fick=[float(f"{t50_obs * DAY / v:.3g}") for v in pred.values()],
                           diagnostic_apparent_D_cm2s=float(f"{10 ** fit.x:.3g}"), diagnostic_rmse_pct=r(fit.fun),
                           D_w_over_apparent_D=float(f"{Dw / 10 ** fit.x:.3g}"))
save("v4_saravanan2011_negative_control", out)
fig, a = plt.subplots(figsize=(6.6, 4.3))
for (form, s), c in zip(d.groupby("formulation", sort=False), (BLUE, ORG, GRN)):
    k = form.split()[0]; R = Rum[k] * 1e-4; tt = np.linspace(0.01, 30, 300) * DAY
    a.errorbar(s.time_day_raw, s.release_pct, yerr=s.SE_pct_from_caps, fmt="o", color=c, mfc="white", ms=5, capsize=2, label=f"{form} data")
    a.plot(tt / DAY, 100 * release_analytical(out["cases"][k]["diagnostic_apparent_D_cm2s"] * tt / R ** 2), color=c, lw=1.2, ls="--")
a.axhline(100, color=RED, lw=2); a.text(0.6, 93, "Fick with independent D (Wilke–Chang × Mackie–Meares): 100 % within 1 s", color=RED, fontsize=8)
a.set_xlabel("time (day)"); a.set_ylabel("cumulative release (%)"); a.set_ylim(0, 105); a.legend(fontsize=8, loc="center right")
a.set_title("V4 negative control: Saravanan 2011 (dashed: fitted apparent D, diagnostic only)", loc="left", fontsize=9)
fig.tight_layout(); fig.savefig(os.path.join(FIG, "V4_saravanan2011.png"), dpi=170); plt.close(fig)
print(json.dumps(out, indent=1))
