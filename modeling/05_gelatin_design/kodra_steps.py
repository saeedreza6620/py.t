# Kodra 2026 design of experiment (crosslinking time 4 / 2 / 0.5 h): the model built up step by step, each step scored on the data
import numpy as np, json, sys
sys.path.insert(0, "/home/claude/mdl/regime"); from design_map import simulate, t_at
H = 3600.0; Dw, rs = 7.58e-6, 4.86
def mm(phi): return ((1 - phi) / (1 + phi))**2
def eq26(Q): return min(rs * Q**-0.75 * np.exp(-1 / (Q - 1)), 1.0)
T = [0, 1, 3, 6, 24]
F = {
 "MS/K-1 (4 h)":   dict(sd=[0, 1650, 1850, 1942, 1820], dr=[1, .97, .95, .932, 0], EE=38.9, CD=95.8, td=[0.5, 1, 3, 5, 24], yd=[12.9, 17.4, 34.0, 35.6, 62.3]),
 "MS/K-2 (2 h)":   dict(sd=[0, 1300, 1700, 1345, 450], dr=[1, .96, .94, .899, 0], EE=22.5, CD=93.0, td=[0.5, 1, 3, 5, 24], yd=[10.6, 22.3, 41.9, 84.8, 100.0]),
 "MS/K-3 (0.5 h)": dict(sd=[0, 920, 620, 379, 250],   dr=[1, .92, .43, 0, 0],    EE=15.2, CD=90.9, td=[0.5, 1, 3, 5, 24], yd=[9.0, 37.1, 99.6, 99.8, 100.0]),
}
KOFF1 = 2.68e-5
STEPS = ["1 Fick (D formula, all free)", "2 + swelling (Eq. 26, Q(t))", "3 + crosslinking -> binding (k_off x EE)",
         "4 + degradation (measured DR%)", "5 + non-releasable pool (complete)"]
def model(c, step, t):
    Q = lambda s: 1 + 1.35 * max(np.interp(s, np.array(T) * H, np.array(c["sd"]) / 100), 0.05)
    Qmax = 1 + 1.35 * max(c["sd"]) / 100; R = 7.5e-4 * Qmax**(1 / 3)
    D = Dw * mm(0.1) if step == 1 else Dw * eq26(Qmax)
    tauD = max(R**2 / (np.pi**2 * D), 0.05)
    if step <= 2: return simulate(t, 1.0, np.inf, tauD, lambda s: 1.0)[0]
    koff = KOFF1 * np.log(100 / c["EE"]) / np.log(100 / 38.9)
    g = (lambda s: 1.0) if step == 3 else (lambda s: float(np.interp(s, np.array(T) * H, c["dr"])))
    firr = 0.0 if step < 5 else max(0.0, 1 - c["yd"][-1] / 100)        # end point of the same curve
    return simulate(t, 0.0, 1 / koff, tauD, g, f_irr=firr)[0]
t = np.linspace(10, 24 * H, 2500); rows = []
for name, c in F.items():
    r = dict(name=name)
    for s in range(1, 6):
        f = model(c, s, t); pred = np.interp(np.array(c["td"]) * H, t, f) * 100
        r[f"step{s}_rmse"] = round(float(np.sqrt(np.mean((pred - np.array(c["yd"])) ** 2))), 1)
        r[f"step{s}_t50_h"] = round(t_at(t, f) / H, 2) if np.isfinite(t_at(t, f)) else None
    tdd = np.concatenate([[0], np.array(c["td"]) * H]); ydd = np.concatenate([[0], np.array(c["yd"]) / 100]); r["data_t50_h"] = round(t_at(tdd, ydd) / H, 2)
    rows.append(r)
for r in rows: print(r)
json.dump(rows, open("kodra_steps.json", "w"), indent=1)
