"""grm.analysis — error metrics, characteristic times, parameter weights (elasticities, degree of rate control)."""
import numpy as np
from scipy.optimize import brentq

def rmse(pred, obs):
    pred, obs = np.asarray(pred, float), np.asarray(obs, float)
    return float(np.sqrt(np.mean((pred - obs) ** 2)))

def r2(pred, obs):
    pred, obs = np.asarray(pred, float), np.asarray(obs, float)
    return float(1 - np.sum((obs - pred) ** 2) / np.sum((obs - obs.mean()) ** 2))

def t_at(F, level, lo, hi):
    """time at which the monotone release function F(t) reaches `level` (fraction)."""
    return brentq(lambda x: float(np.atleast_1d(F(np.array([x])))[0]) - level, lo, hi, xtol=1e-6 * hi)

def elasticities(build, p0: dict, keys, outputs: dict, h=1.1):
    """E[k][o] = d ln(output o) / d ln(parameter k), central difference with factor h.
    build(p) -> F(t) callable; outputs: name -> function(F) -> positive scalar."""
    base = {o: g(build(p0)) for o, g in outputs.items()}; E = {}
    for k in keys:
        up, dn = dict(p0), dict(p0); up[k] = p0[k] * h; dn[k] = p0[k] / h
        Fu, Fd = build(up), build(dn)
        E[k] = {o: float((np.log(g(Fu)) - np.log(g(Fd))) / (2 * np.log(h))) for o, g in outputs.items()}
    return base, E

def rate_control_weights(build, p0: dict, rate_keys: dict, t, h=1.1):
    """Degree of rate control (Campbell 2001) of each mechanism on F(t):
    X_i(t) = |dF/d ln k_i|, w_i = X_i / sum_j X_j.  rate_keys: mechanism name -> parameter key of its rate."""
    X = {}
    for m, k in rate_keys.items():
        up, dn = dict(p0), dict(p0); up[k] = p0[k] * h; dn[k] = p0[k] / h
        X[m] = np.abs(build(up)(t) - build(dn)(t)) / (2 * np.log(h))
    tot = sum(X.values()); tot = np.where(tot < 1e-9, np.nan, tot)
    return {m: v / tot for m, v in X.items()}
