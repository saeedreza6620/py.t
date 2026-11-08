# Abdekhodaie & Wu 2006 (verapamil loading onto Sephadex SP C-25, Fig. 13): why Fick alone fails and what makes the model sync.
# Four stages, each adds one physical element. Everything except K_ads comes from formulas or from the paper's independent
# equilibrium experiment (Fig. 12). K_ads is fitted on one curve only (as the paper does); the other two curves are predictions.
import numpy as np, json
from scipy.integrate import solve_ivp
from scipy.optimize import brentq

t_d = np.array([1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 18.0])          # min, Fig. 13
DATA = {
 "λ = 40.67, C0 = 1.8 mg/ml": (40.67, 1.8, [0.346, 0.216, 0.155, 0.106, 0.103, 0.087, 0.078, 0.069, 0.069, 0.069, 0.069, 0.069]),
 "λ = 82.33, C0 = 1.8 mg/ml": (82.33, 1.8, [0.566, 0.476, 0.439, 0.417, 0.40, 0.399, 0.381, 0.380, 0.381, 0.375, 0.372, 0.362]),
 "λ = 40.67, C0 = 3.6 mg/ml": (40.67, 3.6, [0.514, 0.420, 0.381, 0.35, 0.344, 0.336, 0.336, 0.325, 0.318, 0.318, 0.317, 0.317]),
}
MW, CMAX, K, KADS = 491.06, 0.229, 6056.0, 0.133       # g/mol; M; 1/M (Fig. 12); (M s)^-1 fitted by the paper on curve 1
R_UM, Q = 100.0, 12.0
def eta_cP(T): return 2.414e-2 * 10 ** (247.8 / (T - 140))
T, V = 298.15, 573.0
rs_A = (3 * V / (4 * np.pi * 6.02214e23)) ** (1/3) * 1e8
Dw = 7.4e-8 * np.sqrt(2.6 * 18.015) * T / (eta_cP(T) * V ** 0.6)        # Wilke–Chang
D_MM = Dw * ((1 - 1/Q) / (1 + 1/Q)) ** 2                                 # Mackie–Meares
D_26 = Dw * rs_A * Q ** -0.75 * np.exp(-1 / (Q - 1))                      # Abdekhodaie Eq. 26 (crosslinked network, via Q)
FAST, N = 1e4, 60

def solve(lam, C0mg, D, kads, binding, tmax=1200, R_um=R_UM, teval=None):
    R = R_um * 1e-4; C0 = C0mg / MW
    r = np.linspace(0, R, N + 1); rc = 0.5 * (r[1:] + r[:-1])
    Vc = 4/3 * np.pi * (r[1:]**3 - r[:-1]**3); A = 4 * np.pi * r**2; Vb = lam * 4/3 * np.pi * R**3; kdes = kads / K
    def rhs(t, y):
        C = y[:-1]; Cb = y[-1]; F = np.zeros(N + 1)
        F[1:-1] = D * A[1:-1] * (C[1:] - C[:-1]) / (rc[1:] - rc[:-1])
        Cs = C[-1]
        rate = kads * Cb * (CMAX - Cs) - kdes * Cs if binding else kads * (Cb - Cs)
        F[-1] = rate * Vb
        return np.append((F[1:] - F[:-1]) / Vc, -rate)
    sol = solve_ivp(rhs, (0, tmax), np.append(np.zeros(N), C0), method="BDF", rtol=1e-7, atol=1e-13, dense_output=True, max_step=tmax / 50)
    return sol, rc * 1e4, C0

STAGES = [
 ("1. Fick only (D from formula, Mackie–Meares)", dict(D=D_MM, kads=FAST, binding=False), "#8A8F99"),
 ("2. + crosslinked network (D from Eq. 26, Q = 12)", dict(D=D_26, kads=FAST, binding=False), "#6B4FD8"),
 ("3. + Langmuir equilibrium (K, C_max from Fig. 12)", dict(D=D_26, kads=FAST, binding=True), "#2F5CF0"),
 ("4. + Langmuir kinetics (K_ads, one curve)", dict(D=D_26, kads=KADS, binding=True), "#EB6834"),
]
def eq30(lam, C0mg):
    C0 = C0mg / MW; f = lambda m: CMAX * K / (lam * (1 + K * C0 * m)) - (1 / m - 1); return brentq(f, 1e-9, 1 - 1e-12)

