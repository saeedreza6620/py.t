# Kodra et al. 2026 (Polymers 18:1807): ketoprofen in tannic-acid-crosslinked collagen-hydrolysate (gelatin) microspheres.
# Design of experiment: crosslinking time 4 h / 2 h / 0.5 h  ->  MS/K-1 / MS/K-2 / MS/K-3.
# Every quantity below is MEASURED in the paper for each formulation and enters the model at the same time:
#   Q(t)  swelling degree SD%(t), Fig. 7a            -> D(t) = D_w x Eq.26(Q(t)) capped at D_w      (step 2, route 1)
#   EE%   38.9 / 22.5 / 15.2 % (Sec. 3.8)            -> binding capacity S_max proportional to EE  (route 2)
#   CD%   95.8-90.9 % (Sec. 3.4)                     -> reported, nearly equal                     (route 2)
#   g(t)  degradation resistance DR%(t), Fig. 7b/text -> sites lost, bound drug freed              (route 3)
#   R     dry radius 7.5 um (SEM, D50 ~ 15 um) x Q^(1/3) at the swelling peak
# One unknown: the desorption rate k_off of K from the TA-gelatin network (non-electrostatic binding).
#   It is fitted on MS/K-1 ONLY, on t <= 5 h where measured degradation is < 7 % (desorption window),
#   then used unchanged to PREDICT MS/K-1 at 24 h and the whole of MS/K-2 and MS/K-3.
import numpy as np, json
from scipy.optimize import minimize_scalar
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
from gelatin_routes_model import Model
H = 3600.0
Dw = 7.58e-6                                   # ketoprofen, Wilke–Chang 37 °C
rs_A = 4.86
def eq26(Q): return min(rs_A * Q**-0.75 * np.exp(-1 / max(Q - 1, 1e-3)), 1.0)
F = {  # times in h
 "MS/K-1 (4 h XL)":  dict(sd=([0, 1, 3, 6, 24], [0, 1650, 1850, 1942, 1820]), dr=([0, 1, 3, 6, 24], [100, 97, 95, 93.2, 0]),
                          rel=([0.5, 1, 3, 5, 24], [12.9, 17.4, 34.0, 35.6, 62.3]), EE=38.9, CD=95.8),
 "MS/K-2 (2 h XL)":  dict(sd=([0, 1, 3, 6, 24], [0, 1300, 1700, 1345, 450]),  dr=([0, 1, 3, 6, 24], [100, 96, 94, 89.9, 0]),
                          rel=([0.5, 1, 3, 5, 24], [10.6, 22.3, 41.9, 84.8, 100.0]), EE=22.5, CD=93.0),
 "MS/K-3 (0.5 h XL)": dict(sd=([0, 1, 3, 6, 24], [0, 920, 620, 379, 250]),   dr=([0, 1, 3, 6, 24], [100, 92.0, 43, 0, 0]),
                          rel=([0.5, 1, 3, 5, 24], [9.0, 37.1, 99.6, 99.8, 100.0]), EE=15.2, CD=90.9),
}
tt = np.concatenate([[1.0], np.linspace(0.05, 24, 240) * H]); tt = np.unique(tt)
def build(c, koff):
    ts, sd = np.array(c["sd"][0]) * H, np.array(c["sd"][1]) / 100
    Q = lambda t: 1 + 1.35 * max(np.interp(t, ts, sd), 0.05)
    tg, dr = np.array(c["dr"][0]) * H, np.array(c["dr"][1]) / 100
    g = lambda t: float(np.interp(t, tg, dr))
    R = 7.5e-4 * (1 + 1.35 * max(sd)) ** (1 / 3)
    Dfun = lambda t, gg: Dw * eq26(Q(t))
    S0 = c["EE"] / F["MS/K-1 (4 h XL)"]["EE"]          # capacity relative to MS/K-1 (only used for re-binding, see kon)
    return Model(R, Dw, koff=koff, kon=0.0, Smax0=S0, g=g, N=25, Dfun=Dfun)
def release(c, koff):
    m = build(c, koff); return m.run(tt, S0=1.0)   # after washing, retained drug is bound (EE measured after washing)
