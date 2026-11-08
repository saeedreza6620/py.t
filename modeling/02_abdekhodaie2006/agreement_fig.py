# Figure: final (stage 4) model vs Abdekhodaie & Wu 2006 Fig. 13 data, three curves + parity plot. Reuses abd06_sync.py computations.
import re
src = open("abd06_sync.py").read().split("# ---------------- figures")[0]
src = src.replace('json.dump(res, open("abd06_sync_results.json", "w"), ensure_ascii=False, indent=1)', "")
exec(src)
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 10})
cols = ["#2F5CF0", "#1BAF7A", "#EB6834"]; nm = STAGES[3][0]
tmin = np.linspace(0, 18, 400)
fig, (a, b) = plt.subplots(1, 2, figsize=(12.5, 5.2), gridspec_kw=dict(width_ratios=[1.35, 1]))
allm, alld = [], []
for (lab, (lam, C0mg, y)), c in zip(DATA.items(), cols):
    y = np.array(y); sol, _, C0 = solve(lam, C0mg, D_26, KADS, True)
    f = lambda s: sol.sol(s)[-1] / C0
    a.plot(tmin, f(tmin * 60), color=c, lw=2.4, label="model: " + lab.replace("C0", "C₀"))
    a.plot(t_d, y, "s", color=c, mfc="white", mew=1.8, ms=7)
    m = f(t_d * 60); allm += list(m); alld += list(y)
    b.plot(y, m, "o", color=c, ms=6)
a.plot([], [], "ks", mfc="white", mew=1.6, label="Abdekhodaie & Wu 2006, Fig. 13 (data)")
a.set_xlabel("time (min)"); a.set_ylabel("drug remaining in the bath, C/C₀"); a.set_xlim(0, 18); a.set_ylim(0, 1.02)
a.grid(color="#dcdcdc"); a.legend(frameon=False, fontsize=8.8, loc="upper right"); a.set_title("(a) Model vs data", loc="left", fontweight="bold")
b.plot([0, 1], [0, 1], "k--", lw=1); b.set_xlim(0, 0.65); b.set_ylim(0, 0.65); b.set_aspect("equal")
allm, alld = np.array(allm), np.array(alld)
r2 = 1 - np.sum((allm - alld) ** 2) / np.sum((alld - alld.mean()) ** 2); rms = np.sqrt(np.mean((allm - alld) ** 2))
b.text(0.04, 0.58, "R² = %.3f\nRMS = %.3f" % (r2, rms), fontsize=11, bbox=dict(fc="white", ec="#bbb"))
b.set_xlabel("data, C/C₀"); b.set_ylabel("model, C/C₀"); b.grid(color="#dcdcdc"); b.set_title("(b) Parity plot, 36 points", loc="left", fontweight="bold")
fig.tight_layout(); fig.savefig("figs/7_agreement_model_vs_paper.png", dpi=200)
print("R2 %.4f RMS %.4f" % (r2, rms))
