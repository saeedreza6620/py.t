"""Stage 1 — Numerical verification (صحت‌سنجی عددی).
No literature data are used here. Run:  python stage1_verification.py
Outputs: ../figures/Fig1_*.png and ../results/stage1_results.json
"""
import json, os, time
import numpy as np
import fick_core as fc
from plotstyle import plt, save, C, MARKERS, INK2

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIG = os.path.join(ROOT, "figures"); RES = os.path.join(ROOT, "results")
os.makedirs(FIG, exist_ok=True); os.makedirs(RES, exist_ok=True)
out = {}

# ---------------------------------------------------------------- 1. series control
tau_s = np.logspace(-6, 0.3, 60)
F_ser, nterm = fc.release_series(tau_s, tol=1e-13, return_terms=True)
F_st = fc.release_short_time(tau_s)
F_prod = fc.release_analytical(tau_s)
mask = tau_s <= 0.05
out["series"] = dict(
    tol=1e-13,
    max_terms=int(nterm.max()), terms_at_tau_1em6=int(nterm[0]),
    max_abs_diff_series_vs_short_time_tau_le_0p05=float(np.max(np.abs(F_ser - F_st)[mask])),
    max_abs_diff_production_vs_series=float(np.max(np.abs(F_prod - F_ser))),
)
fig, ax = plt.subplots(1, 2, figsize=(7.6, 3.0))
ax[0].loglog(tau_s, nterm, "-", color=C[0])
ax[0].set_xlabel(r"$\tau = Dt/R^2$"); ax[0].set_ylabel("terms needed (tail bound < 1e-13)")
ax[1].loglog(tau_s[mask], np.abs(F_ser - F_st)[mask] + 1e-17, "o", ms=3, color=C[1])
ax[1].set_xlabel(r"$\tau$"); ax[1].set_ylabel("|series − short-time form|")
save(fig, os.path.join(FIG, "Fig1_1_series_convergence.png"))

# ---------------------------------------------------------------- 2. FVM vs analytical
tau_out = np.round(np.concatenate([np.arange(1, 10) * 1e-3, np.arange(1, 10) * 1e-2,
                                   np.arange(1, 21) * 0.05]), 6)
tau_out = np.unique(tau_out)
F_ex = fc.release_series(tau_out)
runs = {}
for N in [25, 50, 100, 200]:
    m = fc.SphereFVM(N)
    runs[N] = m.solve(tau_out, 1e-5, theta=0.5, rannacher=4)
r100 = runs[100]
fig, ax = plt.subplots(1, 2, figsize=(7.6, 3.1))
tt = np.linspace(0, 1, 400)
for a, xs in zip(ax, ["lin", "log"]):
    tt_ = tt if xs == "lin" else np.logspace(-3, 0, 400)
    a.plot(tt_, fc.release_series(tt_), "-", color=C[0], label="analytical series")
    a.plot(tau_out, r100["F_inv"], "o", mfc="none", color=C[1], ms=4, label="FVM, N=100")
    a.set_xlabel(r"$\tau = Dt/R^2$"); a.set_ylabel(r"$F=M_{rel}/M_0$")
    if xs == "log": a.set_xscale("log")
ax[0].legend(loc="lower right")
save(fig, os.path.join(FIG, "Fig1_2_FVM_vs_analytical.png"))

fig, ax = plt.subplots(figsize=(4.6, 3.2))
for i, N in enumerate(runs):
    ax.loglog(tau_out, np.abs(runs[N]["F_inv"] - F_ex) + 1e-16, MARKERS[i] + "-", ms=3,
              lw=1, color=C[i], label=f"N={N}")
ax.set_xlabel(r"$\tau$"); ax.set_ylabel(r"$|F_{FVM}-F_{exact}|$"); ax.legend()
save(fig, os.path.join(FIG, "Fig1_3_error_vs_time.png"))
out["fvm_vs_exact"] = {f"N{N}": dict(max_err_all=float(np.max(np.abs(runs[N]["F_inv"] - F_ex))),
                                     max_err_tau_ge_0p01=float(np.max(np.abs(runs[N]["F_inv"] - F_ex)[tau_out >= 0.01])))
                       for N in runs}