res = {"D": dict(Dw=Dw, D_MM=D_MM, D_26=D_26, D_paper=3.21e-6, tau_ads_s=1 / (KADS * CMAX)), "cases": {}}
curves = {}
for lab, (lam, C0mg, y) in DATA.items():
    y = np.array(y); row = dict(plateau_data=float(y[-3:].mean()), plateau_eq30=eq30(lam, C0mg))
    tt = np.logspace(-1, np.log10(1200), 700); curves[lab] = {}
    for nm, kw, col in STAGES:
        sol, _, C0 = solve(lam, C0mg, **kw); bath = lambda s: sol.sol(s)[-1] / C0
        yy = bath(tt); pl = bath(1200.0); target = 1 - 0.9 * (1 - pl); i = np.argmax(yy <= target)
        row[nm] = dict(rms=float(np.sqrt(np.mean((bath(t_d * 60) - y) ** 2))), plateau=float(pl), t90_s=float(tt[i]) if yy[i] <= target else None)
        curves[lab][nm] = yy
    tdat = np.concatenate([[0], t_d * 60]); ydat = np.concatenate([[1], y]); target = 1 - 0.9 * (1 - row["plateau_data"]); j = np.argmax(ydat <= target)
    row["t90_data_s"] = float(np.interp(target, [ydat[j], ydat[j-1]], [tdat[j], tdat[j-1]])); res["cases"][lab] = row
json.dump(res, open("abd06_sync_results.json", "w"), ensure_ascii=False, indent=1)
for lab, row in res["cases"].items():
    print(lab, "data plateau %.3f t90 %.0f s" % (row["plateau_data"], row["t90_data_s"]))
    for nm, _, _ in STAGES: print("   ", nm[:40], {k: (round(v, 3) if isinstance(v, float) else v) for k, v in row[nm].items()})
print({k: "%.3g" % v for k, v in res["D"].items()})

# ---------------- figures ----------------
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 9.5})
# (1) stage-by-stage curves, COMSOL 1D-plot look (grid, coloured lines, markers)
fig, axs = plt.subplots(1, 3, figsize=(15, 5.2), sharey=True)
tt = np.logspace(-1, np.log10(1200), 700)
for ax, (lab, (lam, C0mg, y)) in zip(axs, DATA.items()):
    for nm, kw, col in STAGES:
        ax.plot(tt, curves[lab][nm], color=col, lw={"1":4.5,"2":1.6,"3":2,"4":2.6}[nm[0]], ls={"1":"-","2":"--","3":"-","4":"-"}[nm[0]], alpha=0.55 if nm[0]=="1" else 1, label=nm)
    ax.plot(t_d * 60, y, "ks", ms=6, label="data (Fig. 13)")
    ax.set_xscale("log"); ax.set_xlim(0.1, 1200); ax.set_ylim(0, 1.04); ax.grid(color="#dcdcdc", lw=0.6, which="both")
    for s, l in ((1, "1 s"), (60, "1 min"), (600, "10 min")): ax.text(s * 1.08, 0.015, l, ha="left", fontsize=8.5, color="#555"); ax.axvline(s, color="#bbb", lw=0.9)
    ax.set_title(lab, loc="left", fontsize=10); ax.set_xlabel("Time (s, log scale)")
axs[0].set_ylabel("Fraction of drug remaining in the bath")
h, l = axs[0].get_legend_handles_labels(); fig.legend(h, l, loc="lower center", ncol=5, fontsize=8.6, frameon=False)
fig.tight_layout(rect=(0, 0.08, 1, 1)); fig.savefig("figs/1_stages_vs_data.png", dpi=180); plt.close(fig)

# (2) RMS by stage
fig, ax = plt.subplots(figsize=(8, 4.2)); x = np.arange(4); w = 0.26
for k, (lab, row) in enumerate(res["cases"].items()):
    ax.bar(x + (k - 1) * w, [row[nm]["rms"] for nm, _, _ in STAGES], w, label=lab, color=["#0000FF", "#008000", "#FF0000"][k])
