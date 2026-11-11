"""W1 — parameter weights.
  a) local elasticities  E = d ln(output) / d ln(parameter)  in the two validated regimes (Cheng, Hu)
  b) regime map: elasticity of t50 vs the dimensionless number  Lambda = mu * tau_D  (liberation rate x diffusion time)
  c) time-resolved weight of diffusion vs liberation (degree of rate control, Campbell 2001)"""
from common import *
from grm import *
out = {}
F = lambda p: (lambda t: release(t, Particle([Pool(p["f_free"], name="free"), Pool(1 - p["f_free"], Liberation("first_order", rate=p["mu"]), "bound")], p["R"], p["D"]), nq=900))
def T(level, hi): return lambda f: t_at(f, level, 1.0, hi)
# ---- a1) Cheng regime (GA 0.375 %), GA itself acts through D(GA) and mu(GA)
cal = json.load(open(os.path.join(RES, "v1_cheng2010.json")))["calibration"]
for ga in (0.125, 0.375, 0.875):
    p0 = dict(R=50e-4, D=float(D_cheng(ga)), f_free=cal[f"GA {ga}"]["f_free"], mu=float(mu_cheng(ga)))
    outs = {"F(1 d)": lambda f: f(np.array([DAY]))[0], "t50": T(0.5, 60 * DAY), "t90": T(0.9, 120 * DAY)}
    base, E = elasticities(F, p0, ["R", "D", "f_free", "mu"], outs)
    G = lambda x: dict(p0, D=float(D_cheng(x)), mu=float(mu_cheng(x)))
    E["GA"] = {o: float((np.log(g(F(G(ga * 1.1)))) - np.log(g(F(G(ga / 1.1))))) / (2 * np.log(1.1))) for o, g in outs.items()}
    out[f"cheng_GA{ga}"] = dict(base={k: (v / DAY if k.startswith("t") else v) for k, v in base.items()}, E=E)
# ---- a2) Hu regime: weak pool at Chang's PBS rate, bound pool via measured mass loss (time-scale factor s_deg)
v2 = json.load(open(os.path.join(RES, "v2_hu2024_from_chang2023.json")))
g = pd.read_csv(os.path.join(DATA, "hu2024_mass_remaining.csv")); tg = g.t_day.values * DAY; gv = g.mass_remaining_pct.values / 100
kw = v2["hu_pred_B_weak_rate_from_chang"]["k_weak_per_h"] / H; Dh = v2["hu_data"]["D_cm2s"]
def F2(p):
    lib = Liberation.from_mass_remaining(tg / p["s_deg"], gv)
    return lambda t: release(t, Particle([Pool(p["f_free"], Liberation("first_order", rate=p["k_weak"]), "weak"), Pool(1 - p["f_free"], lib, "bound")], p["R"], p["D"]), nq=900)
p2 = dict(R=8.05e-4, D=Dh, f_free=0.828, k_weak=kw, s_deg=1.0)
base, E = elasticities(F2, p2, ["R", "D", "f_free", "k_weak", "s_deg"],
                       {"F(1 h)": lambda f: f(np.array([H]))[0], "F(1 d)": lambda f: f(np.array([DAY]))[0], "t95": T(0.95, 60 * DAY)})
out["hu_regime"] = dict(base={k: (v / DAY if k.startswith("t") else v) for k, v in base.items()}, E=E)
# ---- b) regime map
lams = np.geomspace(1e-3, 1e3, 25); R0, mu0 = 50e-4, 0.4 / DAY; regime = []
for lam in lams:
    D = R0 ** 2 * mu0 / (np.pi ** 2 * lam)
    p0 = dict(R=R0, D=D, f_free=0.3, mu=mu0)
    tmax = 200 * max(1 / mu0, R0 ** 2 / D)
    _, E = elasticities(F, p0, ["R", "D", "f_free", "mu"], {"t50": T(0.5, tmax)})
    regime.append(dict(Lambda=float(lam), **{k: E[k]["t50"] for k in E}))
