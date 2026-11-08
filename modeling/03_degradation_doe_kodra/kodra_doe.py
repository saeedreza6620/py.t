# Step "degradation" + design of experiment (DOE) on Kodra et al. 2026 (Polymers 18:1807): ketoprofen in tannic-acid-crosslinked gelatin microspheres.
# Design factor: crosslinking time 4 h / 2 h / 0.5 h  ->  MS/K-1 / MS/K-2 / MS/K-3.  Every input below is MEASURED in the paper for each formulation.
# The model is built in five steps; each step adds one physical element and is scored on the release data.
#   1 Fick, D from formula, all drug free      2 + swelling (Eq. 26, measured Q(t))     3 + crosslinking -> binding (k_off scaled by EE)
#   4 + degradation (measured DR %(t))         5 + non-releasable pool f_irr (from the curve end point = NOT a prediction)
# One unknown: k_off. Fitted on MS/K-1 only, t <= 5 h (measured degradation < 7 %), then used unchanged for K-2 and K-3 (scaled by measured EE).
import numpy as np, json
from scipy.integrate import solve_ivp
H = 3600.0
Dw, rs = 7.58e-6, 4.86                     # ketoprofen, Wilke-Chang 37 C (cm2/s); Eq. 26 constant
KOFF1 = 2.68e-5                            # 1/s, fitted on MS/K-1, t <= 5 h
T = [0, 1, 3, 6, 24]                       # h, times of the swelling and degradation measurements
F = {  # SD %, DR %, release (%) at td (h), EE %, CD %   -- Kodra 2026 Figs. 7a, 7b, release curves, Secs. 3.4, 3.8
 "MS/K-1 (4 h)":   dict(xl=4.0, sd=[0, 1650, 1850, 1942, 1820], dr=[1, .97, .95, .932, 0], EE=38.9, CD=95.8, td=[0.5, 1, 3, 5, 24], yd=[12.9, 17.4, 34.0, 35.6, 62.3]),
 "MS/K-2 (2 h)":   dict(xl=2.0, sd=[0, 1300, 1700, 1345, 450], dr=[1, .96, .94, .899, 0], EE=22.5, CD=93.0, td=[0.5, 1, 3, 5, 24], yd=[10.6, 22.3, 41.9, 84.8, 100.0]),
 "MS/K-3 (0.5 h)": dict(xl=0.5, sd=[0, 920, 620, 379, 250],   dr=[1, .92, .43, 0, 0],    EE=15.2, CD=90.9, td=[0.5, 1, 3, 5, 24], yd=[9.0, 37.1, 99.6, 99.8, 100.0]),
}
STEPS = ["1 Fick (D formula, all free)", "2 + swelling (Eq. 26, Q(t))", "3 + crosslinking -> binding", "4 + degradation (measured DR %)", "5 + non-releasable pool"]
STATUS = ["rejected", "rejected", "partial", "valid prediction for K-2, K-3", "descriptive (f_irr from end point)"]
def mm(phi): return ((1 - phi) / (1 + phi)) ** 2
def eq26(Q): return min(rs * Q ** -0.75 * np.exp(-1 / (Q - 1)), 1.0)

def simulate(t, f_free, tau_b, tau_D, g, f_irr=0.0):
    """Lumped model: mobile M, bound S, degradation rate r = -g'/g.  dM/dt = -kD M + koff S + r S ;  dS/dt = -(koff + r) S.  Matches the full PDE to 3e-6."""
    koff = 0.0 if not np.isfinite(tau_b) else 1 / tau_b; kD = 1 / tau_D; Tm = t[-1]; rmax = 400 / Tm
    def rate(s):
        eps = 1e-4 * Tm; gg = g(s); gd = (g(s + eps) - g(max(s - eps, 0))) / (s + eps - max(s - eps, 0))
        return rmax if gg < 1e-4 else min(-gd / gg, rmax)
    def rhs(s, y):
        M, S = y; r = max(rate(s), 0.0); return [-kD * M + koff * S + r * S, -koff * S - r * S]
    b = 1 - f_free - f_irr
    sol = solve_ivp(rhs, (0, Tm), [f_free, b], t_eval=t, method="LSODA", rtol=1e-7, atol=1e-10, max_step=Tm / 600)
    return 1 - sol.y[0] - sol.y[1] - f_irr

def t_at(t, f, lev=0.5):
    i = np.argmax(f >= lev)
    if f[i] < lev: return np.nan
    return t[0] if i == 0 else np.interp(lev, [f[i - 1], f[i]], [t[i - 1], t[i]])

def model(c, step, t):
    Qf = lambda s: 1 + 1.35 * max(np.interp(s, np.array(T) * H, np.array(c["sd"]) / 100), 0.05)
    Qmax = 1 + 1.35 * max(c["sd"]) / 100; R = 7.5e-4 * Qmax ** (1 / 3)
    D = Dw * mm(0.1) if step == 1 else Dw * eq26(Qmax)
    tauD = max(R ** 2 / (np.pi ** 2 * D), 0.05)
    if step <= 2: return 1 - np.exp(-t / tauD)          # all drug free, no binding: single-exponential lumped Fick (the sphere empties in seconds)
    koff = KOFF1 * np.log(100 / c["EE"]) / np.log(100 / 38.9)
    g = (lambda s: 1.0) if step == 3 else (lambda s: float(np.interp(s, np.array(T) * H, c["dr"])))
    firr = 0.0 if step < 5 else max(0.0, 1 - c["yd"][-1] / 100)
    return simulate(t, 0.0, 1 / koff, tauD, g, f_irr=firr)

