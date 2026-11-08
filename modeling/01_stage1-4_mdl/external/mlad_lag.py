import numpy as np, json
from scipy.optimize import minimize_scalar
exec(open("mladenovska2002.py").read().split("out = {}")[0])
tt = np.linspace(0, 24, 4801)
def lagged(k, tau):
    L = np.interp(tt, td, 100 - np.array(rem[k])); F = np.zeros_like(tt); dt = tt[1] - tt[0]; a = np.exp(-dt / tau)
    for i in range(1, len(tt)): F[i] = a * F[i-1] + (1 - a) * L[i]
    return np.interp(tr, tt, F)
rm = lambda k, tau: float(np.sqrt(np.mean((lagged(k, tau)[1:] - np.array(rel[k])[1:])**2)))
taus = {k: minimize_scalar(lambda x: rm(k, x), bounds=(0.05, 20), method="bounded").x for k in d}
for k in d: print(k, d[k], "tau=%.2f h  rmse=%.1f" % (taus[k], rm(k, taus[k])))
D = np.array(list(d.values())); T = np.array(list(taus.values()))
p = np.polyfit(np.log(D), np.log(T), 1)[0]; print("tau ~ diam^%.2f" % p)
# predictive use: calibrate tau on the largest (A) only, scale tau ~ diameter^1 (surface-controlled, from the t50 exponent, not fitted)
pred = {}
for k in d:
    tk = taus["A"] * (d[k] / d["A"]); pred[k] = dict(tau=round(tk, 2), rmse=round(rm(k, tk), 1), rmse_totalloss_nolag=round(rm(k, 1e-3), 1))
    print("predict", k, pred[k])
json.dump(dict(tau_fit={k: round(v, 2) for k, v in taus.items()}, tau_exponent=round(float(p), 2), predict_from_A=pred), open("mlad_lag.json", "w"), indent=1)
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
cols = dict(A="#0000FF", B="#008000", C="#FF0000", D="#00BFBF", E="#BF00BF", F="#BFBF00")   # COMSOL default line colours
fig, axs = plt.subplots(1, 3, figsize=(14, 4.3))
for k in d:
    axs[0].plot(tr, rel[k], "o-", color=cols[k], ms=4, lw=1.2, label="%s  d = %.2f µm" % (k, d[k]))
    axs[1].plot(td, 100 - np.array(rem[k]), "s--", color=cols[k], ms=3.5, lw=1)
    tk = taus["A"] * d[k] / d["A"]; F = lagged(k, tk)
    axs[2].plot(tr, rel[k], "o", color=cols[k], ms=4); axs[2].plot(tr, F, "-", color=cols[k], lw=1.4)
axs[0].set_title("Data: BSA release (Fig. 2)", loc="left"); axs[1].set_title("Data: mass loss of blank spheres (Fig. 1)", loc="left")
axs[2].set_title("Prediction: release = mass loss with lag τ = R / v\n(v from size A only; sizes B–F predicted, RMSE 3.6–5.7 %)", loc="left", fontsize=9)
for a in axs: a.set_xlabel("Time (h)"); a.grid(color="#ddd", lw=0.6); a.set_ylim(0, 100)
axs[0].set_ylabel("Cumulative release (%)"); axs[1].set_ylabel("Mass lost (%)"); axs[1].set_xlim(0, 24)
axs[0].legend(fontsize=7.5, frameon=False); fig.tight_layout(); fig.savefig("mladenovska2002_test.png", dpi=180)
print("v front um/h:", {k: round(d[k] / 2 / taus[k], 2) for k in d})