out["regime_map"] = regime
# ---- c) time-resolved weights, Cheng GA 0.375 %
p0 = dict(R=50e-4, D=float(D_cheng(0.375)), f_free=cal["GA 0.375"]["f_free"], mu=float(mu_cheng(0.375)))
tw = np.linspace(0.05, 15, 80) * DAY; w = rate_control_weights(F, p0, {"diffusion": "D", "liberation (degradation)": "mu"}, tw)
out["time_weights_cheng_0p375"] = {f"{d} d": r(np.interp(d * DAY, tw, np.nan_to_num(w["diffusion"])), 3) for d in (0.25, 1, 2, 3, 6, 10)}
save("w1_parameter_weights", out)
# ---- figures
fig, axs = plt.subplots(1, 3, figsize=(16, 4.3))
E1 = out["cheng_GA0.375"]["E"]; keys = ["R", "D", "f_free", "mu", "GA"]; x = np.arange(len(keys))
for j, (o, c) in enumerate(zip(("F(1 d)", "t50", "t90"), (BLUE, NAVY, ORG))): axs[0].bar(x + (j - 1) * .26, [E1[k][o] for k in keys], .26, color=c, label=o)
axs[0].set_xticks(x); axs[0].set_xticklabels(["radius\nR", "diffusivity\nD", "free\nfraction", "degradation\nμ", "GA %\n(via D, μ)"], fontsize=8)
axs[0].axhline(0, color="k", lw=.8); axs[0].legend(fontsize=8); axs[0].set_ylabel("elasticity ∂lnY/∂lnX"); axs[0].set_title("(a) Cheng regime, GA 0.375 %, 100 µm sphere", loc="left", fontsize=9.5)
E2 = out["hu_regime"]["E"]; keys2 = ["R", "D", "f_free", "k_weak", "s_deg"]; x = np.arange(len(keys2))
for j, (o, c) in enumerate(zip(("F(1 h)", "F(1 d)", "t95"), (BLUE, NAVY, ORG))): axs[1].bar(x + (j - 1) * .26, [E2[k][o] for k in keys2], .26, color=c, label=o)
axs[1].set_xticks(x); axs[1].set_xticklabels(["radius\nR", "diffusivity\nD", "first-phase\nfraction", "desorption\nrate", "degradation\nrate"], fontsize=8)
axs[1].axhline(0, color="k", lw=.8); axs[1].legend(fontsize=8); axs[1].set_title("(b) Hu regime, 16 µm sphere, gentamicin", loc="left", fontsize=9.5)
a = axs[2]; L = [x["Lambda"] for x in regime]
for k, c, lab in (("R", NAVY, "radius R"), ("D", BLUE, "diffusivity D"), ("mu", ORG, "degradation rate μ"), ("f_free", GRN, "free fraction")):
    a.semilogx(L, [x[k] for x in regime], "-", color=c, lw=2, label=lab)
a.axvline(1, color=GREY, ls=":"); a.axhline(0, color="k", lw=.6)
a.set_xlabel("Λ = μ · R²/(π² D)   (diffusion time / degradation time)"); a.set_ylabel("elasticity of t50")
a.set_title("(c) which parameter matters: regime map (f_free = 0.3)", loc="left", fontsize=9.5); a.legend(fontsize=8)
a.text(1.3e-3, -0.9, "degradation-limited", fontsize=8, color=GREY); a.text(30, -0.9, "diffusion-limited", fontsize=8, color=GREY)
fig.tight_layout(); fig.savefig(os.path.join(FIG, "W1_parameter_weights.png"), dpi=170); plt.close(fig)
fig, a = plt.subplots(figsize=(6.4, 4))
a.stackplot(tw / DAY, 100 * np.nan_to_num(w["diffusion"]), 100 * np.nan_to_num(w["liberation (degradation)"]), colors=[BLUE, ORG], alpha=.9, labels=["diffusion", "liberation by degradation"])
a.plot(tw / DAY, 100 * F(p0)(tw), color="k", lw=1.6, label="cumulative release (%)"); a.set_ylim(0, 100); a.set_xlabel("time (day)"); a.set_ylabel("weight (%)")
a.legend(fontsize=8, loc="center right"); a.set_title("W1: time-resolved rate control, Cheng GA 0.375 %", loc="left", fontsize=9.5)
fig.tight_layout(); fig.savefig(os.path.join(FIG, "W1_time_weights.png"), dpi=170); plt.close(fig)
print(json.dumps({k: v for k, v in out.items() if k != "regime_map"}, indent=1)[:3500])
print([(round(x["Lambda"], 3), round(x["R"], 2), round(x["D"], 2), round(x["mu"], 2), round(x["f_free"], 2)) for x in regime[::4]])
