"""Presentation figures, version 2: Fick theory, one card per paper (data + Fick + Fick+swelling),
and line-numbered code images whose comments carry the equation numbers used on the slides.
Runs the notebook script first (all fits come from it), then redraws."""
import matplotlib; matplotlib.use("Agg")
import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
exec(open("gelatin_release_model.py").read())
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D

S = "slidefigs"; os.makedirs(S, exist_ok=True)
NAVY, BLUE, ORANGE, GREEN, GREY = "#0E1B4D", "#2F5CF0", "#EB6834", "#1BAF7A", "#8A93AB"
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 13, "axes.labelsize": 13.5,
                     "xtick.labelsize": 12, "ytick.labelsize": 12, "axes.edgecolor": "#B8C0D6",
                     "axes.labelcolor": "#3A4560", "xtick.color": "#5A6478", "ytick.color": "#5A6478",
                     "axes.spines.top": False, "axes.spines.right": False, "axes.grid": True,
                     "grid.color": "#EEF1F8", "grid.linewidth": 1.2, "legend.frameon": False})

# ---------------------------------------------------------------- 1) Fick theory
taus = [0.005, 0.02, 0.05, 0.1, 0.2]
cols = [plt.cm.Blues(v) for v in np.linspace(0.95, 0.45, len(taus))]
fig, ax = plt.subplots(1, 2, figsize=(13.5, 5.2), gridspec_kw=dict(width_ratios=[1, 1.15]))
x = np.linspace(0, 1, 300)
ax[0].fill_between(x, 0, 1, color="#FFF1E8", zorder=0)
for t_, c_ in zip(taus, cols):
    ax[0].plot(x, fick_profile(x, t_), color=c_, lw=3.4)
    lev = {0.005: 0.9, 0.02: 0.72, 0.05: 0.55, 0.1: 0.38}.get(t_)
    if lev is None: xi, yi = 0.42, fick_profile(np.array([0.32]), t_)[0] + 0.05
    else: xi = x[np.argmin(np.abs(fick_profile(x, t_)[150:] - lev)) + 150] if t_ < 0.05 else x[np.argmin(np.abs(fick_profile(x, t_) - lev))]; yi = lev
    ax[0].annotate(f"τ = {t_:g}", (xi, yi), xytext=(-8, 0), textcoords="offset points", ha="right", va="center",
                   color=c_, fontsize=12, fontweight="bold")
ax[0].set_xlabel("position inside the sphere   r / R   (0 = centre, 1 = surface)")
ax[0].set_ylabel("drug left inside   C / C₀"); ax[0].set_ylim(0, 1.08); ax[0].set_xlim(0, 1)
ax[0].set_title("(a) concentration profiles", loc="left", color=NAVY, fontweight="bold")
tt = np.linspace(0, 0.36, 400)
ax[1].plot(tt, fick_F(tt) * 100, color=BLUE, lw=4.5, zorder=3)
for t_, c_ in zip(taus, cols):
    ax[1].plot(t_, fick_F(t_)[0] * 100, "o", ms=13, color=c_, mec="white", mew=2, zorder=4)
t50 = brentq(lambda s_: fick_F(s_)[0] - 0.5, 1e-4, 1)
ax[1].plot([t50, t50], [0, 50], "--", color=ORANGE, lw=2); ax[1].plot([0, t50], [50, 50], "--", color=ORANGE, lw=2)
ax[1].annotate(f"half released at τ = {t50:.4f}\n→  t₅₀ = {t50:.4f} · R² / D", (t50, 50), xytext=(0.09, 30),
               fontsize=13, color="#C24E17", fontweight="bold",
               arrowprops=dict(arrowstyle="->", color="#C24E17", lw=1.6))
ax[1].set_xlabel("dimensionless time   τ = D t / R²"); ax[1].set_ylabel(r"released   $M_t/M_\infty$  (%)")
ax[1].set_xlim(0, 0.36); ax[1].set_ylim(0, 102)
ax[1].set_title("(b) release curve  F(τ)", loc="left", color=NAVY, fontweight="bold")
plt.tight_layout(); plt.savefig(f"{S}/v2_fick_theory.png", dpi=170); plt.close()
print("t50 (tau) =", t50)

