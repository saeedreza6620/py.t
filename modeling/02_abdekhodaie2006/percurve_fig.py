# Per-curve K_ads fit: shows the shape is captured but one K_ads does not fit all three curves.
src = open("abd06_sync.py").read().split("# ---------------- figures")[0].replace('json.dump(res, open("abd06_sync_results.json", "w"), ensure_ascii=False, indent=1)', "")
exec(src)
from scipy.optimize import minimize_scalar
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 10})
tmin = np.linspace(0, 18, 400); out = {}
fig, axs = plt.subplots(1, 3, figsize=(14, 4.6), sharey=True)
for ax, (lab, (lam, C0mg, y)) in zip(axs, DATA.items()):
    y = np.array(y)
    def rms(ka):
        sol, _, C0 = solve(lam, C0mg, D_26, ka, True); return np.sqrt(np.mean((sol.sol(t_d * 60)[-1] / C0 - y) ** 2))
    o = minimize_scalar(rms, bounds=(0.02, 0.4), method="bounded", options=dict(xatol=1e-4)); kb = o.x
    for ka, col, ls, nm in ((KADS, "#8A8F99", "--", "K_ads = 0.133 (paper, curve 1)"), (kb, "#EB6834", "-", "K_ads = %.3f (best for this curve)" % kb)):
        sol, _, C0 = solve(lam, C0mg, D_26, ka, True); ax.plot(tmin, sol.sol(tmin * 60)[-1] / C0, color=col, ls=ls, lw=2.3, label=nm)
    ax.plot(t_d, y, "ks", mfc="white", mew=1.6, ms=6.5, label="data (Fig. 13)")
    ax.set_title(lab.replace("C0", "C₀"), fontsize=10, loc="left"); ax.set_xlabel("time (min)"); ax.grid(color="#dcdcdc"); ax.legend(frameon=False, fontsize=8)
    out[lab] = dict(kads_best=float(kb), rms_best=float(o.fun), rms_paper=float(rms(KADS)))
axs[0].set_ylabel("C/C₀ in the bath"); axs[0].set_xlim(0, 18); axs[0].set_ylim(0, 1.02)
fig.tight_layout(); fig.savefig("figs/8_per_curve_kads.png", dpi=200)
json.dump(out, open("percurve_kads.json", "w"), indent=1); print(out)
