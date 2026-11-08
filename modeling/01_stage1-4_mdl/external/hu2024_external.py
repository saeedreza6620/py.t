# External test (step 6): Hu et al. 2024 (Materials 17:3578), gentamicin in GA-crosslinked type-B gelatin microspheres,
# phosphate-modified (ADP), loaded by soaking. Same chemistry and same lab as Chang 2023.
# Nothing is tuned on Hu. Transferred from Chang 2023: mechanism (free pool + strong pool freed by degradation, no desorption
# seen) and free fraction (0.83 for 1.0dM; band 0.54-0.83). Hu's own inputs: weight loss of m-Em (Fig. 3), radius 16.1 um diameter.
# Data: Fig. 5, m-EmG minus m-Em background (the paper subtracts it), normalised by the 8-24 d plateau (taken as total load).
import numpy as np, json, sys
sys.path.insert(0, "/home/claude/mdl/regime"); from design_map import simulate, t_at
H, DAY = 3600.0, 86400.0
# Fig. 5 (digitized): blue m-EmG and orange m-Em background, mg
t_h = np.array([1, 2, 4, 8, 24, 48, 96, 192, 288, 384, 480, 576, 672, 768.0])
blue = np.array([0.135, 0.22, 0.30, 0.37, 0.44, 0.50, 0.565, 0.59, 0.595, 0.595, 0.605, 0.627, 0.60, 0.627])
orng = np.array([0.03, 0.05, 0.07, 0.09, 0.14, 0.19, 0.23, 0.235, 0.245, 0.245, 0.245, 0.255, 0.315, 0.32])
net = blue - orng; total = net[(t_h >= 192) & (t_h <= 576)].mean(); y = net / total
# Fig. 3 (digitized): m-Em weight change (%) vs day
wd = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 19, 20, 22, 23, 25, 26, 27, 28, 29, 30, 31])
wv = np.array([100, 99, 86, 77, 69, 66, 62, 58, 54, 51, 49, 46, 38, 33, 28, 26, 22, 20, 15, 12, 7, 5, 3, 1, 0.5, 0, 0])
g = lambda s: float(np.interp(s / DAY, np.concatenate([[0], wd]), np.concatenate([[100], wv])) / 100)
Dw = 5.20e-6; R = 16.1e-4 / 2; tauD = R**2 / (np.pi**2 * Dw * ((1 - 0.1) / (1 + 0.1))**2)
t = np.linspace(60, 768 * H, 4000)
res = {}
for ff in (0.83, 0.54):
    f = simulate(t, ff, np.inf, tauD, g)[0]; pred = np.interp(t_h * H, t, f)
    res[ff] = dict(pred=np.round(100 * pred, 1).tolist(), rmse_all=round(float(np.sqrt(np.mean((100 * (pred - y))**2))), 1),
                   rmse_after_1d=round(float(np.sqrt(np.mean((100 * (pred - y)[t_h >= 24])**2))), 1), curve=f)
print("data (% of plateau):", np.round(100 * y, 1).tolist())
for ff, r in res.items(): print(ff, {k: v for k, v in r.items() if k != "curve"})
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
plt.rcParams.update({"font.size": 10, "axes.spines.top": False, "axes.spines.right": False})
fig, axs = plt.subplots(1, 2, figsize=(13, 4.4))
for ax, log in zip(axs, (True, False)):
    ax.plot(t / H, 100 * res[0.83]["curve"], color="#17855A", lw=2.2, label="prediction, free fraction 0.83 (from Chang 1.0dM)")
    ax.plot(t / H, 100 * res[0.54]["curve"], color="#17855A", lw=1.4, ls="--", label="prediction, free fraction 0.54 (from Chang 2.5dM)")
    ax.plot(t_h, 100 * y, "ko", ms=5, label="Hu 2024 data (m-EmG − background), % of plateau")
    ax.plot(np.concatenate([[0], wd]) * 24, 100 - np.concatenate([[100], wv]), color="#999", ls=":", label="measured weight loss of m-Em (%)")
    ax.set_ylim(0, 110); ax.set_ylabel("cumulative release (%)")
    if log: ax.set_xscale("log"); ax.set_xlim(0.5, 800); ax.set_xlabel("time (h, log)")
    else: ax.set_xlim(0, 800); ax.set_xlabel("time (h)")
axs[0].set_title("External test: Hu 2024, nothing tuned on this paper", loc="left", fontsize=10)
axs[1].legend(fontsize=8, frameon=False, loc="lower right")
fig.tight_layout(); fig.savefig("hu2024_external.png", dpi=160)
json.dump({str(k): {kk: vv for kk, vv in v.items() if kk != "curve"} for k, v in res.items()} | {"data": (100 * y).round(1).tolist()},
          open("hu2024_external.json", "w"), indent=1)
