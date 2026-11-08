# COMSOL-style concentration fields inside the bead for the three crosslinking times (full PDE, our own finite-volume solver).
# Total drug (C + S + P + I)/C0 in %, jet colours, white arrows = flux direction. Rows: crosslinking 4 h / 2 h / 0.5 h.
import numpy as np, json
from scipy.integrate import solve_ivp
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
from gelatin_routes_model import Model
from comsol_fields_lib import halfdisc
import kodra_doe as K
H = 3600.0; N = 40
def run(c, tt):
    ts, sd = np.array(K.T) * H, np.array(c["sd"]) / 100
    Q = lambda t: 1 + 1.35 * max(np.interp(t, ts, sd), 0.05)
    g = lambda t: float(np.interp(t, ts, c["dr"]))
    R = 7.5e-4 * (1 + 1.35 * max(sd)) ** (1 / 3)
    koff = K.KOFF1 * np.log(100 / c["EE"]) / np.log(100 / 38.9)
    m = Model(R, K.Dw, koff=koff, kon=0.0, Smax0=1.0, g=g, N=N, Dfun=lambda t, gg: K.Dw * K.eq26(Q(t)))
    sol = solve_ivp(m.rhs, (0, tt[-1]), np.concatenate([np.zeros(N), np.ones(N), np.zeros(N)]), method="BDF", t_eval=tt, rtol=1e-7, atol=1e-12, max_step=tt[-1] / 400)
    return m, sol
tt = np.array([1, 3, 5, 12, 24.]) * H; rows = {}
fig, axs = plt.subplots(3, 5, figsize=(14, 8.6))
for ax_row, (name, c) in zip(axs, K.F.items()):
    m, sol = run(c, tt); firr = max(0.0, 1 - c["yd"][-1] / 100); rc = np.concatenate([[0], m.rc]) * 1e4
    rel = []
    for i, ax in enumerate(ax_row):
        v = (firr + (1 - firr) * (sol.y[:N, i] + sol.y[N:2 * N, i] + sol.y[2 * N:, i])) * 100
        p = np.concatenate([[v[0]], v]); halfdisc(ax, rc, p, 0, 100, "%s   t = %g h" % (name.split(" (")[0], tt[i] / H) + "\nSurface: total drug (%)")
        rel.append(100 - float((v * m.Vc).sum() / m.Vc.sum()))
    rows[name] = dict(R_um=float(m.R * 1e4), release_pde_pct=[round(x, 1) for x in rel], t_h=list(tt / H))
fig.suptitle("Full model (step 5), design factor = crosslinking time: 4 h (top), 2 h (middle), 0.5 h (bottom). Drug leaves uniformly; the shorter the crosslinking, the faster", fontsize=9, x=0.01, ha="left", color="#2b4c7e", fontweight="bold")
fig.tight_layout(rect=(0, 0, 1, 0.97)); fig.savefig("figs/12_doe_fields_comsol.png", dpi=200); plt.close(fig)
# check: PDE release vs lumped model at the same times
chk = {}
for name, c in K.F.items():
    f = K.model(c, 5, np.linspace(10, 24 * H, 2500)); lump = [float(np.interp(x, np.linspace(10, 24 * H, 2500), f) * 100) for x in tt]
    chk[name] = dict(lumped=[round(x, 1) for x in lump], pde=rows[name]["release_pde_pct"])
json.dump(dict(fields=rows, pde_vs_lumped=chk), open("kodra_fields_results.json", "w"), indent=1); print(json.dumps(chk))
