"""
fick_core.py — verified building blocks for drug release from a sphere.

Dimensionless problem (x = r/R, tau = D t / R^2, c = C/C0):
    dc/dtau = (1/x^2) d/dx ( x^2 dc/dx ),   0 < x < 1
    c(x,0) = 1,  dc/dx(0,tau) = 0,  c(1,tau) = 0 for tau > 0
Released fraction (relative to initial mass):
    F(tau) = 1 - 3 * int_0^1 c x^2 dx
Analytical (Crank 1975, eq. 6.20):
    F(tau) = 1 - (6/pi^2) sum_{n>=1} exp(-n^2 pi^2 tau)/n^2
"""
from __future__ import annotations
import numpy as np
from scipy.special import erfc
from scipy.linalg import solve_banded

PI2 = np.pi ** 2

# ---------------------------------------------------------------------------
# 1. Analytical release with explicit truncation control
# ---------------------------------------------------------------------------
def _tail_bound(N: int, tau: float) -> float:
    """Rigorous upper bound of (6/pi^2) * sum_{n>N} exp(-n^2 pi^2 tau)/n^2.
    Uses exp(-n^2 a) <= exp(-(N+1)^2 a) * exp(-(n-N-1)(2N+2) a) for n >= N+1."""
    a = PI2 * tau
    m = N + 1
    q = np.exp(-(2 * m) * a)
    return (6 / PI2) * np.exp(-m * m * a) / (m * m) / (1.0 - q)


