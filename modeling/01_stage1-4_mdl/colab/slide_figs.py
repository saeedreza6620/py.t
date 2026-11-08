"""Figures sized for the slide deck (larger fonts). Runs the notebook script first, then redraws."""
import matplotlib; matplotlib.use("Agg")
import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
exec(open("gelatin_release_model.py").read())
import matplotlib.pyplot as plt
S = "slidefigs"; os.makedirs(S, exist_ok=True)
plt.rcParams.update({"font.size": 15, "axes.labelsize": 16, "axes.titlesize": 16, "legend.fontsize": 12.5,
                     "xtick.labelsize": 13, "ytick.labelsize": 13, "font.family": "DejaVu Sans"})
PURPLE = "#7b4fd6"

# 1) Step 1: Fick master curve with every data set mapped onto tau = k_fit * t
fig, ax = plt.subplots(figsize=(11, 5.6))
tt = np.logspace(-3.3, 0.6, 400)
ax.plot(tt, fick_F(tt) * 100, color=BLUE, lw=4, label="Fick solution  F(τ)", zorder=6)
for case, d in DATA.items():
    for name, (t, y) in d["series"].items():
        t = np.array(t, float); y = np.array(y, float)
        r = RES[(RES.case == case) & (RES.formulation == name) & (RES.model == "Fick (const D)")].iloc[0]
        yn = y / 100 if d["unit"] == "%" else y / r.A
        g = [k for k, v in GROUP.items() if name in v][0]
        ax.plot(r.k_per_h * t, yn * 100, "o", ms=7, color=GCOL[g], alpha=.85, mec="white", mew=.6)
for g, c in GCOL.items(): ax.plot([], [], "o", color=c, ms=9, label=g)
ax.set_xscale("log"); ax.set_xlabel("τ = D t / R²   (each curve placed with its own fitted D)")
ax.set_ylabel("drug released (%)"); ax.set_ylim(-3, 125); ax.legend(loc="upper left", ncol=1)
plt.tight_layout(); plt.savefig(f"{S}/s_fick_collapse.png", dpi=170); plt.close()

# 2) Whiteboard (same as notebook, larger)
fig, ax = plt.subplots(1, 2, figsize=(17, 6.6), gridspec_kw=dict(width_ratios=[1, 1.3]))
tl = np.linspace(0, 4, 500)
ax[0].plot(tl, interp_curve(MASTER["fick"], tl) * 100, color=BLUE, lw=4, label="Fick, constant D")
ax[0].plot(tl, interp_curve(MASTER["swell"], tl) * 100, color=ORANGE, lw=4, label="Fick + swelling")
ax[0].plot(tl, interp_curve(MASTER_SIZE["MS/K-1 (4 h XL)"], tl) * 100, color=GREEN, lw=4, label="Fick + swelling + growth")
ax[0].set_xlabel("τ = D$_{eq}$ t / R$_0^2$ (same D$_{eq}$ for all)"); ax[0].set_ylabel("released (%)")
ax[0].legend(loc="lower right"); ax[0].set_title("(a) theory", loc="left")
seen = set()
for case, d in DATA.items():
    for name, (t, y) in d["series"].items():
        t = np.array(t, float); y = np.array(y, float)
        yn = y / 100 if d["unit"] == "%" else y / np.median(y[(t >= 8) & (t <= 192)])
        g = [k for k, v in GROUP.items() if name in v][0]
        ax[1].plot(t / t_half(t, yn), yn * 100, "o-", color=GCOL[g], ms=6, lw=1, alpha=.85, label=g if g not in seen else None)
        seen.add(g)
x = np.logspace(-2.2, 1.0, 300)
for curve, col, lab in [(MASTER["fick"], BLUE, "Fick shape"), (MASTER_SIZE["MS/K-2 (2 h XL)"], GREEN, "swelling + growth shape")]:
    h50 = brentq(lambda s_: interp_curve(curve, s_) - 0.5, 1e-6, 300)
    ax[1].plot(x, interp_curve(curve, x * h50) * 100, color=col, lw=5, alpha=.45, label=lab)
ax[1].set_xscale("log"); ax[1].set_xlabel("t / t$_{50}$"); ax[1].set_ylabel("released (%)")
ax[1].legend(loc="upper left", fontsize=12); ax[1].set_title("(b) 17 extracted curves, 8 papers", loc="left")
plt.tight_layout(); plt.savefig(f"{S}/s_whiteboard.png", dpi=150); plt.close()

# 3) Per-case comparison figures
LAB = {"fick": "Fick", "swell": "Fick+swelling", "size": "Fick+swelling+growth"}
FULL = {"fick": "Fick (const D)", "swell": "Fick + swelling", "size": "Fick + swelling + size change"}
def case_fig(case, names, fname, w=5.6, logx=True):
    d = DATA[case]; fig, axs = plt.subplots(1, len(names), figsize=(w * len(names), 4.6), squeeze=False)
    for ax, name in zip(axs[0], names):
        t, y = map(lambda a: np.array(a, float), d["series"][name]); s = 100 if d["unit"] == "%" else 1
        tt = np.logspace(np.log10(t.min() / 3), np.log10(t.max() * 1.1), 300) if logx else np.linspace(0, t.max() * 1.05, 300)
        ax.plot(t, y, "o", color=INK, ms=8, label="extracted data", zorder=5)
        for kind, col in [("fick", BLUE), ("swell", ORANGE), ("size", GREEN)]:
            sel = RES[(RES.case == case) & (RES.formulation == name) & (RES.model == FULL[kind])]
            if not len(sel): continue
            r = sel.iloc[0]
            ax.plot(tt, model(kind, tt, r.k_per_h, r.A, name) * s, color=col, lw=3, label=f"{LAB[kind]} (RMSE {r.RMSE:.2g})")
        if logx: ax.set_xscale("log")
        ax.set_title(name); ax.set_xlabel("time (h)"); ax.set_ylabel("released (%)" if d["unit"] == "%" else d["unit"])
        ax.legend(fontsize=11.5, loc="upper left")
    plt.tight_layout(); plt.savefig(f"{S}/{fname}", dpi=150); plt.close()
