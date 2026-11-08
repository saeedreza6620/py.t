"""Stage 4 — constant-D model vs hydration-dependent model, same data and same split.
A. Real data: only C3 (Kodra 2026) has swelling of the SAME formulations in the SAME medium.
   Because C_w cannot be computed (no wet volume), the hydration model is driven by a
   gravimetric hydration INDEX theta_Q(t)=SD(t)/SD_max (explicitly NOT C_w/C_w,eq):
       D(t) = D_eq exp[-beta (1 - theta_Q(t))]  ->  F(t) = F_Fick( int_0^t k_eq e^{-beta(1-theta_Q)} ds )
   This is a CANDIDATE model only.
B. Theoretical identifiability (synthetic data, clearly labelled): coupled water/drug Fujita model.
C. Geometry vs diffusivity: release depends on int D/R^2 dt only (affine swelling).
D. t50 where allowed.  E. Internal concentration-time curves at fixed r/R.
"""
import json, os, math
import numpy as np, pandas as pd
from scipy.optimize import least_squares, brentq
from scipy.stats import t as tdist
import fick_core as fc
import fujita_model as fm
from cases import CASES
from plotstyle import plt, save, C, MARKERS, INK2

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, "results"); FIG = os.path.join(ROOT, "figures")
D = pd.read_csv(os.path.join(ROOT, "data", "release_dataset_audited.csv")); D = D[D.include_in_fit == True]
SW = pd.read_csv(os.path.join(ROOT, "data", "swelling_dataset_C3.csv"))
split = json.load(open(os.path.join(RES, "split.json")))
S2 = pd.read_csv(os.path.join(RES, "stage2_summary.csv"))
out = {}


def jac_stats(fun, nat, t, y, names):
    res = y - fun(nat, t); n, p = len(t), len(nat); dof = n - p
    J = np.zeros((n, p))
    for j in range(p):
        h = 1e-6 * max(abs(nat[j]), 1e-9); a, b = nat.copy(), nat.copy(); a[j] += h; b[j] -= h
        J[:, j] = (fun(a, t) - fun(b, t)) / (2 * h)
    d = dict(params=dict(zip(names, nat.tolist())), ssr=float(np.sum(res ** 2)), n=n, p=p, dof=dof,
             RMSE=float(np.sqrt(np.mean(res ** 2)) * 100))
    if dof > 0:
        cov = d["ssr"] / dof * np.linalg.pinv(J.T @ J); se = np.sqrt(np.clip(np.diag(cov), 0, None))
        d["se"] = dict(zip(names, se.tolist())); q = tdist.ppf(0.975, dof)
        d["ci95"] = {nm: [nat[i] - q * se[i], nat[i] + q * se[i]] for i, nm in enumerate(names)}
        d["corr"] = (cov / np.outer(np.where(se > 0, se, np.nan), np.where(se > 0, se, np.nan))).tolist()
    d["aicc"] = n * math.log(d["ssr"] / n) + 2 * p + (2 * p * (p + 1) / (n - p - 1) if n - p - 1 > 0 else float("inf"))
    return d, res


# =============================================================== A. Kodra: constant D vs index model
def theta_fun_factory(ts, sd, variant):
    th = np.asarray(sd, float) / np.max(sd)
    if "monotone" in variant: th = np.maximum.accumulate(th)
    ts = np.asarray(ts, float)
    if "step" in variant:          # instant hydration to the first measured value
        def f(t):
            t = np.asarray(t, float)
            return np.where(t <= 0, 0.0, np.interp(np.maximum(t, ts[1]), ts, th))
    else:                          # linear between the measured points (0 -> 1 h assumed linear)
        def f(t): return np.interp(t, ts, th)
    return f


def W_model(nat, t, thf):
    k, beta = nat
    t = np.asarray(t, float)
    grid = np.unique(np.concatenate([np.linspace(0, t.max(), 4000), t]))
    rate = k * np.exp(-beta * (1 - thf(grid)))
    tau = np.concatenate([[0], np.cumsum(0.5 * (rate[1:] + rate[:-1]) * np.diff(grid))])
    return fc.release_analytical(np.interp(t, grid, tau))


def C_model(nat, t): return fc.F_const(t, nat[0])