# ---------------------------------------------------------------- 2) one card per paper
MK = ["o", "s", "^"]
SHADE = ["#0E1B4D", "#4A5678", "#8A93AB"]
FULL = {"fick": "Fick (const D)", "swell": "Fick + swelling", "size": "Fick + swelling + size change"}
def row(case, name, kind):
    s = RES[(RES.case == case) & (RES.formulation == name) & (RES.model == FULL[kind])]
    return s.iloc[0] if len(s) else None

def paper_card(case, fname, names=None, kinds=("fick", "swell"), days=True, logx=False, ylab=None, short=None):
    d = DATA[case]; names = names or list(d["series"])
    fig, ax = plt.subplots(figsize=(5.6, 3.25))
    scale_t = 1 / 24 if days else 1.0
    tmax = max(max(d["series"][n][0]) for n in names); ends = []
    for i, name in enumerate(names):
        t, y = map(lambda a: np.array(a, float), d["series"][name]); s = 100 if d["unit"] == "%" else 1
        tt = (np.logspace(np.log10(t.min() / 3), np.log10(tmax * 1.08), 300) if logx
              else np.linspace(1e-3, tmax * 1.04, 300))
        for kind in kinds:
            r = row(case, name, kind)
            if r is None: continue
            style = {"fick": dict(color=BLUE, lw=2.8, ls="-"), "swell": dict(color=ORANGE, lw=2.8, ls=(0, (5, 2.2))),
                     "size": dict(color=GREEN, lw=2.8, ls="-")}[kind]
            ax.plot(tt * scale_t, model(kind, tt, r.k_per_h, r.A, name) * s, zorder=3, **style)
        ax.plot(t * scale_t, y, MK[i], color=SHADE[i], ms=7.5, mec="white", mew=1.2, zorder=5)
        ends.append((y[-1], (short or {}).get(name, name), SHADE[i]))
    if logx: ax.set_xscale("log")
    ax.set_xlabel("time (days)" if days else "time (h)")
    ax.set_ylabel(ylab or ("released (%)" if d["unit"] == "%" else d["unit"]))
    lo, hi = ax.get_ylim(); ax.set_ylim(min(0, lo), hi * 1.12); lo, hi = ax.get_ylim()
    xr = tmax * scale_t * (1.03 if not logx else 1.25)
    ax.set_xlim(right=tmax * scale_t * (1.30 if not logx else 3.2))
    if len(names) > 1:
        ends.sort(); gap = 0.085 * (hi - lo); ys = []
        for yv, _, _ in ends: ys.append(max(yv, ys[-1] + gap) if ys else yv)
        over = ys[-1] - (hi - 0.04 * (hi - lo))
        if over > 0: ys = [v - over for v in ys]
        for (yv, lab, col), yl in zip(ends, ys):
            ax.annotate(lab, (xr, yl), ha="left", va="center", fontsize=11, color=col, fontweight="bold")
    h = []
    if "fick" in kinds: h.append(Line2D([], [], color=BLUE, lw=2.8, label="Fick, constant D"))
    if "swell" in kinds: h.append(Line2D([], [], color=ORANGE, lw=2.8, ls=(0, (5, 2.2)), label="Fick + swelling"))
    if "size" in kinds: h.append(Line2D([], [], color=GREEN, lw=2.8, label="Fick + swelling + growth"))
    h.append(Line2D([], [], marker="o", ls="", color=NAVY, ms=7, mec="white", label="extracted data"))
    ax.legend(handles=h, loc="lower right" if not logx else "upper left", fontsize=10.5, handlelength=2.2)
    plt.tight_layout(); plt.savefig(f"{S}/{fname}", dpi=210); plt.close()

paper_card("Diclofenac GMS", "v2_p_diclofenac.png", short={"GM1 (9.8%)": "GM1", "GM2 (18.3%)": "GM2", "GM3 (26.7%)": "GM3"})
paper_card("Icariin GMs", "v2_p_icariin.png", short={"GM-1 (0.25 mM)": "GM-1", "GM-2 (0.5 mM)": "GM-2"})
paper_card("Morphine GMS", "v2_p_morphine.png", days=False, logx=True)
paper_card("Ketoprofen GMS", "v2_p_ketoprofen.png", kinds=("fick", "size"), days=False, logx=True,
           short={"MS/K-1 (4 h XL)": "MS/K-1", "MS/K-2 (2 h XL)": "MS/K-2", "MS/K-3 (0.5 h XL)": "MS/K-3"})
