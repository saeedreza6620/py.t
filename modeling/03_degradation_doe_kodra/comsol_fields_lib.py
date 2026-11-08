# COMSOL-style plotting helpers (half-disc axisymmetric surface plot, jet colormap, white flux streamlines, colourbar min/max markers)
import numpy as np, matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
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

