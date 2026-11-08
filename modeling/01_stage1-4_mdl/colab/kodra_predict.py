import os, numpy as np, matplotlib; matplotlib.use("Agg")
exec(open("gelatin_release_model.py").read())
import matplotlib.pyplot as plt
from scipy.optimize import least_squares
d = DATA["Ketoprofen GMS"]; N = list(d["series"]); cal, val = N[:2], N[2]
def joint(kind):
    f = lambda v: np.concatenate([model(kind, np.array(d["series"][n][0]), np.exp(v[0]), 1, n) - np.array(d["series"][n][1]) / 100 for n in cal])
    return np.exp(min((least_squares(f, [lk]) for lk in np.arange(-6, 3, .5)), key=lambda r: r.cost).x[0])
out = {}
fig, ax = plt.subplots(figsize=(11, 4.6))
tt = np.logspace(np.log10(0.2), np.log10(30), 300)
t, y = map(np.array, d["series"][val])
for kind, c, lab in [("fick", "#2F5CF0", "Fick, constant D"), ("size", "#1BAF7A", "Fick + measured swelling + growth")]:
    k = joint(kind); p = model(kind, t, k, 1, val) * 100
    out[kind] = (k, np.sqrt(np.mean((p - y) ** 2)))
    ax.plot(tt, model(kind, tt, k, 1, val) * 100, color=c, lw=3, label=f"{lab}: prediction RMSE {out[kind][1]:.1f}%")
ax.plot(t, y, "o", color="#0E1B4D", ms=10, mec="white", label="MS/K-3 data (never used in calibration)")
ax.set_xscale("log"); ax.set_xlabel("time (h)"); ax.set_ylabel("released (%)"); ax.legend(fontsize=11, loc="lower right")
ax.set_title("Calibrate on MS/K-1 + MS/K-2 (one shared parameter), predict MS/K-3 — Kodra 2026", loc="left")
plt.tight_layout(); plt.savefig("figures_litD/litD_5_kodra_blind.png", dpi=170)
print(out)