variants = ["linear", "step", "linear_monotone", "step_monotone"]
A_rows = []
fits_store = {}
for form in ["MS/K-1", "MS/K-2", "MS/K-3"]:
    g = D[(D.case_id == "C3_Kodra2026_ketoprofen") & (D.formulation == form)].sort_values("time_h")
    t = g.time_h.values; y = g.y_value.values / 100
    ntr = split[f"C3_Kodra2026_ketoprofen|{form}"]["n_train"]
    s = SW[SW.formulation == form]; s = s[s.time_h.apply(lambda v: abs(v - round(v)) < 1e-6)].groupby("time_h").SD_percent.first()
    s = s.sort_index()
    # constant D (same as stage 2 base)
    for scope, (tt, yy) in {"full": (t, y), "train": (t[:ntr], y[:ntr])}.items():
        r = least_squares(lambda v: C_model(np.exp(v), tt) - yy, [math.log(0.01)])
        nat = np.exp(r.x); st, _ = jac_stats(C_model, nat, tt, yy, ["k_per_h"])
        pred = C_model(nat, t)
        row = dict(formulation=form, model="C: constant D", variant="-", scope=scope, **st["params"],
                   RMSE_fit=st["RMSE"], aicc=st["aicc"], se=st.get("se"), ci95=st.get("ci95"))
        if scope == "train": row["test_RMSE"] = float(np.sqrt(np.mean((y[ntr:] - pred[ntr:]) ** 2)) * 100)
        A_rows.append(row); fits_store[(form, "C", "-", scope)] = nat
    for var in variants:
        thf = theta_fun_factory(s.index.values, s.values, var)
        for scope, (tt, yy) in {"full": (t, y), "train": (t[:ntr], y[:ntr])}.items():
            best = None
            for b0 in [0.5, 2, 5, 10]:
                for lk in [-6, -4, -2, 0]:
                    r = least_squares(lambda v: W_model([math.exp(v[0]), v[1]], tt, thf) - yy, [lk, b0],
                                      bounds=([-15, 0], [5, 40]))
                    if best is None or r.cost < best.cost: best = r
            nat = np.array([math.exp(best.x[0]), best.x[1]])
            st, _ = jac_stats(lambda v, x: W_model(v, x, thf), nat, tt, yy, ["k_eq_per_h", "beta"])
            pred = W_model(nat, t, thf)
            row = dict(formulation=form, model="W-Q: index-driven Fujita form", variant=var, scope=scope, **st["params"],
                       RMSE_fit=st["RMSE"], aicc=st["aicc"], se=st.get("se"), ci95=st.get("ci95"),
                       corr_k_beta=(st["corr"][0][1] if st.get("corr") else None),
                       beta_at_bound=bool(best.x[1] < 1e-3 or best.x[1] > 39.9))
            if scope == "train": row["test_RMSE"] = float(np.sqrt(np.mean((y[ntr:] - pred[ntr:]) ** 2)) * 100)
            A_rows.append(row); fits_store[(form, "W", var, scope)] = (nat, thf)
A = pd.DataFrame(A_rows); A.to_pickle(os.path.join(RES, "stage4_kodra_comparison.pkl")); A.to_json(os.path.join(RES, "stage4_kodra_comparison.json"), orient="records", indent=1, double_precision=15)
pd.set_option("display.width", 250)
print(A[["formulation", "model", "variant", "scope", "k_per_h", "k_eq_per_h", "beta", "RMSE_fit", "test_RMSE", "aicc", "corr_k_beta", "beta_at_bound"]].to_string())

# Fig 4.1  release + residuals, C vs W-Q(linear), train/test identical to stage 2
fig, axs = plt.subplots(2, 3, figsize=(9.6, 5.4), gridspec_kw=dict(height_ratios=[2.2, 1]), sharex=True)
for i, form in enumerate(["MS/K-1", "MS/K-2", "MS/K-3"]):
    g = D[(D.case_id == "C3_Kodra2026_ketoprofen") & (D.formulation == form)].sort_values("time_h")
    t = g.time_h.values; y = g.y_value.values; ntr = split[f"C3_Kodra2026_ketoprofen|{form}"]["n_train"]
    tt = np.linspace(0, 25, 500); ax = axs[0, i]; axr = axs[1, i]
    kC = fits_store[(form, "C", "-", "full")]; ax.plot(tt, C_model(kC, tt) * 100, "-", color=C[0], label="C full fit")
    kCt = fits_store[(form, "C", "-", "train")]; ax.plot(tt, C_model(kCt, tt) * 100, "--", color=C[0], lw=1, label="C train-only")
    natW, thf = fits_store[(form, "W", "linear", "full")]; ax.plot(tt, W_model(natW, tt, thf) * 100, "-", color=C[1], label="W-Q full fit")
    natWt, thft = fits_store[(form, "W", "linear", "train")]; ax.plot(tt, W_model(natWt, tt, thft) * 100, "--", color=C[1], lw=1, label="W-Q train-only")
    ax.plot(t[:ntr], y[:ntr], "o", color=INK2, ms=5, label="data (train)"); ax.plot(t[ntr:], y[ntr:], "o", color=INK2, mfc="white", ms=5, label="data (test)")
    ax.axvline(t[ntr - 1], color=INK2, ls=":", lw=0.8); ax.set_title(form, fontsize=9)
    axr.plot(t, y - C_model(kC, t) * 100, "s-", color=C[0], ms=4, lw=0.8)
    axr.plot(t, y - W_model(natW, t, thf) * 100, "^-", color=C[1], ms=4, lw=0.8); axr.axhline(0, color=INK2, lw=0.7)
    axr.set_xlabel("time (h)")
