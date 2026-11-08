# COMSOL-style figures (half-disc axisymmetric surface plots, jet colour, white flux streamlines, 3D cut-away, mesh)
# for the gelatin model, built from our own Python solvers.
import numpy as np, matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
from matplotlib import cm, colors
from scipy.integrate import solve_ivp
import run_kodra2026_lib as K
from gelatin_routes_model import mackie_meares
OUT = "comsol_style/"; H = 3600.0
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 8})

def halfdisc(ax, r_um, prof, vmin, vmax, title, cmap="jet", nth=181, streams=True, unit="C/C₀ (%)"):
    th = np.linspace(-np.pi / 2, np.pi / 2, nth); rr = np.linspace(0, r_um[-1], 200)[1:]
    val = np.interp(rr, r_um, prof); RR, TT = np.meshgrid(rr, th)
    X, Z = RR * np.cos(TT), RR * np.sin(TT); V = np.tile(val, (nth, 1))
    pc = ax.pcolormesh(X, Z, V, cmap=cmap, vmin=vmin, vmax=vmax, shading="gouraud", rasterized=True, antialiased=False, linewidth=0)
    R = r_um[-1]
    if streams:
        for a in np.radians(np.arange(-80, 81, 10)):
            ax.plot([0.06 * R * np.cos(a), R * np.cos(a)], [0.06 * R * np.sin(a), R * np.sin(a)], color="white", lw=0.6)
            ax.annotate("", xy=(R * 0.97 * np.cos(a), R * 0.97 * np.sin(a)), xytext=(R * 0.85 * np.cos(a), R * 0.85 * np.sin(a)),
                        arrowprops=dict(arrowstyle="-|>", color="white", lw=0.6, mutation_scale=6))
    ax.plot(R * np.cos(th), R * np.sin(th), color="k", lw=0.5); ax.plot([0, 0], [-R, R], color="k", lw=0.5)
    ax.set_aspect("equal"); ax.set_xlim(-0.2 * R, 1.12 * R); ax.set_ylim(-1.08 * R, 1.08 * R)
    ax.tick_params(length=2, labelsize=6.5); ax.set_xlabel("µm", fontsize=6.5, loc="right"); ax.set_ylabel("µm", fontsize=6.5, loc="top")
    ax.set_title(title, fontsize=7, loc="left", pad=9, linespacing=1.3)
    cb = plt.colorbar(pc, ax=ax, fraction=0.06, pad=0.02); cb.ax.tick_params(labelsize=6)
    cb.ax.text(0.5, 1.012, "▲ %.3g" % prof.max(), fontsize=6, ha="center", va="bottom", transform=cb.ax.transAxes); cb.ax.text(0.5, -0.012, "▼ %.2g" % prof.min(), fontsize=6, ha="center", va="top", transform=cb.ax.transAxes)
    for s in ax.spines.values(): s.set_color("#999")
    return pc

def frame(fig, label):
    fig.text(0.01, 0.995, label, fontsize=9, va="top", color="#2b4c7e", fontweight="bold")

# ---------- A. Step 1, Fick only (gentamicin, Hu 2024 size): free drug field, analytical Crank series ----------
R_um = 8.05; R = R_um * 1e-4; D = 5.2e-6 * mackie_meares(0.1)
r = np.linspace(1e-6, R, 160); n = np.arange(1, 400)[:, None]
def crank_field(t):   # c/c0 inside a sphere, sink at r=R
    x = r[None, :] / R
    return 100 * (-2 * R / (np.pi * r[None, :]) * np.sum((-1) ** n / n * np.sin(n * np.pi * x) * np.exp(-D * n**2 * np.pi**2 * t / R**2), 0))[0]
tA = [0.002, 0.005, 0.010, 0.020, 0.040, 0.080]
fig, axs = plt.subplots(2, 3, figsize=(10, 6.6))
for ax, t in zip(axs.flat, tA):
    p = np.clip(crank_field(t), 0, 100); halfdisc(ax, r * 1e4, p, 0, p.max(), "Time=%g s\nSurface: free drug C/C₀ (%%)   Streamline: flux" % t)
frame(fig, "Step 1, Fick only. Gentamicin, R = 8.05 µm, D = %.2g cm²/s: the sphere empties in about 0.1 s" % D)
fig.tight_layout(rect=(0, 0, 1, 0.97)); fig.savefig(OUT + "A_fick_snapshots.png", dpi=200); plt.close(fig)

# ---------- B. Full model (Kodra 2026 MS/K-1): swelling + binding + degradation, fields of total and free drug ----------
c = K.F["MS/K-1 (4 h XL)"]; m = K.build(c, K.KOFF); m.N = 40; m.__init__(m.R, m.Dw, m.phi0, m.kon, m.koff, m.Smax0, m.g, 40, m.h, m.Dfun)
tB = np.array([1, 3, 5, 8, 12, 24.]) * H
y0 = np.concatenate([np.zeros(40), np.ones(40), np.zeros(40)])
sol = solve_ivp(m.rhs, (0, tB[-1]), y0, method="BDF", t_eval=tB, rtol=1e-7, atol=1e-12, max_step=tB[-1] / 400)
rc = np.concatenate([[0], m.rc]) * 1e4
FIRR = 0.38   # step 5: non-releasable pool of MS/K-1, from the end points of the curves (as in the simulator)
def prof(i, which):
    Cc, Ss, Pp = sol.y[:40, i], sol.y[40:80, i], sol.y[80:, i]
    v = {"total": FIRR + (1 - FIRR) * (Cc + Ss + Pp), "free": (1 - FIRR) * Cc}[which] * 100
    return np.concatenate([[v[0]], v])
