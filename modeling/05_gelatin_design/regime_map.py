# Release-shape regime map for gelatin microspheres: which output shape follows from which parameter combination
# Lumped form of the full model (valid when diffusion time R^2/D << desorption and degradation times; checked below):
#   dM/dt = -kD M + koff S + r(t) S        mobile drug inside the particle, kD = pi^2 D / R^2
#   dS/dt = -koff S - r(t) S               bound drug; r = -g'/g, g(t) = remaining gel fraction (measured or linear)
#   released = 1 - M - S - f_irr
# Dimensionless groups:  Pi_b = tau_b / tau_g  (tau_b = 1/koff, tau_g = time to 50 % mass loss), f_free, f_irr, tau_D/tau_g
import numpy as np, json
from scipy.integrate import solve_ivp

def simulate(t, f_free, tau_b, tau_g, tau_D=1e-3, f_irr=0.0, g=None):
    kD = 1 / tau_D; koff = 0.0 if not np.isfinite(tau_b) else 1 / tau_b
    g = g or (lambda s: max(1 - s / (2 * tau_g), 0.0))
    def rhs(s, y):
        M, S = y; gg = g(s); eps = 1e-3 * tau_g
        gd = (g(s + eps) - g(max(s - eps, 0))) / (s + eps - max(s - eps, 0))
        r = -gd / gg if gg > 1e-6 else 1e3 / tau_g
        return [-kD * M + koff * S + r * S, -koff * S - r * S]
    b = 1 - f_free - f_irr
    sol = solve_ivp(rhs, (0, t[-1]), [f_free, b], t_eval=t, method="LSODA", rtol=1e-7, atol=1e-10, max_step=t[-1] / 400)
    return 1 - sol.y[0] - sol.y[1] - f_irr

SHAPES = ["burst + plateau", "biphasic (burst, plateau, late rise)", "first-order / diffusion-like", "sigmoidal / delayed (degradation-controlled)"]
def classify(t, f, T):
    tt = np.linspace(0, T, 600); y = np.interp(tt, t, f); dy = np.gradient(y, tt)
    B = np.interp(0.02 * T, tt, y); F = y[-1]; mid = np.interp(0.5 * T, tt, y)
    tmax = tt[np.argmax(dy[3:]) + 3] / T
    if B >= 0.2 and F - mid >= 0.15: c = 1
    elif B >= 0.2 and F - np.interp(0.25 * T, tt, y) < 0.08: c = 0
    elif tmax < 0.08: c = 2
    else: c = 3
    return c, dict(burst=B, final=F, t_maxslope=tmax)

if __name__ == "__main__":
    import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
    from matplotlib.colors import ListedColormap
    # ---- check lumped model against the full PDE model (Kodra MS/K-1-like numbers) ----
    import sys; sys.path.insert(0, "/home/claude/mdl/route/code"); from gelatin_routes_model import Model
    H = 3600.0; tchk = np.linspace(0.05, 24, 97) * H
    gK = lambda s: float(np.interp(s, np.array([0, 1, 3, 6, 24]) * H, [1, .97, .95, .932, 0]))
    full = Model(25e-4, 3e-6, koff=2.68e-5, g=gK, N=25).run(tchk, S0=1.0)
    lump = simulate(tchk, 0.0, 1 / 2.68e-5, 14 * H, tau_D=(25e-4)**2 / (np.pi**2 * 3e-6), g=gK)
    print("lumped vs full PDE, max |diff| =", float(np.abs(full - lump).max()))
    # ---- regime map (tau_g = 1, window T = 3) ----
    T = 3.0; t = np.linspace(0, T, 400)[1:]
    xs = np.linspace(-2, 2.5, 46); ys = np.linspace(0, 0.9, 37); Z = np.zeros((len(ys), len(xs)))
    for j, ff in enumerate(ys):
        for i, lx in enumerate(xs):
            tb = np.inf if lx >= 2.45 else 10**lx
            Z[j, i] = classify(t, simulate(t, ff, tb, 1.0), T)[0]
    # ---- measured formulations ----
    pts = [  # name, Pi_b, f_free, observed shape (read from the data), source
        ("Kodra MS/K-1", 10.4 / 14.3, 0.0, 2, "k_off fit; DR% Fig 7b"),
        ("Kodra MS/K-2", 6.6 / 14.0, 0.0, 3, "k_off x EE; DR% Fig 7b"),
        ("Kodra MS/K-3", 5.2 / 2.7, 0.0, 3, "k_off x EE; DR% Fig 7b"),
        ("Chang 1.0dM-G", 300.0, 0.83, 1, "no desorption seen; weight loss"),
        ("Chang 2.5dM-G", 300.0, 0.54, 1, "no desorption seen; weight loss"),
    ]
    cmap = ListedColormap(["#F6D7B0", "#D8C7F2", "#BFD4FA", "#BFE8D3"])
    fig, ax = plt.subplots(figsize=(9.5, 5.8))
    ax.pcolormesh(xs, ys, Z, cmap=cmap, vmin=-.5, vmax=3.5, shading="nearest")
    for k, lab in enumerate(SHAPES): ax.plot([], [], "s", ms=12, color=cmap(k), label=lab)
    obs_col = ["#B4531F", "#6B4FD8", "#2F5CF0", "#13803F"]
    for name, pib, ff, obs, src in pts:
        x = min(np.log10(pib), 2.45)
        ax.plot(x, ff, "o", ms=11, mfc=obs_col[obs], mec="k", mew=1.2)
        ax.annotate(name, (x, ff), xytext=(6, 6), textcoords="offset points", fontsize=8.5)
    ax.set_xlabel("log10( desorption time / degradation half-time )   →  stronger binding / faster degradation", fontsize=9.5)
    ax.set_ylabel("free (unbound) fraction at t = 0  →  burst size", fontsize=9.5)
    ax.text(2.45, 0.92, "∞ (no\ndesorption)", ha="center", fontsize=8)
    ax.set_title("Release-shape map (background = model prediction; dots = measured formulations, coloured by OBSERVED shape)",
                 loc="left", fontsize=10)
    ax.legend(loc="upper left", fontsize=8.5, frameon=True)
    fig.tight_layout(); fig.savefig("regime_map.png", dpi=160)
    res = []
    for name, pib, ff, obs, src in pts:
        tb = np.inf if pib > 250 else pib
        c, feat = classify(t, simulate(t, ff, tb, 1.0), T)
        res.append(dict(name=name, Pi_b=pib, f_free=ff, predicted=SHAPES[c], observed=SHAPES[obs], match=c == obs))
    print(json.dumps(res, indent=1, ensure_ascii=False))
