"""
grm.fast — closed-form release for the four-stage parameter hierarchy, vectorised (for sensitivity analysis and the simulator).

Primitive parameters (what a formulator can change) and the stage they belong to
  Fick          R_dry [cm], drug MW [Da] (-> D_w by Stokes-Einstein), T [K]
  Swelling      Q (equilibrium volume swelling ratio: R = R_dry Q^(1/3), polymer fraction phi = 1/Q),
                D_coop [cm^2/s] (collective gel diffusivity: hydration time tau_sw = R^2/(pi^2 D_coop), Tanaka & Fillmore 1979)
  Crosslinking  K_b  (fast, linear reversible binding / partition: D_eff = D / (1 + K_b)),
                f_free, f_weak (pool sizes), k_weak [1/s] (slow desorption)
  Degradation   mu [1/s] (first-order liberation of network-bound drug)
  Other         f_irr (never released in the window)

Model (same as grm.model, Eq. 1), all liberation laws written as sums of exponentials so the convolution with the
exit kernel K(u) = 1 - sum_n w_n exp(-lam_n u) is analytic:
  int_0^t c e^{-r s} K(t - s) ds = c [ (1 - e^{-r t})/r  -  sum_n w_n (e^{-lam_n t} - e^{-r t})/(r - lam_n) ]
Hydration gates every pool: a pool with its own first-order step (rate b) becomes hypo-exponential (a then b).
Fick kernel: w_n = 6/(pi^2 n^2), lam_n = n^2 pi^2 D_eff / R^2 (NTERMS terms; truncation error <= 6/(pi^2 NTERMS)).
Approximation: R and D_eff are the swollen-state values during the whole release (exact when tau_sw << release time;
the gating term carries the delay). Verified against grm.release / grm.release_pde in tests/test_fast.py.
"""
import numpy as np
from .correlations import mackie_meares, stokes_einstein, NA

NTERMS = 300
_n = np.arange(1, NTERMS + 1, dtype=float)
_W = 6 / (np.pi ** 2 * _n ** 2)

def D_water_from_MW(MW, T=310.15, rho=1.3):
    """Stokes-Einstein with a solute radius from MW and density rho [g/cm3] (small molecules; order-of-magnitude)."""
    r = (3 * np.asarray(MW, float) / (4 * np.pi * rho * NA)) ** (1 / 3)        # cm
    return stokes_einstein(r, T)

def derived(p):
    """primitive dict -> model quantities (arrays broadcast)."""
    Q = np.asarray(p["Q"], float)
    R = np.asarray(p["R_dry"], float) * Q ** (1 / 3)
    Dw = p["D_w"] if "D_w" in p else D_water_from_MW(p["MW"], p.get("T", 310.15))
    D = Dw * mackie_meares(1 / Q) / (1 + np.asarray(p.get("K_b", 0.0), float))
    tau_sw = R ** 2 / (np.pi ** 2 * np.asarray(p["D_coop"], float)) if p.get("D_coop") is not None else np.zeros_like(R)
    return R, D, tau_sw

def _phi(tau):
    tau = np.asarray(tau, float); out = np.empty_like(tau)
    s = tau < 0.01
    out[s] = np.clip(6 * np.sqrt(np.clip(tau[s], 0, None) / np.pi) - 3 * tau[s], 0, 1)
    tt = tau[~s][..., None]
    out[~s] = 1 - np.sum(_W * np.exp(-_n ** 2 * np.pi ** 2 * tt), -1)
    return out

def _conv(c, r, lam, w, t):
    """sum over kernel terms of c * int_0^t e^{-r s} (1 - sum w e^{-lam (t-s)}) ds; shapes: c, r (...,1), lam (...,1,N), t (...,T)."""
    t = t[..., None]; r3 = r[..., None]
    first = c * (-np.expm1(-r * t[..., 0])) / r
    d = r3 - lam
    small = np.abs(d) < 1e-9 * np.maximum(r3, lam)
    dsafe = np.where(small, 1.0, d)
    E = np.where(small, t * np.exp(-r3 * t), (np.exp(-lam * t) - np.exp(-r3 * t)) / dsafe)
    return first - c * np.sum(w * E, -1)

