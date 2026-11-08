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
KOFF = 2.68e-5