axs[0, 0].set_ylabel("released (% of encapsulated)"); axs[1, 0].set_ylabel("residual (%-points)")
axs[0, 0].legend(fontsize=6.5, loc="lower right")
save(fig, os.path.join(FIG, "Fig4_1_kodra_C_vs_WQ.png"))

# Fig 4.2  hydration index used by W-Q
fig, ax = plt.subplots(figsize=(5.4, 3.2))
tt = np.linspace(0, 24, 600)
for i, form in enumerate(["MS/K-1", "MS/K-2", "MS/K-3"]):
    s = SW[SW.formulation == form]; s = s[s.time_h.apply(lambda v: abs(v - round(v)) < 1e-6)].groupby("time_h").SD_percent.first().sort_index()
    ax.plot(s.index, s.values / s.values.max(), MARKERS[i], color=C[i], label=f"{form} measured SD/SD_max")
    ax.plot(tt, theta_fun_factory(s.index.values, s.values, "linear")(tt), "-", color=C[i], lw=1)
    ax.plot(tt, theta_fun_factory(s.index.values, s.values, "linear_monotone")(tt), ":", color=C[i], lw=1)
for tr in [0.5, 1, 3, 5, 24]: ax.axvline(tr, color="#cccccc", lw=0.6)
ax.set_xlabel("time (h)"); ax.set_ylabel(r"gravimetric index $\theta_Q$ (not $C_w/C_{w,eq}$)")
ax.legend(fontsize=7); save(fig, os.path.join(FIG, "Fig4_2_hydration_index.png"))

# =============================================================== B. theoretical identifiability (synthetic)
# workbook analog values (caffeine, 5% gel, 0.10% caf): beta_w=6.8, beta_d=8.5, Dw/Dd=4.4/3.8
bw, bd, ratio, th0 = 6.8, 8.5, 4.4 / 3.8, 0.10
# verification of the coupled solver
tv = np.array([0.01, 0.03, 0.1, 0.3])
v0 = fm.solve_coupled(tv, 0.0, N=60, dtau=2e-4)
out["coupled_solver_check"] = dict(beta0_max_err_vs_analytical=float(np.max(np.abs(v0["F"] - fc.release_series(tv)))),
                                   mass_balance_max=float(np.max(np.abs(v0["F"] - v0["F_flux"]))))
# sampling designs: diclofenac (13 pts, last F~0.9) and Kodra (5 pts)
designs = {"diclofenac-like (12 points)": np.array([1, 2, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30.]) / 30,
           "Kodra-like (5 points)": np.array([0.5, 1, 3, 5, 24.]) / 24}
tau_end = 1.2
syn = {}
rng = np.random.default_rng(7)
for nm, rel in designs.items():
    taus = rel * tau_end
    W = fm.solve_coupled(taus, bd, bw, ratio, theta0=th0, N=60, dtau=2e-4)
    yW = W["F"]
    for sig in [0.0, 0.01, 0.02]:
        yy = yW + (rng.normal(0, sig, len(yW)) if sig > 0 else 0)
        r = least_squares(lambda v: fc.release_analytical(math.exp(v[0]) * taus) - yy, [0.0])
        kc = math.exp(r.x[0]); rm = float(np.sqrt(np.mean((fc.release_analytical(kc * taus) - yW) ** 2)) * 100)
        rb = least_squares(lambda v: (1 / (1 + math.exp(-v[1]))) + (1 - 1 / (1 + math.exp(-v[1]))) * fc.release_analytical(math.exp(v[0]) * taus) - yy, [0.0, -2])
        syn[(nm, sig)] = dict(k_app_over_kdeq=kc, RMSE_constD_vs_truth=rm,
                              RMSE_constD_fit=float(np.sqrt(np.mean((fc.release_analytical(kc * taus) - yy) ** 2)) * 100),
                              burst_b=float(1 / (1 + math.exp(-rb.x[1]))))
    syn[(nm, "curve")] = (taus, yW, W["theta_mean"])
