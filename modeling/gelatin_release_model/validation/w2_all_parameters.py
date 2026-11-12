"""W2 — which parameters control release, and how much? All stages: Fick -> swelling -> crosslinking/binding -> degradation -> other.

Three complementary measures
  (1) global variance-based sensitivity (Sobol first-order S1 and total ST, Saltelli/Jansen estimators, scrambled Sobol
      sampling, bootstrap 95 % intervals) over the parameter ranges of three regimes -> "weight" of each parameter
  (2) local elasticities d ln Y / d ln X at the validated reference points (Cheng, Hu)
  (3) time-resolved weight of each MECHANISM (degree of rate control: hydration, diffusion, desorption, degradation)
Model: grm.fast (closed form of Eq. 1 with hydration gating), verified against grm.release / the PDE in tests/test_fast.py.
Ranges are stated in REGIMES below with their basis; they are design ranges, not fitted values."""
from common import *
from grm import D_cheng, mu_cheng
from grm.fast import release_fast, derived, D_water_from_MW
from scipy.stats import qmc
TG = np.geomspace(30, 400 * DAY, 110)
STAGE = {"R_dry": "Fick", "MW": "Fick", "Q": "swelling", "D_coop": "swelling", "K_b": "crosslink / binding", "f_free": "crosslink / binding",
         "w_weak": "crosslink / binding", "t_weak_h": "crosslink / binding", "t_deg_d": "degradation", "f_irr": "other",
         "GA": "crosslink / binding", "enzyme": "degradation"}
SCOL = {"Fick": BLUE, "swelling": PUR, "crosslink / binding": GRN, "degradation": ORG, "other": GREY}
LABEL = {"R_dry": "dry radius R_dry", "MW": "drug size (MW)", "Q": "swelling ratio Q", "D_coop": "gel network diffusivity D_coop (hydration time)",
         "K_b": "fast binding K_b (1+K_b)", "f_free": "free fraction f_free", "w_weak": "share of weakly bound drug", "t_weak_h": "desorption half-life",
         "t_deg_d": "degradation half-life", "f_irr": "non-releasable fraction", "GA": "GA concentration", "enzyme": "enzyme level"}
# (name, lo, hi, log-uniform?)
REGIMES = {
 "A": dict(title="A: GA microspheres 5–50 µm, small drug, buffer (Saravanan, Chang, Hu, Liu type)",
           p=[("R_dry", 2.5e-4, 25e-4, True), ("MW", 200, 1500, True), ("Q", 1.5, 8, False), ("D_coop", 1e-8, 1e-6, True),
              ("K_b", 1, 1e3, True), ("f_free", 0.05, 0.9, False), ("w_weak", 0, 1, False), ("t_weak_h", 0.05, 24, True),
              ("t_deg_d", 2, 60, True), ("f_irr", 0, 0.2, False)]),
 "B": dict(title="B: large swollen spheres with strongly hindered diffusion + enzyme (Cheng type)",
           p=[("R_dry", 15e-4, 40e-4, True), ("MW", 300, 1500, True), ("Q", 3, 10, False), ("D_coop", 1e-8, 1e-6, True),
              ("K_b", 1e3, 1e7, True), ("f_free", 0.3, 0.7, False), ("w_weak", 0, 0.5, False), ("t_weak_h", 0.1, 24, True),
              ("t_deg_d", 0.5, 5, True), ("f_irr", 0, 0.05, False)]),
 "C": dict(title="C: Cheng system, design variables only (GA %, radius, enzyme level, free fraction)",
           p=[("GA", 0.125, 0.875, False), ("R_dry", 25e-4, 75e-4, True), ("enzyme", 0.25, 4, True), ("f_free", 0.3, 0.7, False)]),
}
def model(names, X):
    """X: (M, k) physical values -> F on TG grid (M, T)."""
    v = dict(zip(names, X.T))
    if "GA" in v:     # regime C: Cheng relations; R_dry here is the swollen radius; mu proportional to enzyme level (Cheng, Sec. 2.4)
        return release_fast(TG, v["R_dry"], D_cheng(v["GA"]), v["f_free"], 0.0, 1.0, mu_cheng(v["GA"]) * v["enzyme"], 0.0, 0.0)
    f_irr = v["f_irr"]; f_free = v["f_free"] * (1 - f_irr); f_weak = v["w_weak"] * (1 - f_irr - f_free)
    R, D, tau = derived(dict(R_dry=v["R_dry"], Q=v["Q"], MW=v["MW"], K_b=v["K_b"], D_coop=v["D_coop"]))
    return release_fast(TG, R, D, f_free, f_weak, np.log(2) / (v["t_weak_h"] * H), np.log(2) / (v["t_deg_d"] * DAY), f_irr, tau)