def sse(logk, c):
    # calibrate only on points where the measured degradation is still < 7 % (t <= 5 h): pure desorption window
    f = release(c, 10**logk); tr, yr = np.array(c["rel"][0][:4]) * H, np.array(c["rel"][1][:4]) / 100
    return float(((np.interp(tr, tt, f) - yr) ** 2).sum())
cal = F["MS/K-1 (4 h XL)"]
res = minimize_scalar(sse, bounds=(-7, -2), args=(cal,), method="bounded")
koff = 10**res.x; print(f"k_off fitted on MS/K-1 = {koff:.3g} 1/s  (half-life {np.log(2)/koff/3600:.2f} h)")
fig, axs = plt.subplots(1, 3, figsize=(16, 4.8)); out = {}
cols = ["#2F5CF0", "#EB6834", "#6B4FD8"]
EE1 = F["MS/K-1 (4 h XL)"]["EE"] / 100
for i, (name, c) in enumerate(F.items()):
    # route 2 scaling from the MEASURED encapsulation efficiency: drug lost during the same washing step is desorbed drug,
    # retained fraction EE = exp(-k_off * t_wash)  =>  k_off,i / k_off,1 = ln(1/EE_i) / ln(1/EE_1)   (no extra fitting)
    scale = np.log(100 / c["EE"]) / np.log(1 / EE1); c["koff"] = koff * scale
    f = release(c, c["koff"]); f_same = release(c, koff); fdeg = release(c, 1e-12)       # degradation only (no desorption)
    m0 = build(c, 0); f_fick = Model(m0.R, Dw, N=25, Dfun=m0.Dfun).run(tt, C0=1.0)
    tr, yr = np.array(c["rel"][0]), np.array(c["rel"][1])
    ax = axs[i]
    ax.plot(tt / H, 100 * f_fick, color="#9AA3BA", lw=1.5, ls="--", label="step 1–2: Fick, D from Eq. 26 with measured Q(t), all drug free")
    ax.plot(tt / H, 100 * fdeg, color="#1BAF7A", lw=1.8, ls=":", label="+ binding, freed only by measured degradation g(t)")
    if i: ax.plot(tt / H, 100 * f_same, color=cols[i], lw=1.4, ls="-.", alpha=.7, label="same k_off as MS/K-1 (crosslinking ignored in binding)")
    ax.plot(tt / H, 100 * f, color=cols[i], lw=2.4, label="full model: D(Q(t)) + binding k_off scaled by EE + degradation g(t)")
    ax.plot(tr, yr, "ko", ms=5, label="data, Fig. 7c")
    ax.plot(np.array(c["dr"][0]), 100 - np.array(c["dr"][1]), "s", mfc="none", mec="#777", ms=5, label="measured degradation 100 − DR%")
    ax.set_xlim(0, 24.5); ax.set_ylim(0, 105); ax.set_xlabel("time (h)"); ax.set_ylabel("cumulative release (%)")
    tag = "k_off fitted on t ≤ 5 h; 24 h predicted" if i == 0 else "PREDICTION (k_off scaled by measured EE)"
    ax.set_title(f"{name}\n{tag}; EE {c['EE']} %, CD {c['CD']} %", loc="left", fontsize=9.5)
    pred = np.interp(np.array(tr) * H, tt, f) * 100
    out[name] = dict(koff_scale=round(scale, 2), rmse=float(np.sqrt(np.mean((pred - yr) ** 2))), pred=[round(x, 1) for x in pred], data=list(yr))
h, l = axs[0].get_legend_handles_labels(); fig.legend(h, l, loc="lower center", ncol=3, frameon=False, fontsize=8.8)
fig.suptitle("Kodra 2026 — swelling, crosslinking and degradation entered together (all measured per formulation); one desorption constant",
             x=.01, ha="left", fontsize=11)
fig.tight_layout(rect=(0, .1, 1, 1)); fig.savefig("kodra2026_full_model.png", dpi=160)
out["koff_1_per_s"] = koff; print(json.dumps(out, indent=1))