ax.set_xticks(x, ["1. Fick", "2. + crosslink\n(Eq. 26)", "3. + Langmuir\nequilibrium", "4. + Langmuir\nkinetics"]); ax.set_ylabel("RMS error (fraction)")
ax.grid(axis="y", color="#dcdcdc"); ax.legend(frameon=False, fontsize=8.5); ax.set_title("Error vs data, stage by stage", loc="left")
fig.tight_layout(); fig.savefig("figs/2_rms_by_stage.png", dpi=180); plt.close(fig)

# (3) COMSOL-style fields inside the bead (curve 1): stage 3 (fills in seconds, from the surface) vs stage 4 (minutes, uniform)
import sys; sys.path.insert(0, ".")
from comsol_lib import halfdisc, frame, cutaway
lam, C0mg, _ = DATA["λ = 40.67, C0 = 1.8 mg/ml"]
for nm, kw, times, unit, tag in ((STAGES[2][0], STAGES[2][1], [0.2, 0.5, 1, 2, 4, 8], "s", "3_fields_stage3"),
                                 (STAGES[3][0], STAGES[3][1], [10, 30, 60, 120, 240, 600], "s", "4_fields_stage4")):
    sol, rc, C0 = solve(lam, C0mg, **kw); Cfin = sol.sol(1200.0)[:-1].mean()
    fig, axs = plt.subplots(2, 3, figsize=(10, 6.6))
    for ax, t in zip(axs.flat, times):
        p = 100 * sol.sol(t)[:-1] / Cfin; p = np.concatenate([[p[0]], p, [p[-1]]]); rr = np.concatenate([[0], rc, [R_UM]])
        halfdisc(ax, rr, p, 0, 100, "Time=%g %s\nSurface: drug in bead / final loading (%%)   Streamline: flux" % (t, unit), inward=True)
    frame(fig, ("Stage 3, Fick + Langmuir equilibrium: the bead fills from the surface inward in about 8 s"
                if tag.startswith("3") else "Stage 4, + Langmuir kinetics (synced model): the bead fills uniformly over minutes, as in the data"))
    fig.tight_layout(rect=(0, 0, 1, 0.97)); fig.savefig("figs/%s.png" % tag, dpi=200); plt.close(fig)
print("figures done")

# (5) 3D cut-away at the same loading level (about 50 %): stage 3 at ~1 s vs stage 4 at ~60 s
fig = plt.figure(figsize=(10, 4.6))
for k, (nm, kw, t, ttl) in enumerate(((STAGES[2][0], STAGES[2][1], 1.0, "Stage 3 (Fick + Langmuir equilibrium), t = 1 s"),
                                      (STAGES[3][0], STAGES[3][1], 60.0, "Stage 4 (+ Langmuir kinetics), t = 60 s"))):
    sol, rc, C0 = solve(lam, C0mg, **kw); Cfin = sol.sol(1200.0)[:-1].mean()
    p = 100 * sol.sol(t)[:-1] / Cfin; p = np.concatenate([[p[0]], p, [p[-1]]]); rr = np.concatenate([[0], rc, [R_UM]])
    cutaway(fig.add_subplot(1, 2, k + 1, projection="3d"), rr, p, 100, ttl + "\n(drug in bead / final loading, %)")
fig.tight_layout(); fig.savefig("figs/5_cutaway_3d.png", dpi=200); plt.close(fig)
# (6) mesh
fig, ax = plt.subplots(figsize=(4.2, 5)); th = np.linspace(-np.pi / 2, np.pi / 2, 200); rf = np.linspace(0, R_UM, N + 1)
for r0 in rf: ax.plot(r0 * np.cos(th), r0 * np.sin(th), color="#555", lw=0.35)
for a in np.radians(np.arange(-90, 91, 7.5)): ax.plot([0, R_UM * np.cos(a)], [0, R_UM * np.sin(a)], color="#999", lw=0.3)
ax.plot([0, 0], [-R_UM, R_UM], color="r", lw=1.2, ls="--"); ax.set_aspect("equal")
ax.set_title("Mesh: %d radial finite-volume shells, R = %g µm" % (N, R_UM), fontsize=8, loc="left"); ax.set_xlabel("µm")
fig.tight_layout(); fig.savefig("figs/6_mesh.png", dpi=200); plt.close(fig)