if __name__ == "__main__":
    import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
    plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 9.5})
    t = np.linspace(10, 24 * H, 2500); rows = []; curves = {}
    for name, c in F.items():
        r = dict(name=name, xl_h=c["xl"], EE=c["EE"], CD=c["CD"]); curves[name] = {}
        for s in range(1, 6):
            f = model(c, s, t); curves[name][s] = f
            pred = np.interp(np.array(c["td"]) * H, t, f) * 100
            r[f"step{s}_rmse"] = round(float(np.sqrt(np.mean((pred - np.array(c["yd"])) ** 2))), 1)
            r[f"step{s}_t50_h"] = round(t_at(t, f) / H, 2) if np.isfinite(t_at(t, f)) else None
            r[f"step{s}_at24"] = round(float(pred[-1]), 1)
        tdd = np.concatenate([[0], np.array(c["td"]) * H]); ydd = np.concatenate([[0], np.array(c["yd"]) / 100])
        r["data_t50_h"] = round(t_at(tdd, ydd) / H, 2); r["data_at24"] = c["yd"][-1]; rows.append(r)
    json.dump(dict(rows=rows, koff1=KOFF1, steps=STEPS, status=STATUS), open("kodra_doe_results.json", "w"), indent=1)
    for r in rows: print({k: v for k, v in r.items() if "rmse" in k or "t50" in k or k == "name"})
    cols = ["#8A8F99", "#6B4FD8", "#2F5CF0", "#EB6834", "#1BAF7A"]
    # (9) five steps vs data, one panel per crosslinking time
    fig, axs = plt.subplots(1, 3, figsize=(15, 4.9), sharey=True)
    for ax, (name, c) in zip(axs, F.items()):
        for s in range(1, 6): ax.plot(t / H, curves[name][s] * 100, color=cols[s - 1], lw=2.1 if s in (4, 5) else 1.6, ls="-" if s >= 3 else "--", label=STEPS[s - 1])
        ax.plot(c["td"], c["yd"], "ks", mfc="white", mew=1.6, ms=7, label="data (Kodra 2026)")
        ax.set_title("%s   EE = %.1f %%" % (name, c["EE"]), fontsize=10, loc="left"); ax.set_xlabel("time (h)"); ax.grid(color="#dcdcdc"); ax.set_xlim(0, 24)
    axs[0].set_ylabel("cumulative release (%)"); axs[0].legend(frameon=False, fontsize=7.8, loc="lower right"); fig.tight_layout(); fig.savefig("figs/9_doe_steps_vs_data.png", dpi=200); plt.close(fig)
    # (10) RMSE per step
    fig, ax = plt.subplots(figsize=(8, 4.4)); w = 0.26
    for k, (r, col) in enumerate(zip(rows, ["#2F5CF0", "#1BAF7A", "#EB6834"])):
        ax.bar(np.arange(5) + (k - 1) * w, [r[f"step{s}_rmse"] for s in range(1, 6)], w, color=col, label=r["name"])
    ax.set_xticks(range(5)); ax.set_xticklabels(["1 Fick", "2 + swelling", "3 + binding", "4 + degradation", "5 + non-releasable"], fontsize=8.5)
    ax.set_ylabel("RMSE (% release)"); ax.grid(axis="y", color="#dcdcdc"); ax.legend(frameon=False); fig.tight_layout(); fig.savefig("figs/10_doe_rmse_by_step.png", dpi=200); plt.close(fig)
    # (11) DOE response: crosslinking time -> t50 and 24 h release
    xl = [c["xl"] for c in F.values()]
    fig, (a, b) = plt.subplots(1, 2, figsize=(10.5, 4.2))
    a.plot(xl, [r["data_t50_h"] for r in rows], "ks-", mfc="white", mew=1.6, ms=8, label="data")
    a.plot(xl, [r["step4_t50_h"] for r in rows], "o-", color="#EB6834", label="step 4"); a.plot(xl, [r["step5_t50_h"] for r in rows], "^-", color="#1BAF7A", label="step 5")
    a.set_xlabel("crosslinking time (h)"); a.set_ylabel("t50 of release (h)"); a.grid(color="#dcdcdc"); a.legend(frameon=False); a.set_title("(a) Time to 50 % release", loc="left", fontweight="bold")
    b.plot(xl, [r["data_at24"] for r in rows], "ks-", mfc="white", mew=1.6, ms=8, label="data")
    b.plot(xl, [r["step4_at24"] for r in rows], "o-", color="#EB6834", label="step 4"); b.plot(xl, [r["step5_at24"] for r in rows], "^-", color="#1BAF7A", label="step 5")
    b.set_xlabel("crosslinking time (h)"); b.set_ylabel("release at 24 h (%)"); b.grid(color="#dcdcdc"); b.legend(frameon=False); b.set_title("(b) Release at 24 h", loc="left", fontweight="bold")
    fig.tight_layout(); fig.savefig("figs/11_doe_response.png", dpi=200); plt.close(fig)
    print("figures done")
