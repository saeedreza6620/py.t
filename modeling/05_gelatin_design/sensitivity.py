# One-at-a-time sensitivity of t50 and of release at 3 h around Kodra MS/K-2 (all inputs measured), +-50 % per parameter
import numpy as np, json
from design_map import simulate, t_at
H = 3600.0
Dw, rs = 7.58e-6, 4.86
def eq26(Q): return min(rs * Q**-0.75 * np.exp(-1 / (Q - 1)), 1.0)
base = dict(R_um=7.5 * (1 + 1.35 * 17.0)**(1/3), Q=1 + 1.35 * 13.45, tau_b_h=1 / (2.68e-5 * 1.58) / H, tau_g_scale=1.0, f_free=0.05)
def run(p):
    D = Dw * eq26(p["Q"]); tauD = (p["R_um"] * 1e-4)**2 / (np.pi**2 * D)
    g = lambda s: float(np.interp(s / p["tau_g_scale"], np.array([0, 1, 3, 6, 24]) * H, [1, .96, .94, .899, 0]))
    t = np.linspace(10, 24 * H, 2000); f, sh = simulate(t, p["f_free"], p["tau_b_h"] * H, tauD, g)
    return t_at(t, f) / H, float(np.interp(3 * H, t, f)), tauD
t50b, f3b, tauDb = run(base); rows = []
labels = {"R_um": "particle radius R", "Q": "swelling Q (-> D via Eq. 26)", "tau_b_h": "desorption time 1/k_off (crosslinking / binding)",
          "tau_g_scale": "degradation time scale (crosslinking)", "f_free": "free (unbound) fraction"}
for k in base:
    for fac in (0.5, 1.5):
        p = dict(base); p[k] = base[k] * fac if k != "Q" else 1 + (base[k] - 1) * fac
        t50, f3, _ = run(p); rows.append(dict(parameter=labels[k], factor=fac, t50_h=round(t50, 2), dt50_pct=round(100 * (t50 / t50b - 1), 1), release_3h=round(100 * f3, 1)))
print(f"baseline: t50 = {t50b:.2f} h, release at 3 h = {100*f3b:.1f} %, diffusion time R^2/(pi^2 D) = {tauDb:.2f} s")
for r in rows: print(r)
json.dump(dict(baseline=dict(t50_h=t50b, rel3h=f3b, tauD_s=tauDb), rows=rows), open("sensitivity.json", "w"), indent=1)
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
fig, ax = plt.subplots(figsize=(8.5, 3.8)); names = list(labels.values())
for i, k in enumerate(base):
    lo = [r for r in rows if r["parameter"] == labels[k] and r["factor"] == 0.5][0]["dt50_pct"]
    hi = [r for r in rows if r["parameter"] == labels[k] and r["factor"] == 1.5][0]["dt50_pct"]
    ax.barh(i, lo, color="#2F5CF0", height=.55); ax.barh(i, hi, color="#EB6834", height=.55)
    ax.text(min(lo, hi) - 2, i, f"{lo:+.0f} / {hi:+.0f} %", va="center", ha="right", fontsize=8.5)
ax.set_yticks(range(len(names))); ax.set_yticklabels(names, fontsize=9); ax.axvline(0, color="k", lw=.8)
ax.set_xlabel("change in t50 (%)   blue: parameter × 0.5   orange: × 1.5"); ax.set_xlim(-80, 80)
ax.set_title("Which parameter moves t50? (Kodra MS/K-2 baseline)", loc="left", fontsize=10)
fig.tight_layout(); fig.savefig("sensitivity.png", dpi=160)
