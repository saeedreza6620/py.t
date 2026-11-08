# Design map: from parameters to (i) which mechanism controls release and (ii) when half of the drug is out
# Lumped model (checked against the full PDE: max difference 3e-6 for Kodra-like inputs, see regime_map.py)
import numpy as np, json
from scipy.integrate import solve_ivp

def simulate(t, f_free, tau_b, tau_D, g, f_irr=0.0):
    koff = 0.0 if not np.isfinite(tau_b) else 1 / tau_b; kD = 1 / tau_D; T = t[-1]; rmax = 400 / T
    def rate(s):
        eps = 1e-4 * T; gg = g(s); gd = (g(s + eps) - g(max(s - eps, 0))) / (s + eps - max(s - eps, 0))
        return rmax if gg < 1e-4 else min(-gd / gg, rmax)
    def rhs(s, y):
        M, S, Rdes, Rdeg = y; r = max(rate(s), 0.0)
        return [-kD * M + koff * S + r * S, -koff * S - r * S, koff * S, r * S]
    b = 1 - f_free - f_irr
    sol = solve_ivp(rhs, (0, T), [f_free, b, 0, 0], t_eval=t, method="LSODA", rtol=1e-7, atol=1e-10, max_step=T / 600)
    M, S, Rdes, Rdeg = sol.y
    share_des = Rdes[-1] / max(Rdes[-1] + Rdeg[-1], 1e-12) if b > 0 else np.nan
    return 1 - M - S - f_irr, share_des

def t_at(t, f, lev=0.5):
    i = np.argmax(f >= lev)
    if f[i] < lev: return np.nan
    return t[0] if i == 0 else np.interp(lev, [f[i - 1], f[i]], [t[i - 1], t[i]])