out["synthetic"] = {f"{k[0]} | noise={k[1]}": v for k, v in syn.items() if k[1] != "curve"}

# identifiability of (kscale, beta_d) for the Fujita model with known water parameters, 12-point design + 1% noise
taus = designs["diclofenac-like (12 points)"] * tau_end
Wt = fm.solve_coupled(taus, bd, bw, ratio, theta0=th0, N=40, dtau=4e-4)["F"]
yy = Wt + rng.normal(0, 0.01, len(Wt))
def fW(v, x): return fm.solve_coupled(x * v[0], v[1], bw, ratio, theta0=th0, N=40, dtau=4e-4)["F"]
grid_s = np.linspace(0.6, 1.6, 11); grid_b = np.linspace(4, 13, 10)
SSR = np.array([[np.sum((fW([sc, bb], taus) - yy) ** 2) for sc in grid_s] for bb in grid_b])
out["identifiability_grid"] = dict(scale=grid_s.tolist(), beta=grid_b.tolist(), SSR=SSR.tolist(), noise_ssr=len(taus) * 0.01 ** 2)

fig, ax = plt.subplots(1, 2, figsize=(9.0, 3.4))
for i, nm in enumerate(designs):
    taus_, yW, thm = syn[(nm, "curve")]
    tt = np.linspace(0, tau_end, 300)
    kc = syn[(nm, 0.01)]["k_app_over_kdeq"]
    ax[0].plot(taus_, yW * 100, MARKERS[i], color=C[i], ms=5, label=f"synthetic Fujita ({nm})")
    ax[0].plot(tt, fc.release_analytical(kc * tt) * 100, "-", color=C[i], lw=1.2, label="best constant-D fit")
ax[0].set_xlabel(r"$\tau = D_{d,eq}t/R^2$"); ax[0].set_ylabel("F (%)"); ax[0].legend(fontsize=6.5)
cs = ax[1].contourf(grid_s, grid_b, np.log10(SSR / out["identifiability_grid"]["noise_ssr"]), levels=14, cmap="Blues_r")
ax[1].contour(grid_s, grid_b, SSR / out["identifiability_grid"]["noise_ssr"], levels=[2.0], colors=C[1], linewidths=1.5)
ax[1].plot(1.0, bd, "*", color=C[1], ms=10); ax[1].grid(False)
fig.colorbar(cs, ax=ax[1], label=r"log$_{10}$(SSR / noise SSR)")
ax[1].set_xlabel("time-scale factor (D_eq relative to truth)"); ax[1].set_ylabel(r"$\beta_d$")
save(fig, os.path.join(FIG, "Fig4_3_synthetic_identifiability.png"))

# =============================================================== C. geometry vs diffusivity
t = np.linspace(0, 1.0, 2000)          # dimensionless time t D0/R0^2
s_, ts = 1.5, 0.02
Rr = 1 + (s_ - 1) * (1 - np.exp(-t / ts))                     # R(t)/R0 (growth)
tau_geo = np.concatenate([[0], np.cumsum(0.5 * (1 / Rr[1:] ** 2 + 1 / Rr[:-1] ** 2) * np.diff(t))])
F_geo = fc.release_analytical(tau_geo)          # scenario G: R grows, D constant
F_dif = fc.release_analytical(tau_geo)          # scenario Dv: R fixed, D(t) = D0 (R0/R)^2 -> same tau
c0 = np.array([fc.profile_analytical(np.array([0.0]), max(tv_, 1e-4), 600)[0] for tv_ in tau_geo])
fig, ax = plt.subplots(1, 2, figsize=(8.6, 3.2))
ax[0].plot(t, F_geo * 100, "-", color=C[0], lw=2.4, label="G: R grows to 1.5 R0 (fast), D constant")
ax[0].plot(t, F_dif * 100, "--", color=C[1], lw=1.4, label=r"Dv: R fixed, $D=D_0(R_0/R)^2$")
ax[0].plot(t, fc.release_analytical(t) * 100, ":", color=INK2, label="no swelling, D constant")
ax[0].set_xlabel(r"$tD_0/R_0^2$"); ax[0].set_ylabel("F (%)"); ax[0].legend(fontsize=7); ax[0].set_xlim(0, 0.6)
ax[1].plot(t, c0 * (1 / Rr) ** 3, "-", color=C[0], label="G: C(0,t)/C0 (dilution by swelling)")
ax[1].plot(t, c0, "--", color=C[1], label="Dv: C(0,t)/C0")
ax[1].set_xlabel(r"$tD_0/R_0^2$"); ax[1].set_ylabel(r"centre concentration $C/C_0$"); ax[1].set_xlim(0, 0.6); ax[1].legend(fontsize=7)
save(fig, os.path.join(FIG, "Fig4_4_geometry_vs_diffusivity.png"))
out["geometry_check_max_diff_F"] = float(np.max(np.abs(F_geo - F_dif)))

