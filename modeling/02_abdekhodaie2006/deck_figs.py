# Large, single-curve progressive figures for the slides (curve 1), plus fonts sized for projection
import numpy as np, matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
exec(open("abd06_sync.py").read().split("res = {")[0])
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 15, "axes.spines.top": False, "axes.spines.right": False})
lab = "λ = 40.67, C0 = 1.8 mg/ml"; lam, C0mg, y = DATA[lab]; tt = np.logspace(-1, np.log10(1200), 700)
cur = {}
for nm, kw, col in STAGES:
    sol, _, C0 = solve(lam, C0mg, **kw); cur[nm] = (sol.sol(tt)[-1] / C0, col)
short = {"1": "Fick only", "2": "+ crosslinked network (Eq. 26)", "3": "+ Langmuir equilibrium", "4": "+ Langmuir kinetics"}
for upto in (1, 2, 3, 4):
    fig, ax = plt.subplots(figsize=(10, 6.6))
    for nm, (yy, col) in cur.items():
        k = int(nm[0])
        if k > upto: continue
        ax.plot(tt, yy, color=col, lw={1: 6, 2: 2.4, 3: 3, 4: 3.6}[k], ls="--" if k == 2 else "-", alpha=0.5 if k == 1 else 1, label="%d. %s" % (k, short[str(k)]))
    ax.plot(t_d * 60, y, "ks", ms=10, label="data (Fig. 13)", zorder=5)
    ax.set_xscale("log"); ax.set_xlim(0.1, 1200); ax.set_ylim(0, 1.04); ax.grid(color="#e1e6f3", lw=0.8, which="major")
    for s, l in ((1, "1 s"), (60, "1 min"), (600, "10 min")): ax.axvline(s, color="#b8c0d6", lw=1.2); ax.text(s * 1.1, 0.03, l, fontsize=14, color="#6B7590")
    ax.set_xlabel("Time (s, log scale)"); ax.set_ylabel("Drug remaining in the bath (fraction)")
    ax.legend(frameon=False, fontsize=13.5, loc="upper center", bbox_to_anchor=(0.5, -0.16), ncol=3)
    fig.tight_layout(); fig.savefig("figs/deck_stage%d.png" % upto, dpi=160); plt.close(fig)
print("ok")