fig, axs = plt.subplots(2, 3, figsize=(10, 6.6))
for ax, i in zip(axs.flat, range(6)):
    p = prof(i, "total"); halfdisc(ax, rc, p, 0, 100, "Time=%g h\nSurface: total drug (C+S+P+I)/C₀ (%%)   Streamline: flux" % (tB[i] / H))
frame(fig, "Full model (step 5), MS/K-1 (Kodra 2026): measured swelling + binding + measured degradation + non-releasable pool. Drug leaves uniformly, not surface-first")
fig.tight_layout(rect=(0, 0, 1, 0.97)); fig.savefig(OUT + "B_full_model_total.png", dpi=200); plt.close(fig)
fig, axs = plt.subplots(2, 3, figsize=(10, 6.6))
for ax, i in zip(axs.flat, range(6)):
    p = prof(i, "free"); halfdisc(ax, rc, p, 0, p.max(), "Time=%g h\nSurface: free drug C/C₀ (%%)   Streamline: flux" % (tB[i] / H))
frame(fig, "Same run, free drug only: a steady parabolic gradient exists, but it holds less than %.1e %% of the drug" % max(prof(i, 'free').max() for i in range(6)))
fig.tight_layout(rect=(0, 0, 1, 0.97)); fig.savefig(OUT + "C_full_model_free.png", dpi=200); plt.close(fig)

# ---------- D. 3D cut-away (270 deg revolution, like COMSOL) ----------
def cutaway(ax, r_um, p, vmax, title):
    norm = colors.Normalize(0, vmax); cmap = cm.jet; R = r_um[-1]
    u = np.linspace(0, 1.5 * np.pi, 80); v = np.linspace(0, np.pi, 50); U, Vv = np.meshgrid(u, v)
    X, Y, Z = R * np.cos(U) * np.sin(Vv), R * np.sin(U) * np.sin(Vv), R * np.cos(Vv)
    ax.computed_zorder = False
    ax.plot_surface(X, Y, Z, facecolors=cmap(norm(np.full_like(X, p[-1]))), shade=True, linewidth=0, antialiased=False, zorder=1)
    rr = np.linspace(0, R, 60); tt = np.linspace(0, np.pi, 60); RR, TT = np.meshgrid(rr, tt); val = np.interp(RR, r_um, p)
    for ang in (0.0, 1.5 * np.pi):
        ax.plot_surface(RR * np.sin(TT) * np.cos(ang), RR * np.sin(TT) * np.sin(ang), RR * np.cos(TT), facecolors=cmap(norm(val)), shade=False, linewidth=0, zorder=2)
    ax.set_box_aspect((1, 1, 1)); ax.view_init(24, -40); ax.set_title(title, fontsize=8)
    for a in (ax.xaxis, ax.yaxis, ax.zaxis): a.set_tick_params(labelsize=6)
    sm = cm.ScalarMappable(norm=norm, cmap=cmap); plt.colorbar(sm, ax=ax, fraction=0.04, pad=0.08).ax.tick_params(labelsize=6)
fig = plt.figure(figsize=(10, 4.6))
cutaway(fig.add_subplot(121, projection="3d"), r * 1e4, np.clip(crank_field(0.01), 0, 100), 100, "Step 1, Fick: free drug at t = 0.01 s (C/C₀, %)")
cutaway(fig.add_subplot(122, projection="3d"), rc, prof(3, "total"), 100, "Full model MS/K-1: total drug at t = 8 h (%) — uniform inside")
fig.tight_layout(); fig.savefig(OUT + "D_cutaway_3d.png", dpi=200); plt.close(fig)

# ---------- E. Mesh (radial finite-volume shells, shown on the half disc) ----------
fig, ax = plt.subplots(figsize=(4.2, 5))
Rm = m.R * 1e4; th = np.linspace(-np.pi / 2, np.pi / 2, 200)
for rf in m.rface * 1e4: ax.plot(rf * np.cos(th), rf * np.sin(th), color="#555", lw=0.4)
for a in np.radians(np.arange(-90, 91, 7.5)): ax.plot([0, Rm * np.cos(a)], [0, Rm * np.sin(a)], color="#999", lw=0.3)
ax.fill_between([0, 0], [0, 0]); ax.plot([0, 0], [-Rm, Rm], color="r", lw=1.2, ls="--")
ax.set_aspect("equal"); ax.set_title("Mesh: 40 radial finite-volume shells (symmetry axis dashed red)", fontsize=7.5, loc="left")
ax.tick_params(labelsize=6.5); ax.set_xlabel("µm", fontsize=7); fig.tight_layout(); fig.savefig(OUT + "E_mesh.png", dpi=200); plt.close(fig)
print("done; free-drug max % in full model:", [round(prof(i, 'free').max(), 6) for i in range(6)], "total centre:", [round(prof(i, 'total')[0], 1) for i in range(6)])