# =============================================================== D. t50
t50 = []
for _, r in S2.iterrows():
    meta = CASES[r.case]
    if not meta["t50_allowed"]:
        t50.append(dict(case=r.case, formulation=r.formulation, t50_h=None, note="normalisation not relative to a documented initial amount")); continue
    g = D[(D.case_id == r.case) & (D.formulation == r.formulation)].sort_values("time_h")
    y = g.y_value.values; t_ = g.time_h.values
    if y.max() < 50:
        t50.append(dict(case=r.case, formulation=r.formulation, t50_h=None, note="50% not reached within data")); continue
    i = int(np.argmax(y >= 50)); br = (float(t_[i - 1]) if i > 0 else 0.0, float(t_[i]))
    b = r.b if r.preferred == "FB" and not pd.isna(r.b) else 0.0
    lo = hi = None
    if b >= 0.5: tm = 0.0
    else:
        f_target = (0.5 - b) / (1 - b)
        tau50 = brentq(lambda x: fc.release_series(x)[0] - f_target, 1e-10, 10)
        tm = tau50 / r.k_per_h
        lo = tau50 / (r.k_per_h + 1.96 * r.k_se) if r.k_se == r.k_se else None
        hi = tau50 / max(r.k_per_h - 1.96 * r.k_se, 1e-12) if r.k_se == r.k_se else None
    t50.append(dict(case=r.case, formulation=r.formulation, model=r.preferred, t50_h=tm, t50_lo_h=lo, t50_hi_h=hi,
                    data_bracket_h=br, note="model-based; data bracket shows observed crossing interval"))
T50 = pd.DataFrame(t50); T50.to_csv(os.path.join(RES, "stage4_t50.csv"), index=False); print(T50.to_string())

# =============================================================== E. internal concentration vs time at fixed r/R
fig, axs = plt.subplots(1, 4, figsize=(11.5, 3.0), sharey=True)
xs = [0.0, 0.5, 0.9]
for j, form in enumerate(["GM1", "GM2", "GM3"]):
    r = S2[(S2.case == "C2_Saravanan2011_diclofenac") & (S2.formulation == form)].iloc[0]
    td = np.linspace(0.01, 30, 300)
    for i, x in enumerate(xs):
        axs[j].plot(td, [fc.profile_analytical(np.array([x]), r.k_per_h * d * 24, 800)[0] for d in td], "-", color=C[i], label=f"r/R={x}")
    axs[j].set_title(f"diclofenac {form} (constant D)", fontsize=8.5); axs[j].set_xlabel("time (day)")
natW, thf = fits_store[("MS/K-3", "W", "linear_monotone", "full")]; kC = fits_store[("MS/K-3", "C", "-", "full")][0]
th_ = np.linspace(0.01, 6, 300)
grid = np.linspace(0, 24, 4000); rate = natW[0] * np.exp(-natW[1] * (1 - thf(grid)))
tauW = np.concatenate([[0], np.cumsum(0.5 * (rate[1:] + rate[:-1]) * np.diff(grid))])
for i, x in enumerate(xs):
    axs[3].plot(th_, [fc.profile_analytical(np.array([x]), kC * h, 800)[0] for h in th_], "-", color=C[i], label=f"C, r/R={x}")
    axs[3].plot(th_, [fc.profile_analytical(np.array([x]), max(np.interp(h, grid, tauW), 1e-6), 800)[0] for h in th_], "--", color=C[i], label=f"W-Q, r/R={x}")
axs[3].set_title("ketoprofen MS/K-3: C vs W-Q (candidate)", fontsize=8.5); axs[3].set_xlabel("time (h)")
axs[0].set_ylabel(r"$C_d/C_{d,0}$ (drug per wet volume, relative)")
axs[0].legend(fontsize=7); axs[3].legend(fontsize=6, ncol=2)
save(fig, os.path.join(FIG, "Fig4_5_internal_concentration.png"))

json.dump(out, open(os.path.join(RES, "stage4_results.json"), "w"), indent=1, default=float)
print(json.dumps(out, indent=1, default=float)[:3000])
