# Mladenovska 2002 (Int J Pharm 242:247): BSA in GA-crosslinked gelatin microspheres, 6 sizes, collagenase 0.1 mg/ml, 37 C.
# Degradation of blank microspheres (Fig 1) and BSA release (Fig 2) for the same 6 size series. Digitized at 400 dpi.
import numpy as np, json
d = dict(A=7.03, B=5.89, C=4.63, D=3.20, E=2.29, F=1.99)      # mean diameter, um
tr = np.array([0, 1, 3, 5, 7, 10, 13, 24.])
rel = dict(A=[0,5.5,19.5,29.5,33,57.5,71,80.5], B=[0,6.5,21.5,32.5,54,65.5,75.5,85], C=[0,7.5,32.5,48.5,66.5,70,77.5,86],
           D=[0,8.5,43,52.5,70,76,80,88.5], E=[0,9.5,48.5,57.5,74,78.5,83.5,89.5], F=[0,12.5,54,74,80.5,84.5,87,92.5])
td = np.array([0, 1, 3, 5, 7, 13, 24, 48, 72.])
rem = dict(A=[100,45,41,33,31.7,28.8,23,22.3,19], B=[100,40.5,34,28.5,28,23.5,21.5,18,16], C=[100,40.5,34,28.5,27.5,22.5,21,18,16],
           D=[100,37,29,25,23.5,20.5,16.5,15,14.5], E=[100,34,28,25,22.5,19,16,15,12.5], F=[100,33.5,25.5,25,22,18,16,12.5,12])
def t50(t, y):
    y = np.asarray(y, float); i = np.argmax(y >= 50); return float(np.interp(50, y[i-1:i+1], t[i-1:i+1]))
out = {}
# Rule 0 (Fick): BSA D_w(37C) ~ 8e-7 cm2/s; even with D_gel = D_w/100, tau = R^2/(pi^2 D) for R = 3.5 um is ~ 16 s -> 100 % within minutes.
for k in d:
    R = d[k] / 2 * 1e-4; tau = R**2 / (np.pi**2 * 8e-9)
    fick = 100 * (1 - 6 / np.pi**2 * sum(np.exp(-n * n * tr * 3600 / tau) / n**2 for n in range(1, 200)))
    L_tot = np.interp(tr, td, 100 - np.array(rem[k]))                       # rule 1: release = total mass loss
    m1 = rem[k][1]; Lnet = np.where(tr >= 1, 100 * (1 - np.interp(tr, td, rem[k]) / m1), 0)  # rule 2: release = loss of network that survived 1 h
    y = np.array(rel[k], float); r = lambda p: round(float(np.sqrt(np.mean((p[1:] - y[1:])**2))), 1)
    out[k] = dict(diam=d[k], t50_data=round(t50(tr, y), 2), rmse_fick=r(fick), rmse_totalloss=r(L_tot), rmse_netloss=r(Lnet),
                  lag_1h=round(float(L_tot[1] - y[1]), 1), lag_13h=round(float(L_tot[6] - y[6]), 1), lag_24h=round(float(L_tot[7] - y[7]), 1))
for k, v in out.items(): print(k, v)
D = np.array([v["diam"] for v in out.values()]); T = np.array([v["t50_data"] for v in out.values()])
n = np.polyfit(np.log(D), np.log(T), 1)[0]; print("t50 ~ diameter^%.2f  (Fick: 2, surface erosion: 1)" % n)
json.dump(dict(series=out, t50_exponent=round(float(n), 2)), open("mladenovska2002.json", "w"), indent=1)