def release_fast(t, R, D, f_free, f_weak, k_weak, mu, f_irr=0.0, tau_sw=0.0, exit_tau=None, by_pool=False, chunk=64):
    """F(t) for arrays of formulations. t: (T,) seconds; every other argument scalar or shape (M,). Returns (M, T)."""
    t = np.atleast_1d(np.asarray(t, float))
    args = [np.atleast_1d(np.asarray(x, float)) for x in (R, D, f_free, f_weak, k_weak, mu, f_irr, tau_sw)]
    M = max(map(len, args))
    if M > chunk:
        args = [np.broadcast_to(x, (M,)) for x in args]; et = None if exit_tau is None else np.broadcast_to(np.atleast_1d(exit_tau), (M,))
        parts = [release_fast(t, *[x[i:i + chunk] for x in args], exit_tau=None if et is None else et[i:i + chunk], by_pool=by_pool, chunk=chunk) for i in range(0, M, chunk)]
        if not by_pool: return np.vstack(parts)
        return np.vstack([q[0] for q in parts]), {k: np.vstack([q[1][k] for q in parts]) for k in parts[0][1]}
    R, D, f_free, f_weak, k_weak, mu, f_irr, tau_sw = (np.atleast_1d(np.asarray(x, float)) for x in (R, D, f_free, f_weak, k_weak, mu, f_irr, tau_sw))
    M = max(map(len, (R, D, f_free, f_weak, k_weak, mu, f_irr, tau_sw)))
    R, D, f_free, f_weak, k_weak, mu, f_irr, tau_sw = (np.broadcast_to(x, (M,)) for x in (R, D, f_free, f_weak, k_weak, mu, f_irr, tau_sw))
    f_bound = np.clip(1 - f_free - f_weak - f_irr, 0, 1)
    if exit_tau is None:
        lam = (_n ** 2 * np.pi ** 2)[None, :] * (D / R ** 2)[:, None]; w = np.broadcast_to(_W[None, :], lam.shape)
        Kimm = _phi((D / R ** 2)[:, None] * t[None, :])
    else:
        lam = (1 / np.broadcast_to(np.atleast_1d(exit_tau), (M,)))[:, None]; w = np.ones((M, 1))
        Kimm = -np.expm1(-lam * t[None, :])
    lam3, w3, T = lam[:, None, :], w[:, None, :], t[None, :]
    a = np.where(tau_sw > 0, 1 / np.where(tau_sw > 0, tau_sw, 1), np.inf)
    def single(rate):                                      # density rate*e^{-rate s}
        rr = rate[:, None]; return _conv(rr, rr, lam3, w3, T)
    def gated(b):                                          # hydration (a) then first-order step (b): hypo-exponential
        out = np.zeros((M, len(t)))
        g = np.isfinite(a)
        if (~g).any(): out[~g] = single(b[~g]) if (~g).all() else single(b)[~g]
        if g.any():
            aa, bb = a[g], np.where(np.abs(b[g] - a[g]) < 1e-12 * a[g], b[g] * (1 + 1e-6), b[g])
            c = (aa * bb / (bb - aa))[:, None]
            out[g] = _conv(c, aa[:, None], lam3[g], w3[g], T) + _conv(-c, bb[:, None], lam3[g], w3[g], T)
        return out
    free = np.where(np.isfinite(a)[:, None], single(np.where(np.isfinite(a), a, 1.0)), Kimm)
    weak = np.where((f_weak > 0)[:, None], gated(np.maximum(k_weak, 1e-30)), 0.0)
    bound = np.where((mu > 0)[:, None] & (f_bound > 0)[:, None], gated(np.maximum(mu, 1e-30)), 0.0)
    F = f_free[:, None] * free + f_weak[:, None] * weak + f_bound[:, None] * bound
    F = np.clip(F, 0, 1)
    return (F, dict(free=f_free[:, None] * free, weak=f_weak[:, None] * weak, bound=f_bound[:, None] * bound)) if by_pool else F

def release_primitive(t, p, by_pool=False):
    """F(t) from primitive parameters (dict of scalars or arrays)."""
    R, D, tau_sw = derived(p)
    return release_fast(t, R, D, p["f_free"], p.get("f_weak", 0.0), p.get("k_weak", 1.0), p.get("mu", 0.0), p.get("f_irr", 0.0), tau_sw, by_pool=by_pool)