if __name__ == "__main__":
    import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
    H, DAY = 3600.0, 86400.0
    # ---------- map in dimensionless time (tau_g = 1 = time to 50 % mass loss, linear mass loss to 2 tau_g) ----------
    glin = lambda s: max(1 - s / 2.0, 0.0); t = np.linspace(1e-3, 3, 900)
    xs = np.linspace(-2, 2.5, 46); ys = np.linspace(0, 0.95, 39); T50 = np.zeros((len(ys), len(xs))); SH = np.zeros_like(T50)
    for j, ff in enumerate(ys):
        for i, lx in enumerate(xs):
            f, sh = simulate(t, ff, 10**lx, 1e-4, glin); T50[j, i] = t_at(t, f); SH[j, i] = sh
    fig, axs = plt.subplots(1, 2, figsize=(15, 5.8))
    ax = axs[0]
    cs = ax.contourf(xs, ys, SH, levels=[0, .3, .7, 1.0], colors=["#BFE8D3", "#E8E2F6", "#BFD4FA"])
    cl = ax.contour(xs, ys, np.log10(np.maximum(T50, 1e-4)), levels=np.log10([0.001, 0.01, 0.1, 0.3, 0.6, 1.0]), colors="#0E1B4D", linewidths=1)
    ax.clabel(cl, fmt={np.log10(v): f"t50 = {v:g} τg" for v in [0.001, 0.01, 0.1, 0.3, 0.6, 1.0]}, fontsize=8)
    ax.axhline(0.5, color="#8A4B12", lw=1.4, ls="-")
    ax.text(-1.9, 0.9, "burst-dominated (free fraction > 0.5)", fontsize=8.5, color="#8A4B12")
    ax.text(-1.9, 0.2, "DESORPTION-\ncontrolled", fontsize=9, color="#1F4FB8"); ax.text(1.7, 0.2, "DEGRADATION-\ncontrolled", fontsize=9, color="#13603F")
    ax.text(0.15, 0.2, "mixed", fontsize=9, color="#5A3FB0")
    pts = [("Kodra MS/K-1", 10.4 / 14.3, 0.0), ("Kodra MS/K-2", 6.6 / 14.0, 0.0), ("Kodra MS/K-3", 5.2 / 2.7, 0.0),
           ("Chang 1.0dM-G", 1e3, 0.83), ("Chang 2.5dM-G", 1e3, 0.54)]
    offs = {"Kodra MS/K-1": (-30, 34), "Kodra MS/K-2": (-95, 18), "Kodra MS/K-3": (8, 18), "Chang 1.0dM-G": (-95, 8), "Chang 2.5dM-G": (-95, 8)}
    for n, pb, ff in pts:
        x = min(np.log10(pb), 2.45); ax.plot(x, ff, "o", ms=10, mfc="#EB6834", mec="k")
        ax.annotate(n, (x, ff + 0.01), xytext=offs[n], textcoords="offset points", fontsize=8, arrowprops=dict(arrowstyle="-", lw=.6))
    ax.set_xlabel("log10( τ_desorption / τ_degradation )      (crosslinking ↑ → binding ↑ → τ_desorption ↑)", fontsize=9)
    ax.set_ylabel("free fraction at t = 0 (burst)"); ax.set_title("(a) which mechanism controls, and t50 (contours)", loc="left", fontsize=10)
    # ---------- parity test with MEASURED inputs ----------
    koff1 = 2.68e-5; sc = lambda e: np.log(100 / e) / np.log(100 / 38.9)
    def gp(ts, vs): return lambda s: float(np.interp(s, np.array(ts), np.array(vs)))
    cases = {
     "Kodra MS/K-1": (gp(np.array([0, 1, 3, 6, 24]) * H, [1, .97, .95, .932, 0]), 1 / koff1, 0.0, 24 * H, [0.5, 1, 3, 5, 24], [12.9, 17.4, 34.0, 35.6, 62.3]),
     "Kodra MS/K-2": (gp(np.array([0, 1, 3, 6, 24]) * H, [1, .96, .94, .899, 0]), 1 / (koff1 * sc(22.5)), 0.0, 24 * H, [0.5, 1, 3, 5, 24], [10.6, 22.3, 41.9, 84.8, 100.0]),
     "Kodra MS/K-3": (gp(np.array([0, 1, 3, 6, 24]) * H, [1, .92, .43, 0, 0]), 1 / (koff1 * sc(15.2)), 0.0, 24 * H, [0.5, 1, 3, 5, 24], [9.0, 37.1, 99.6, 99.8, 100.0]),
     "Chang 1.0dM-G": (lambda s: float(np.clip(1 - (3.1905 * s / DAY + 13.844 if s >= DAY else 17.03 * s / DAY) / 100, 0, 1)), np.inf, 0.83, 32 * DAY,
                       [1, 2, 4, 8, 24, 48, 96, 192, 384, 768], list(np.array([2.46, 3.82, 3.94, 3.96, 3.99, 3.97, 3.96, 3.95, 4.03, 4.79]) / 4.79 * 100)),
     "Chang 2.5dM-G": (lambda s: float(np.clip(1 - (2.9257 * s / DAY + 3.8528 if s >= DAY else 6.78 * s / DAY) / 100, 0, 1)), np.inf, 0.54, 32 * DAY,
                       [1, 2, 4, 8, 24, 48, 96, 192, 384, 768], list(np.array([2.65, 4.01, 4.11, 4.13, 4.16, 4.16, 4.16, 4.16, 4.53, 7.72]) / 7.72 * 100)),
    }
    ax = axs[1]; rows = []
    for k, (n, (g, tb, ff, T, td, yd)) in enumerate(cases.items()):
        tt = np.linspace(T / 4000, T, 3000); f, sh = simulate(tt, ff, tb, 5.0, g)
        td = np.array(td) * H; yd = np.array(yd)
        pred = np.interp(td, tt, f) * 100
        t50m = t_at(tt, f) / H; tdd = np.concatenate([[0], td]); ydd = np.concatenate([[0], yd / 100]); t50d = t_at(tdd, ydd) / H
        rows.append(dict(name=n, mechanism=("desorption" if sh > .7 else "degradation" if sh < .3 else "mixed") if np.isfinite(sh) else "free drug only",
                         desorption_share=None if not np.isfinite(sh) else round(sh, 2), t50_model_h=round(t50m, 2), t50_data_h=round(t50d, 2),
                         rmse=round(float(np.sqrt(np.mean((pred - yd) ** 2))), 1)))
        ax.plot(yd, pred, "o", ms=7, label=n, color=["#2F5CF0", "#EB6834", "#6B4FD8", "#1BAF7A", "#0E1B4D"][k])
    ax.plot([0, 100], [0, 100], "k--", lw=1); ax.set_xlim(0, 105); ax.set_ylim(0, 105)
    ax.set_xlabel("measured cumulative release (%)"); ax.set_ylabel("predicted from measured inputs (%)")
    ax.set_title("(b) predicted vs measured, every data point of 5 formulations", loc="left", fontsize=10); ax.legend(fontsize=8.5, frameon=False)
    fig.tight_layout(); fig.savefig("design_map.png", dpi=160)
    print(json.dumps(rows, indent=1, ensure_ascii=False))