paper_card("bFGF GMS", "v2_p_bfgf.png", short={"A porous": "A porous", "B normal": "B normal"})
paper_card("Vancomycin GMS", "v2_p_vanco.png")
paper_card("Gentamicin GMS (Chang)", "v2_p_chang.png", ylab="cumulative (mg/mL)")
paper_card("Gentamicin m-EmG (Hu)", "v2_p_hu.png", ylab="cumulative (mg)")

# ---------------------------------------------------------------- 3) code images (line numbers + equation tags)
from pygments import highlight
from pygments.lexers import PythonLexer
from pygments.formatters import ImageFormatter
from pygments.styles.monokai import MonokaiStyle
from pygments.token import Comment
class DeckStyle(MonokaiStyle):
    background_color = "#0F1A3D"
    styles = dict(MonokaiStyle.styles); styles[Comment] = "#8FA2DE"; styles[Comment.Single] = "#8FA2DE"

FICK_CODE = '''# ── Eq.(2)  exact Fick release from a sphere ─────────────────
def fick_F(tau):
    tau = np.atleast_1d(tau); out = np.zeros_like(tau)
    s = (tau > 0) & (tau < 0.01)          # short times → image form
    l = tau >= 0.01                       # long times  → eigen-series
    z = np.arange(1, 7)[:, None] / np.sqrt(tau[s])
    ierfc = np.exp(-z**2)/np.sqrt(np.pi) - z*erfc(z)
    out[s] = 6*np.sqrt(tau[s])*(1/np.sqrt(np.pi) + 2*ierfc.sum(0)) - 3*tau[s]
    n = np.arange(1, 40)[:, None]
    out[l] = 1 - 6/np.pi**2 * np.sum(np.exp(-n**2*np.pi**2*tau[l])/n**2, 0)
    return out

# ── Eq.(3)  τ = k·t ,  k = D/R²  → one parameter per curve ──
k, A, se = fit("fick", t, y, amp_free)    # multi-start least squares
D_app = k/3600 * (R*1e-4)**2              # 1/h and µm  →  cm²/s

# ── fair test: fit the first 60 % of points, predict the rest ─
ntr = max(3, int(0.6*n))
k_tr, A_tr, _ = fit("fick", t[:ntr], y[:ntr], amp_free)'''

SWELL_CODE = '''# ── Eq.(4)  Abbasi Eq.3: D rises with the local water content ──
Dw = (4.4/3.8) * np.exp(-6.8 * (1 - theta_f))    # water,  β_w = 6.8
Dd =             np.exp(-8.5 * (1 - theta_f))    # drug,   β_d = 8.5

# ── Eq.(5)  two coupled Fick equations, front-fixing A = r/R(t) ─
for _ in range(2):                         # Picard: water eq. is nonlinear
    theta, _ = implicit(theta, Dw, a, dt, rho, ub=1.0)  # surface: C_w = C_w,eq
c, Gd = implicit(c, Dd, a, dt, rho, ub=0.0)             # surface: perfect sink

# ── Eq.(6)  volume additivity (Abbasi Eq.15) → particle radius ──
rho = (1 / (1 - phi_w * np.dot(V, theta) / V.sum())) ** (1/3)

# ── Eq.(7)  one simulation → master curve → fit only k_eq ──────
MASTER["swell"] = simulate_swelling(TAU)["F"]
k_eq, A, se = fit("swell", t, y, amp_free)
D_eq = k_eq/3600 * (R*1e-4)**2            # same split, same data as Fick'''

for fn, code in {"v2_code_fick.png": FICK_CODE, "v2_code_swell.png": SWELL_CODE}.items():
    img = highlight(code, PythonLexer(), ImageFormatter(style=DeckStyle, font_name="DejaVu Sans Mono", font_size=28,
                    line_numbers=True, line_number_bg="#0B1433", line_number_fg="#56689E", line_number_pad=14,
                    image_pad=30, line_pad=10))
    open(f"{S}/{fn}", "wb").write(img)
print("v2 figures:", sorted(f for f in os.listdir(S) if f.startswith("v2_")))