def outputs(F):
    lt = np.log10(TG); o = {}
    for lev, nm in ((0.5, "log10 t50"), (0.9, "log10 t90")):
        idx = (F >= lev).argmax(1); ok = F[:, -1] >= lev; i0 = np.clip(idx - 1, 0, len(TG) - 1)
        f0, f1 = F[np.arange(len(F)), i0], F[np.arange(len(F)), idx]
        frac = np.where(f1 > f0, (lev - f0) / np.where(f1 > f0, f1 - f0, 1), 0)
        o[nm] = np.where(ok, lt[i0] + frac * (lt[idx] - lt[i0]), lt[-1])            # not reached in 400 d -> capped
    for tq, nm in ((H, "F(1 h)"), (DAY, "F(1 d)"), (7 * DAY, "F(7 d)")):
        o[nm] = np.array([np.interp(np.log10(tq), lt, f) for f in F])
    return o
def scale(names, U, spec):
    X = np.empty_like(U)
    for j, (n, lo, hi, lg) in enumerate(spec):
        X[:, j] = 10 ** (np.log10(lo) + U[:, j] * (np.log10(hi) - np.log10(lo))) if lg else lo + U[:, j] * (hi - lo)
    return X
def sobol(spec, N=int(os.environ.get("GRM_SOBOL_N", 1024)), seed=1):
    names = [s[0] for s in spec]; k = len(names)
    U = qmc.Sobol(2 * k, scramble=True, seed=seed).random(N); A, B = U[:, :k], U[:, k:]
    mats = [A, B] + [np.where(np.arange(k) == i, B, A) for i in range(k)]
    Y = outputs(model(names, scale(names, np.vstack(mats), spec)))
    res = {}
    rng = np.random.default_rng(0)
    for o, y in Y.items():
        fA, fB = y[:N], y[N:2 * N]; fAB = [y[(2 + i) * N:(3 + i) * N] for i in range(k)]
        def est(ix):
            V = np.var(np.concatenate([fA[ix], fB[ix]]))
            return np.array([[np.mean(fB[ix] * (fAB[i][ix] - fA[ix])) / V, 0.5 * np.mean((fA[ix] - fAB[i][ix]) ** 2) / V] for i in range(k)])
        base = est(np.arange(N)); bs = np.array([est(rng.integers(0, N, N)) for _ in range(200)])
        lo, hi = np.percentile(bs, 2.5, 0), np.percentile(bs, 97.5, 0)
        res[o] = {n: dict(S1=float(base[i, 0]), ST=float(base[i, 1]), S1_ci=[float(lo[i, 0]), float(hi[i, 0])], ST_ci=[float(lo[i, 1]), float(hi[i, 1])])
                  for i, n in enumerate(names)}
        res[o]["_variance"] = float(np.var(np.concatenate([fA, fB]))); res[o]["_mean"] = float(np.mean(np.concatenate([fA, fB])))
    return res
out = dict(regimes={}, note="Sobol indices: share of output variance explained by each parameter alone (S1) and with all its interactions (ST).")
for key, Rg in REGIMES.items():
    out["regimes"][key] = dict(title=Rg["title"], ranges={s[0]: [s[1], s[2], "log" if s[3] else "lin"] for s in Rg["p"]}, sobol=sobol(Rg["p"]))
    print(key, {o: {n: round(v["ST"], 2) for n, v in d.items() if not n.startswith("_")} for o, d in out["regimes"][key]["sobol"].items()})