def release_series(tau, tol: float = 1e-13, nmax: int = 2_000_000, return_terms=False):
    """F(tau) from the eigen-series; the number of terms is chosen per tau so
    that the rigorous tail bound is below `tol`. For tau = 0, F = 0 exactly."""
    tau = np.atleast_1d(np.asarray(tau, dtype=float))
    out = np.zeros_like(tau)
    nterms = np.zeros(tau.shape, dtype=int)
    for i, t in enumerate(tau):
        if t <= 0:
            out[i] = 0.0
            continue
        # smallest N with tail_bound(N) < tol (search by doubling + bisection)
        N = 1
        while _tail_bound(N, t) > tol and N < nmax:
            N *= 2
        lo, hi = max(1, N // 2), N
        while lo < hi:
            mid = (lo + hi) // 2
            if _tail_bound(mid, t) > tol:
                lo = mid + 1
            else:
                hi = mid
        N = lo
        n = np.arange(1, N + 1, dtype=float)
        s = np.sum(np.exp(-n * n * PI2 * t) / (n * n))
        out[i] = 1.0 - (6 / PI2) * s
        nterms[i] = N
    return (out, nterms) if return_terms else out


def release_short_time(tau, nimg: int = 6):
    """Independent short-time (image) form, Crank eq. 6.21:
    F = 6 sqrt(tau) [ 1/sqrt(pi) + 2 sum ierfc(n/sqrt(tau)) ] - 3 tau."""
    tau = np.atleast_1d(np.asarray(tau, dtype=float))
    out = np.zeros_like(tau)
    pos = tau > 0
    t = tau[pos]
    s = np.zeros_like(t)
    for n in range(1, nimg + 1):
        z = n / np.sqrt(t)
        ierfc = np.exp(-z * z) / np.sqrt(np.pi) - z * erfc(z)
        s += ierfc
    out[pos] = 6 * np.sqrt(t) * (1 / np.sqrt(np.pi) + 2 * s) - 3 * t
    return out


def release_analytical(tau, tol: float = 1e-13):
    """Production evaluator: series with tail control for tau >= 0.01,
    short-time image form below (both forms are verified against each other)."""
    tau = np.atleast_1d(np.asarray(tau, dtype=float))
    out = np.empty_like(tau)
    small = tau < 0.01
    out[small] = release_short_time(tau[small])
    if np.any(~small):
        n = np.arange(1, 40, dtype=float)[:, None]
        t = tau[~small][None, :]
        out[~small] = 1 - (6 / PI2) * np.sum(np.exp(-n * n * PI2 * t) / (n * n), axis=0)
    return out


def profile_analytical(x, tau, nterms: int = 4000):
    """c(x,tau) = (2/(pi x)) sum (-1)^{n+1}/n sin(n pi x) exp(-n^2 pi^2 tau); x>0."""
    x = np.asarray(x, dtype=float)
    n = np.arange(1, nterms + 1, dtype=float)[:, None]
    xx = np.where(x == 0, 1e-12, x)[None, :]
    s = np.sum(((-1) ** (n + 1)) / n * np.sin(n * np.pi * xx) * np.exp(-n * n * PI2 * tau), axis=0)
    c = 2 / (np.pi * xx[0]) * s
    # x -> 0 limit: 2 sum (-1)^{n+1} exp(-n^2 pi^2 tau)
    c0 = 2 * np.sum(((-1) ** (n[:, 0] + 1)) * np.exp(-n[:, 0] ** 2 * PI2 * tau))
    return np.where(x == 0, c0, c)


# ---------------------------------------------------------------------------
# 2. Spherical finite-volume solver (cell-centred, true shell volumes/areas)
# ---------------------------------------------------------------------------
class SphereFVM:
    """Cell-centred FVM on 0<=x<=1.
    faces x_{i-1/2}, cell volume V_i = (x_{i+1/2}^3 - x_{i-1/2}^3)/3 (per 4 pi),
    face area A_f = x_f^2 (per 4 pi). Centre face area is 0 and its flux is set
    to 0 explicitly (symmetry). Surface: Dirichlet c = 0 through a half-cell
    distance (perfect sink). D may be a scalar or an array of face values."""

    def __init__(self, N: int, refine: float = 1.0):
        # refine>1 clusters cells toward the surface (x=1): xf = 1-(1-s)^refine
        s = np.linspace(0.0, 1.0, N + 1)
        xf = 1.0 - (1.0 - s) ** refine if refine != 1.0 else s
        self.N = N
        self.xf = xf
        self.xc = 0.5 * (xf[:-1] + xf[1:])
        self.V = (xf[1:] ** 3 - xf[:-1] ** 3) / 3.0
        self.A = xf ** 2                              # A[0] = 0 at centre
        d = np.empty(N + 1)
        d[1:-1] = self.xc[1:] - self.xc[:-1]
        d[0] = np.inf                                  # centre: no flux
        d[-1] = 1.0 - self.xc[-1]                      # half cell to the surface
        self.d = d
        self.Vtot = self.V.sum()                      # = 1/3 exactly

    def conductance(self, Dface=1.0):
        Dface = np.broadcast_to(np.asarray(Dface, dtype=float), (self.N + 1,))
        G = self.A * Dface / self.d
        G[0] = 0.0                                     # symmetry: zero flux at x=0
        return G

    def operator_bands(self, G):
        """Return banded matrix (3,N) for  V dc/dt = -L c  with L SPD-like."""
        N = self.N
        main = G[:-1] + G[1:]                          # west + east (east of last = surface)
        upper = -G[1:-1]
        lower = -G[1:-1]
        return main, upper, lower

    def surface_flux(self, c, G):
        """Outward flux (per 4 pi, dimensionless) through x=1: G_s * (c_N - 0)."""
        return G[-1] * c[-1]

    def mass(self, c):
        return np.dot(self.V, c)

    def solve(self, tau_out, dtau, theta=0.5, rannacher=4, Dfun=None, c0=None,
              store_profiles=None):
        """theta-scheme time stepping. theta=1 backward Euler, 0.5 Crank-Nicolson.
        `rannacher` initial steps are done with backward Euler at dtau/2 (damps the
        CN oscillation caused by the discontinuous initial/boundary data).
        Dfun(tau) -> face diffusivities (dimensionless, D/D_ref); None means 1.
        Returns dict with F_inventory, F_flux (independent outlet integral),
        min concentration, profiles."""
        N = self.N
        c = np.ones(N) if c0 is None else c0.copy()
        tau_out = np.asarray(tau_out, dtype=float)
        T = tau_out.max()
        M0 = self.mass(c)
        F_inv, F_flx, cmin = [], [], []
        prof = {}
        t = 0.0
        released = 0.0
        k = 0
        out_idx = 0
        G_old = self.conductance(1.0 if Dfun is None else Dfun(0.0))
        # record tau=0 if requested
        while out_idx < len(tau_out) and tau_out[out_idx] <= 0:
            F_inv.append(0.0); F_flx.append(0.0); cmin.append(c.min()); out_idx += 1
        nsteps_ran = 0
        cmin_all = c.min(); dmin_all = np.inf
        while t < T - 1e-15:
            if nsteps_ran < rannacher and theta < 1:
                dt, th = dtau / 2, 1.0
            else:
                dt, th = dtau, theta
            # do not overshoot output times: shorten the step to land exactly
            if out_idx < len(tau_out) and t + dt > tau_out[out_idx] - 1e-14:
                dt = tau_out[out_idx] - t
            G_new = self.conductance(1.0 if Dfun is None else Dfun(t + dt))
            mn, up, lo = self.operator_bands(G_new)
            mo, uo, loo = self.operator_bands(G_old)
            # explicit part: (V - (1-th) dt L_old) c
            Lc = mo * c
            Lc[:-1] += uo * c[1:]
            Lc[1:] += loo * c[:-1]
            rhs = self.V * c - (1 - th) * dt * Lc
            ab = np.zeros((3, N))
            ab[0, 1:] = th * dt * up
            ab[1, :] = self.V + th * dt * mn
            ab[2, :-1] = th * dt * lo
            c_new = solve_banded((1, 1), ab, rhs)
            # outlet flux integrated with the SAME theta weighting (discrete conservation)
            J_old = self.surface_flux(c, G_old)
            J_new = self.surface_flux(c_new, G_new)
            inc = dt * (th * J_new + (1 - th) * J_old)
            released += inc
            cmin_all = min(cmin_all, c_new.min()); dmin_all = min(dmin_all, inc)
            c = c_new
            G_old = G_new
            t += dt
            nsteps_ran += 1
            while out_idx < len(tau_out) and abs(t - tau_out[out_idx]) < 1e-12:
                F_inv.append(1.0 - self.mass(c) / M0)
                F_flx.append(released / M0)
                cmin.append(c.min())
                if store_profiles is not None and out_idx in store_profiles:
                    prof[out_idx] = c.copy()
                out_idx += 1
        return dict(tau=tau_out, F_inv=np.array(F_inv), F_flux=np.array(F_flx),
                    cmin=np.array(cmin), profiles=prof, c_final=c,
                    cmin_all_steps=cmin_all, min_release_increment=dmin_all)


# ---------------------------------------------------------------------------
# 3. Dimensional helpers used in the fitting stages
# ---------------------------------------------------------------------------
def F_const(t, k):
    """Released fraction for constant D: F(k t), k = D_app / R_ref^2 [1/time]."""
    return release_analytical(np.clip(k * np.asarray(t, float), 0, None))


def F_burst(t, k, b):
    t = np.asarray(t, float)
    F = b + (1 - b) * F_const(t, k)
    return np.where(t > 0, F, 0.0)