case_fig("Diclofenac GMS", list(DATA["Diclofenac GMS"]["series"]), "s_diclofenac.png", logx=False)
case_fig("Ketoprofen GMS", list(DATA["Ketoprofen GMS"]["series"]), "s_ketoprofen.png")
case_fig("bFGF GMS", ["A porous", "B normal"], "s_bfgf.png", w=6.4, logx=False)
case_fig("Vancomycin GMS", ["pH 7.4", "pH 6.0"], "s_vanco.png", w=6.4)
case_fig("Gentamicin GMS (Chang)", ["1.0dM-G", "2.5dM-G"], "s_chang.png", w=6.4)
case_fig("Icariin GMs", list(DATA["Icariin GMs"]["series"]), "s_icariin.png", w=6.4, logx=False)

# 4) Inside the particle
tp = np.array([0.02, 0.1, 0.4]); sim = simulate_swelling(tp, profiles_at=range(3))
fig, ax = plt.subplots(1, 2, figsize=(13, 4.6))
for i, t in enumerate(tp):
    r, th, c = sim["prof"][i]
    ax[0].plot(r, th, color=plt.cm.Blues(0.45 + 0.2 * i), lw=3.5, label=f"τ = {t}")
    ax[1].plot(r, c, color=plt.cm.Oranges(0.45 + 0.2 * i), lw=3.5, label=f"with swelling, τ = {t}")
    xx = np.linspace(0, 1, 120); ax[1].plot(xx, fick_profile(xx, t), "--", color=plt.cm.Blues(0.45 + 0.2 * i), lw=2)
ax[0].set_title("water entering  C$_w$/C$_{w,eq}$"); ax[1].set_title("drug left inside  C/C$_0$   (dashed = Fick)")
for a in ax: a.set_xlabel("position r / R  (0 = centre, 1 = surface)"); a.legend(fontsize=11.5)
plt.tight_layout(); plt.savefig(f"{S}/s_profiles.png", dpi=150); plt.close()

# 5) Code images (syntax highlighted)
from pygments import highlight
from pygments.lexers import PythonLexer
from pygments.formatters import ImageFormatter
SNIPS = {
 "code_fick.png": '''def fick_F(tau):
    # Fick release from a sphere, exact at every time
    s = (tau > 0) & (tau < 0.01)        # short times: image solution
    l = tau >= 0.01                     # long times: eigen-series
    z = np.arange(1, 7)[:, None] / np.sqrt(tau[s])
    ierfc = np.exp(-z**2)/np.sqrt(np.pi) - z*erfc(z)
    out[s] = 6*np.sqrt(tau[s])*(1/np.sqrt(np.pi) + 2*ierfc.sum(0)) - 3*tau[s]
    n = np.arange(1, 40)[:, None]
    out[l] = 1 - 6/np.pi**2*np.sum(np.exp(-n**2*np.pi**2*tau[l])/n**2, 0)
    return out''',
 "code_swelling.png": '''# Abbasi-type swelling: D depends on local water content
Dw = ratio * np.exp(-beta_w * (1 - theta_face))     # water diffusivity
Dd = np.exp(-beta_d * (1 - theta_face))             # drug diffusivity

# front-fixing A = r/R(t): the growing particle maps to 0..1
G    = A_face**2 * D / dist / rho**2                # true shell areas
main = V/dt + G[:-1] + G[1:] + V*a/h                # implicit + upwind growth term

# volume additivity (Abbasi Eq. 15): exact final size
rho = (1 / (1 - phi_w * np.dot(V, theta) / V.sum())) ** (1/3)''',
 "code_fit.png": '''# one simulation -> a master curve -> instant fits
TAU = np.logspace(-6, np.log10(400), 500)
MASTER["swell"] = simulate_swelling(TAU)["F"]

def model(kind, t, k, A=1.0):
    return A * np.interp(np.log(k*t), np.log(TAU), MASTER[kind])

# same data, same split, one parameter (k) for both models
ntr = max(3, int(0.6*n))                  # first 60 % of points = training
k_fick  = fit("fick",  t[:ntr], y[:ntr])
k_swell = fit("swell", t[:ntr], y[:ntr])  # test on t[ntr:] without refitting''',
}
for fn, code in SNIPS.items():
    img = highlight(code, PythonLexer(), ImageFormatter(font_name="DejaVu Sans Mono", font_size=30, line_numbers=False,
                    style="monokai", image_pad=28, line_pad=8))
    open(f"{S}/{fn}", "wb").write(img)
print("slide figures written:", sorted(os.listdir(S)))