# ---------------------------------------------------------------- 3. mesh convergence (time error negligible)
Ns = [10, 20, 40, 80, 160, 320]
tau_m = np.array([0.01, 0.02, 0.05, 0.1, 0.2, 0.5])
eF, eP = [], []
xs_eval = None
for N in Ns:
    m = fc.SphereFVM(N)
    r = m.solve(tau_m, 2e-6, theta=0.5, rannacher=4, store_profiles={2})
    eF.append(np.max(np.abs(r["F_inv"] - fc.release_series(tau_m))))
    cex = fc.profile_analytical(m.xc, 0.05)
    eP.append(np.sqrt(np.sum(m.V * (r["profiles"][2] - cex) ** 2) / m.Vtot))
eF, eP = np.array(eF), np.array(eP)
pF = np.log2(eF[:-1] / eF[1:]); pP = np.log2(eP[:-1] / eP[1:])
out["mesh_convergence"] = dict(N=Ns, dtau=2e-6, err_F_max_tau_0p01_to_0p5=eF.tolist(),
                               order_F=pF.tolist(), err_profile_L2_tau_0p05=eP.tolist(), order_profile=pP.tolist())
fig, ax = plt.subplots(figsize=(4.6, 3.3))
h = 1 / np.array(Ns)
ax.loglog(h, eF, "o-", color=C[0], label=r"max $|F-F_{exact}|$, $\tau\in[0.01,0.5]$")
ax.loglog(h, eP, "s-", color=C[1], label=r"volume-weighted L2 of $c$ at $\tau=0.05$")
ax.loglog(h, eF[0] * (h / h[0]) ** 2, ":", color=INK2, label="slope 2 (reference)")
ax.set_xlabel(r"cell size $\Delta x = 1/N$"); ax.set_ylabel("error"); ax.legend(fontsize=8)
save(fig, os.path.join(FIG, "Fig1_4_mesh_convergence.png"))

# ---------------------------------------------------------------- 4. time convergence (same mesh, reference = tiny dtau)
Nt = 200
m = fc.SphereFVM(Nt)
tau_t = np.array([0.1, 0.2, 0.3, 0.4])
ref = m.solve(tau_t, 1e-6, theta=0.5, rannacher=4)["F_inv"]
dts = np.array([0.02, 0.01, 0.005, 0.0025, 0.00125, 0.000625])
eBE, eCN = [], []
for dt in dts:
    eBE.append(np.max(np.abs(m.solve(tau_t, dt, theta=1.0)["F_inv"] - ref)))
    eCN.append(np.max(np.abs(m.solve(tau_t, dt, theta=0.5, rannacher=4)["F_inv"] - ref)))
eBE, eCN = np.array(eBE), np.array(eCN)
out["time_convergence"] = dict(N=Nt, dtau=dts.tolist(), err_BE=eBE.tolist(), err_CN_Rannacher=eCN.tolist(),
                               order_BE=np.log2(eBE[:-1] / eBE[1:]).tolist(),
                               order_CN=np.log2(eCN[:-1] / eCN[1:]).tolist())
fig, ax = plt.subplots(figsize=(4.6, 3.3))
ax.loglog(dts, eBE, "o-", color=C[0], label="backward Euler")
ax.loglog(dts, eCN, "s-", color=C[1], label="Crank–Nicolson + Rannacher start")
ax.loglog(dts, eBE[0] * dts / dts[0], ":", color=INK2, label="slope 1")
ax.loglog(dts, eCN[0] * (dts / dts[0]) ** 2, "--", color=INK2, lw=1, label="slope 2")
ax.set_xlabel(r"time step $\Delta\tau$"); ax.set_ylabel(r"max $|F-F_{ref}|$ (same mesh)"); ax.legend(fontsize=8)
save(fig, os.path.join(FIG, "Fig1_5_time_convergence.png"))

