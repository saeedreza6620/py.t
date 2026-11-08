# Chang et al. 2023 (Polymers 15:1504): gentamicin in GA post-crosslinked type-B gelatin microspheres, DAP-modified
# Inputs taken from the SAME paper (no fitting of time constants):
#   R: Fig. 4c / text (diameter 21.09 and 17.36 um for 1.0dM-G and 2.5dM-G)
#   g(t): weight-loss regressions in Section 3.4 (1.0 dM: y = 3.1905 t + 13.844; 2.5 dM: y = 2.9257 t + 3.8528, % vs day)
#   crosslinking (amine fixation) index: 55 % (1.0 dM), 51 % (2.5 dM), Fig. 3b
#   release: Fig. 5 (digitized earlier, mg/ml, 1 h - 32 d)
# Pool split: free fraction = plateau (8-192 h) / final value; both microspheres are fully degraded by day 26 / 32 (Fig. 3c),
#   so the final value is taken as the total load. This uses the first phase of the release data, not the second phase.
# Test: does measured degradation alone predict WHEN and HOW FAST the second phase appears?
import numpy as np, json
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
from gelatin_routes_model import Model, mackie_meares
DAY = 86400.0
t_h = np.array([1, 2, 4, 8, 24, 48, 96, 192, 384, 768.0])
CASES = {
 "1.0dM-G": dict(R_um=21.09 / 2, y=[2.46, 3.82, 3.94, 3.96, 3.99, 3.97, 3.96, 3.95, 4.03, 4.79], a=3.1905, b=13.844, CD=0.55),
 "2.5dM-G": dict(R_um=17.36 / 2, y=[2.65, 4.01, 4.11, 4.13, 4.16, 4.16, 4.16, 4.16, 4.53, 7.72], a=2.9257, b=3.8528, CD=0.51),
}
Dw = 5.20e-6       # gentamicin, Wilke–Chang 37 °C (step D)
tt = np.concatenate([np.logspace(-4, np.log10(768), 300)]) * 3600
fig, axs = plt.subplots(1, 3, figsize=(16, 4.6)); out = {}
for k, (name, c) in enumerate(CASES.items()):
    y = np.array(c["y"]); total = y[-1]; plateau = y[3:8].mean(); f_free = plateau / total
    def g_lin(t, a=c["a"], b=c["b"]):
        d = t / DAY; w = a * d + b if d >= 1 else (a + b) * d      # regression from day 1; linear ramp from 0 at t = 0
        return float(np.clip(1 - w / 100, 0, 1))
    R = c["R_um"] * 1e-4
    m = Model(R, Dw, phi0=0.1, g=g_lin, N=30)
    f = m.run(tt, C0=f_free, P0=1 - f_free)
    m0 = Model(R, Dw, phi0=0.1, N=30); f0 = m0.run(tt, C0=1.0)          # step 1: Fick only
    ax = axs[k]
    ax.plot(tt / 3600, 100 * f0, color="#2F5CF0", lw=1.8, label="step 1: Fick, all drug free")
    ax.plot(tt / 3600, 100 * f, color="#1BAF7A", lw=2.2, label="free pool (Fick) + strong pool freed by MEASURED degradation")
    ax.plot(t_h, 100 * y / total, "ko", ms=5, label="data, Fig. 5 (normalised to day-32 value)")
    ax2 = ax.twinx(); dd = tt / DAY
    ax2.plot(tt / 3600, [100 * (1 - g_lin(x)) for x in tt], color="#999", ls=":", lw=1.4); ax2.set_ylim(0, 105)
    ax2.set_ylabel("measured weight loss (%), dotted", color="#777", fontsize=8.5)
    ax.set_xscale("log"); ax.set_xlim(1e-4, 800); ax.set_ylim(0, 105)
    for s, l in ((1/3600, "1 s"), (1, "1 h"), (24, "1 d"), (168, "1 wk")):
        ax.axvline(s, color="#dde2ef", lw=1, zorder=0); ax.text(s, 106, l, ha="center", fontsize=8, color="#6B7590")
    ax.set_title(f"Chang 2023 {name}: free fraction {f_free:.2f}, crosslink index {c['CD']:.2f}", loc="left", fontsize=9.5)
    ax.set_xlabel("time (h, log)"); ax.set_ylabel("cumulative release (%)")
    pred16 = float(np.interp(384 * 3600, tt, f)); out[name] = dict(f_free=f_free, pred_day16=pred16, data_day16=float(y[8] / total),
                                                                   pred_day32=float(np.interp(768 * 3600, tt, f)), data_day32=1.0)
    # linear-time panel of the second phase
    axs[2].plot(tt / DAY, 100 * f, lw=2, label=f"{name} model", color=["#1BAF7A", "#6B4FD8"][k])
    axs[2].plot(t_h / 24, 100 * y / total, "o", color=["#1BAF7A", "#6B4FD8"][k], ms=5, label=f"{name} data")
axs[2].set_xlim(0, 33); axs[2].set_ylim(40, 105); axs[2].set_xlabel("time (day, linear)"); axs[2].set_title("second phase (linear time)", loc="left", fontsize=9.5)
axs[2].legend(fontsize=8, frameon=False)
h, l = axs[0].get_legend_handles_labels(); fig.legend(h, l, loc="lower center", ncol=3, frameon=False, fontsize=9)
fig.tight_layout(rect=(0, .08, 1, 1)); fig.savefig("chang2023_routes.png", dpi=160)
print(json.dumps(out, indent=1))