# ---------------- (2) local elasticities at the validated reference points, primitive parameters
cal = json.load(open(os.path.join(RES, "v1_cheng2010.json")))["calibration"]
Dw_tb = float(D_water_from_MW(872.9))
Qc = 6.0                                    # Cheng: swelling ratio ~500 % by weight -> Q ~ 6 (assumption: densities ~1)
Kb_c = float(Dw_tb * ((1 - 1 / Qc) / (1 + 1 / Qc)) ** 2 / D_cheng(0.375) - 1)      # binding that reproduces Cheng's fitted D
REF = {
 "cheng_GA0.375": dict(R_dry=50e-4 / Qc ** (1 / 3), MW=872.9, Q=Qc, D_coop=1e-7, K_b=Kb_c, f_free=cal["GA 0.375"]["f_free"], w_weak=0.0, t_weak_h=1.0,
                       t_deg_d=np.log(2) / (mu_cheng(0.375) * DAY), f_irr=0.0),
 "hu_like": dict(R_dry=8.05e-4, MW=477.6, Q=3.0, D_coop=1e-7, K_b=1.0, f_free=1e-3, w_weak=0.828 / (1 - 1e-3), t_weak_h=0.72, t_deg_d=11.0, f_irr=0.0),
}
names = list(REF["cheng_GA0.375"]); out["reference_points"] = {}
for nm, p0 in REF.items():
    X0 = np.array([[p0[n] for n in names]]); h = 1.1; E = {}
    base = {k: float(v[0]) for k, v in outputs(model(names, X0)).items()}
    for j, n in enumerate(names):
        if p0[n] == 0: continue
        up, dn = X0.copy(), X0.copy(); up[0, j] *= h; dn[0, j] /= h
        if n == "w_weak": up[0, j] = min(up[0, j], 1.0)
        ou, od = outputs(model(names, up)), outputs(model(names, dn))
        E[n] = {k: float((ou[k][0] - od[k][0]) / np.log(h ** 2) / np.log(10) * np.log(10) if k.startswith("log10") else
                         (np.log(max(ou[k][0], 1e-12)) - np.log(max(od[k][0], 1e-12))) / (2 * np.log(h))) for k in ou}
        for k in ("log10 t50", "log10 t90"): E[n][k] = float((ou[k][0] - od[k][0]) / (2 * np.log10(h)))      # = d ln t / d ln X
    out["reference_points"][nm] = dict(values={k: float(v) for k, v in p0.items()}, base=base, elasticity=E,
                                       assumed=["Q", "D_coop"] + (["t_deg_d (first-order equivalent of Hu's mass loss)"] if nm == "hu_like" else []))
# ---------------- (3) time-resolved mechanism weights (degree of rate control on the four rates)
def mech_weights(p0, t):
    R, D, tau = (np.atleast_1d(x) for x in derived(dict(R_dry=p0["R_dry"], Q=p0["Q"], MW=p0["MW"], K_b=p0["K_b"], D_coop=p0["D_coop"])))
    f_free = p0["f_free"] * (1 - p0["f_irr"]); f_weak = p0["w_weak"] * (1 - p0["f_irr"] - f_free)
    rates = dict(hydration=1 / tau[0], diffusion=D[0], desorption=np.log(2) / (p0["t_weak_h"] * H), degradation=np.log(2) / (p0["t_deg_d"] * DAY))
    def F(r): return release_fast(t, R, r["diffusion"], f_free, f_weak, r["desorption"], r["degradation"], p0["f_irr"], 1 / r["hydration"])[0]
    X = {}
    for m in rates:
        if m == "desorption" and f_weak <= 0: continue
        u, d = dict(rates), dict(rates); u[m] *= 1.1; d[m] /= 1.1; X[m] = np.abs(F(u) - F(d)) / (2 * np.log(1.1))
    tot = sum(X.values()); tot = np.where(tot < 1e-9, np.nan, tot)
    return {m: v / tot for m, v in X.items()}, F(rates)