# ---------------------------------------------------------------- 5. mass balance, positivity, monotonicity
mb = {}
fig, ax = plt.subplots(figsize=(4.6, 3.2))
for i, (lab, th) in enumerate([("BE", 1.0), ("CN", 0.5)]):
    r = fc.SphereFVM(100).solve(tau_out, 1e-4, theta=th, rannacher=4)
    d = np.abs(r["F_inv"] - r["F_flux"])
    mb[lab] = dict(max_abs_inventory_minus_flux=float(d.max()), min_c_every_step=float(r["cmin_all_steps"]), min_release_increment_every_step=float(r["min_release_increment"]),
                   min_dF=float(np.min(np.diff(r["F_inv"]))))
    ax.semilogy(tau_out, d + 1e-18, MARKERS[i], ms=3, color=C[i], label=lab)
ax.set_xlabel(r"$\tau$"); ax.set_ylabel(r"$|F_{inventory}-F_{outlet\ flux}|$"); ax.legend()
save(fig, os.path.join(FIG, "Fig1_6_mass_balance.png"))
allmin = min(float(runs[N]["cmin_all_steps"]) for N in runs)
alldF = min(float(np.min(np.diff(runs[N]["F_inv"]))) for N in runs)
out["mass_balance_positivity"] = mb
out["positivity_all_main_runs_min_c"] = allmin
out["monotonic_all_main_runs_min_dF"] = alldF

# ---------------------------------------------------------------- 6. profiles and map
m = fc.SphereFVM(200)
tau_p = np.array([0.005, 0.02, 0.05, 0.1, 0.2, 0.4])
r = m.solve(tau_p, 1e-5, theta=0.5, rannacher=4, store_profiles=set(range(len(tau_p))))
fig, ax = plt.subplots(figsize=(5.2, 3.4))
xx = np.linspace(0, 1, 300)
prof_err = []
for i, t in enumerate(tau_p):
    ax.plot(xx, fc.profile_analytical(xx, t), "-", color=C[i], lw=1.4, label=fr"$\tau$={t:g}")
    ax.plot(m.xc[::12], r["profiles"][i][::12], MARKERS[i], mfc="none", color=C[i], ms=4)
    prof_err.append(float(np.max(np.abs(r["profiles"][i] - fc.profile_analytical(m.xc, t)))))
ax.set_xlabel(r"$r/R$"); ax.set_ylabel(r"$C/C_0$")
ax.legend(fontsize=7.5, ncol=2, title="lines: analytical, markers: FVM", title_fontsize=7.5)
save(fig, os.path.join(FIG, "Fig1_7_profiles.png"))
out["profile_max_abs_err_N200"] = dict(zip([str(t) for t in tau_p], prof_err))

tau_map = np.linspace(0.0025, 0.5, 200)
r = m.solve(tau_map, 1e-4, theta=0.5, rannacher=4, store_profiles=set(range(len(tau_map))))
Z = np.array([r["profiles"][i] for i in range(len(tau_map))]).T
fig, ax = plt.subplots(figsize=(5.4, 3.5))
pc = ax.pcolormesh(tau_map, m.xc, Z, cmap="Blues", shading="auto", vmin=0, vmax=1)
cs = ax.contour(tau_map, m.xc, Z, levels=[0.1, 0.3, 0.5, 0.7, 0.9], colors=INK2, linewidths=0.7)
ax.clabel(cs, fmt="%.1f", fontsize=7)
ax.grid(False)
fig.colorbar(pc, ax=ax, label=r"$C/C_0$")
ax.set_xlabel(r"$\tau = Dt/R^2$"); ax.set_ylabel(r"$r/R$")
save(fig, os.path.join(FIG, "Fig1_8_concentration_map.png"))

# characteristic times from the verified analytical solution
from scipy.optimize import brentq
out["tau_at_F"] = {str(f): brentq(lambda t: fc.release_series(t)[0] - f, 1e-8, 5) for f in [0.1, 0.5, 0.9]}

with open(os.path.join(RES, "stage1_results.json"), "w") as f:
    json.dump(out, f, indent=2)
print(json.dumps(out, indent=1))
