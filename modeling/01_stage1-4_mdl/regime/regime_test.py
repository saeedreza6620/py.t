# Objective test: shape class from model (measured inputs only) vs shape class of the measured curve, same classifier
import numpy as np, json
from regime_map import simulate, classify, SHAPES
H, DAY = 3600.0, 86400.0
def gpts(ts, vs): return lambda s: float(np.interp(s, np.array(ts), np.array(vs)))
koff1 = 2.68e-5; EE = {1: 38.9, 2: 22.5, 3: 15.2}
sc = lambda e: np.log(100 / e) / np.log(100 / EE[1])
K = {
 "Kodra MS/K-1": (gpts(np.array([0, 1, 3, 6, 24]) * H, [1, .97, .95, .932, 0]), 1 / koff1, 0.0, 24 * H,
                  [0.5, 1, 3, 5, 24], [12.9, 17.4, 34.0, 35.6, 62.3]),
 "Kodra MS/K-2": (gpts(np.array([0, 1, 3, 6, 24]) * H, [1, .96, .94, .899, 0]), 1 / (koff1 * sc(22.5)), 0.0, 24 * H,
                  [0.5, 1, 3, 5, 24], [10.6, 22.3, 41.9, 84.8, 100.0]),
 "Kodra MS/K-3": (gpts(np.array([0, 1, 3, 6, 24]) * H, [1, .92, .43, 0, 0]), 1 / (koff1 * sc(15.2)), 0.0, 24 * H,
                  [0.5, 1, 3, 5, 24], [9.0, 37.1, 99.6, 99.8, 100.0]),
 "Chang 1.0dM-G": (lambda s: float(np.clip(1 - (3.1905 * s / DAY + 13.844 if s >= DAY else 17.03 * s / DAY) / 100, 0, 1)), np.inf, 0.83, 32 * DAY,
                  list(np.array([1, 2, 4, 8, 24, 48, 96, 192, 384, 768]) / 1.0), list(np.array([2.46, 3.82, 3.94, 3.96, 3.99, 3.97, 3.96, 3.95, 4.03, 4.79]) / 4.79 * 100)),
 "Chang 2.5dM-G": (lambda s: float(np.clip(1 - (2.9257 * s / DAY + 3.8528 if s >= DAY else 6.78 * s / DAY) / 100, 0, 1)), np.inf, 0.54, 32 * DAY,
                  list(np.array([1, 2, 4, 8, 24, 48, 96, 192, 384, 768]) / 1.0), list(np.array([2.65, 4.01, 4.11, 4.13, 4.16, 4.16, 4.16, 4.16, 4.53, 7.72]) / 7.72 * 100)),
}
out = []
for name, (g, tb, ff, T, td, yd) in K.items():
    t = np.linspace(T / 2000, T, 1500)
    f = simulate(t, ff, tb, 1.0, tau_D=5.0, g=g)        # tau_D ~ seconds (R^2/(pi^2 D)); tau_g unused when g is given
    cm, fm = classify(t, f, T)
    tdd = np.concatenate([[0], np.array(td) * H]); ydd = np.concatenate([[0], np.array(yd) / 100])
    co, fo = classify(tdd, ydd, T)
    out.append(dict(name=name, model=SHAPES[cm], data=SHAPES[co], match=cm == co,
                    model_feat={k: round(v, 2) for k, v in fm.items()}, data_feat={k: round(v, 2) for k, v in fo.items()}))
print(json.dumps(out, indent=1, ensure_ascii=False))