tw = {"cheng_GA0.375": np.geomspace(60, 20 * DAY, 160), "hu_like": np.geomspace(1, 30 * DAY, 160)}
out["mechanism_weights"] = {}
MCOL = dict(hydration=PUR, diffusion=BLUE, desorption=GRN, degradation=ORG)
for nm in REF:
    w, Fm = mech_weights(REF[nm], tw[nm])
    out["mechanism_weights"][nm] = {m: {f"{tq:g} h": float(np.interp(tq * H, tw[nm], np.nan_to_num(v))) for tq in (0.01, 0.1, 1, 8, 24, 72, 240)} for m, v in w.items()}
    out["mechanism_weights"][nm]["_F"] = {f"{tq:g} h": float(np.interp(tq * H, tw[nm], Fm)) for tq in (0.01, 0.1, 1, 8, 24, 72, 240)}
    REF[nm]["_w"], REF[nm]["_F"] = w, Fm
save("w2_all_parameters", out)
# ---------------- figures
fig, axs = plt.subplots(1, 3, figsize=(17, 5.2), gridspec_kw=dict(width_ratios=[1, 1, 0.62]))
for ax, key in zip(axs, ("A", "B", "C")):
    S = out["regimes"][key]["sobol"]; nms = [n for n in S["log10 t50"] if not n.startswith("_")]
    order = sorted(nms, key=lambda n: -S["log10 t50"][n]["ST"]); y = np.arange(len(order))[::-1]
    for j, (o, off, hatch) in enumerate((("log10 t50", 0.2, None), ("F(1 d)", -0.2, "///"))):
        st = [S[o][n]["ST"] for n in order]; ci = np.array([S[o][n]["ST_ci"] for n in order])
        ax.barh(y + off, st, 0.38, color=[SCOL[STAGE[n]] for n in order], hatch=hatch, edgecolor="white" if hatch is None else "k", lw=0.3,
                xerr=[np.clip(st - ci[:, 0], 0, None), np.clip(ci[:, 1] - st, 0, None)], error_kw=dict(lw=0.7, capsize=1.5))
    ax.set_yticks(y); ax.set_yticklabels([LABEL[n] for n in order], fontsize=8); ax.set_xlim(0, 1.0); ax.set_xlabel("total Sobol index ST (share of variance)")
    ax.set_title({"A": "A: GA microspheres 5–50 µm,\nsmall drug, buffer", "B": "B: large swollen spheres, strongly\nhindered diffusion, enzyme (Cheng type)", "C": "C: Cheng system,\ndesign variables only"}[key], loc="left", fontsize=9)
from matplotlib.patches import Patch
axs[0].legend(handles=[Patch(color=c, label=s) for s, c in SCOL.items()] + [Patch(facecolor="white", edgecolor="k", label="solid: t50,  hatched: release at 1 day")],
              fontsize=7.5, loc="lower right")
fig.tight_layout(); fig.savefig(os.path.join(FIG, "W2_global_weights.png"), dpi=170); plt.close(fig)
fig, axs = plt.subplots(1, 2, figsize=(13, 4.2))
for ax, nm, unit, ul in zip(axs, REF, (DAY, H), ("day", "h")):
    w = REF[nm]["_w"]; t = tw[nm]; ms = list(w)
    ax.stackplot(t / unit, *[100 * np.nan_to_num(w[m]) for m in ms], colors=[MCOL[m] for m in ms], labels=ms, alpha=.9)
    ax.plot(t / unit, 100 * REF[nm]["_F"], "k", lw=1.6, label="cumulative release (%)"); ax.set_xscale("log"); ax.set_ylim(0, 100)
    ax.set_xlabel(f"time ({ul}, log)"); ax.set_ylabel("weight of mechanism (%)")
    ax.set_title({"cheng_GA0.375": "(a) Cheng, GA 0.375 %: diffusion then degradation", "hu_like": "(b) Hu-type: hydration → desorption → degradation"}[nm], loc="left", fontsize=9.5)
axs[0].legend(fontsize=8, loc="center left")
fig.tight_layout(); fig.savefig(os.path.join(FIG, "W2_mechanism_weights_time.png"), dpi=170); plt.close(fig)
print(json.dumps(out["reference_points"], indent=1)[:3000]); print(json.dumps(out["mechanism_weights"], indent=1)[:2500])
