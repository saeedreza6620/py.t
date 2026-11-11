"""
grm.model — unified multi-pool release model for crosslinked gelatin spheres.

Drug in the particle is split into pools. Each pool i has a mass fraction f_i (sum f_i + f_irr = 1) and a
*liberation law* L_i(s): the fraction of that pool that has become mobile by time s (L_i(0)=0, L_i(inf)=1).
Once mobile, drug leaves the particle through an *exit kernel* K(t): the fraction of a uniformly distributed,
mobile amount that has left a time t after it became mobile.

    F(t) = sum_i f_i * int_0^t K(t - s) dL_i(s)                                   (1)

Pools used in this project
    free   (f_free):  L = 1 for s >= 0 (mobile from the start)
    weak   (f_weak):  L = 1 - exp(-k_weak s)          reversible / ionic desorption, first order
    bound  (f_bound): L from network degradation:
                         first-order enzymatic loss  L = 1 - exp(-mu s)                (Cheng 2010, Eq. 2.9)
                         measured mass loss g(s)     L = (1 - g(s)) / (1 - g(inf))
    irr    (f_irr):   never released in the experiment window (plateau < 100 %)

Exit kernels
    "fick":   K(t) = Phi(D t / R^2), Crank series for a sphere with uniform load and perfect sink.
              Eq. (1) is then the exact solution of
              dC/dt = (1/r^2) d/dr(D r^2 dC/dr) + C0 * sum_i f_i dL_i/dt,  C(R,t) = 0     (2)
              because Eq. (2) is linear and the source is uniform in r (Duhamel superposition).
              Verified against a finite-volume solution of Eq. (2) in validation/v0_verification.py.
    "first_order": K(t) = 1 - exp(-t / tau_exit). Used when the mobile species leaves through a moving
              front rather than by diffusion (large proteins in enzymatically eroded spheres, Mladenovska 2002).

All times in seconds, lengths in cm, D in cm^2/s.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Callable, Optional, Sequence
import numpy as np
from .fick import release_analytical, SphereFVM

# --------------------------------------------------------------------------------------------- liberation laws
@dataclass
class Liberation:
    """Cumulative liberation L(s) in [0, 1]. kind: 'immediate' | 'first_order' | 'tabulated'."""
    kind: str = "immediate"
    rate: float = 0.0                      # 1/s for first_order
    t_tab: Optional[np.ndarray] = None     # s, for tabulated
    L_tab: Optional[np.ndarray] = None     # liberated fraction (0..1), for tabulated

    def __call__(self, s):
        s = np.asarray(s, float)
        if self.kind == "immediate":
            return np.where(s >= 0, 1.0, 0.0)
        if self.kind == "first_order":
            return np.where(s > 0, -np.expm1(-self.rate * np.clip(s, 0, None)), 0.0)
        if self.kind == "tabulated":
            L = np.interp(s, self.t_tab, self.L_tab, left=0.0, right=float(self.L_tab[-1]))
            return np.maximum.accumulate(np.clip(L, 0, 1)) if L.ndim == 1 else np.clip(L, 0, 1)
        raise ValueError(self.kind)

    @staticmethod
    def from_mass_remaining(t_s, g, normalise=True):
        """Bound drug freed in proportion to network mass lost: L = (1 - g)/(1 - g_end)."""
        t_s = np.asarray(t_s, float); g = np.clip(np.asarray(g, float), 0, 1)
        lost = 1 - g
        if normalise and lost[-1] > 0: lost = lost / lost[-1]
        return Liberation("tabulated", t_tab=t_s, L_tab=np.maximum.accumulate(lost))


@dataclass
class Pool:
    f: float
    lib: Liberation = field(default_factory=Liberation)
    name: str = ""


@dataclass
class Particle:
    """One formulation. Either Fick exit (R_cm, D_cm2s) or first-order exit (tau_exit_s)."""
    pools: Sequence[Pool]
    R_cm: float = 0.0
    D_cm2s: float = 0.0
    exit: str = "fick"
    tau_exit_s: float = 0.0
    f_irr: float = 0.0

    def check(self):
        tot = sum(p.f for p in self.pools) + self.f_irr
        if not np.isclose(tot, 1.0, atol=1e-6):
            raise ValueError(f"pool fractions sum to {tot}, expected 1")
        if self.exit == "fick" and (self.R_cm <= 0 or self.D_cm2s <= 0):
            raise ValueError("Fick exit needs R_cm > 0 and D_cm2s > 0")
        return self

    # exit kernel
    def K(self, t):
        t = np.clip(np.asarray(t, float), 0, None)
        if self.exit == "fick":
            return release_analytical(self.D_cm2s * t / self.R_cm ** 2)
        if self.exit == "first_order":
            return -np.expm1(-t / self.tau_exit_s)
        raise ValueError(self.exit)

    @property
    def tau_D(self):
        """characteristic diffusion time R^2/(pi^2 D) [s]."""
        return self.R_cm ** 2 / (np.pi ** 2 * self.D_cm2s) if self.exit == "fick" else self.tau_exit_s


def _pool_release(part: Particle, pool: Pool, t, nq=1600):
    t = np.atleast_1d(np.asarray(t, float)); out = np.zeros_like(t)
    if pool.lib.kind == "immediate":
        return part.K(t)
    for j, tj in enumerate(t):
        if tj <= 0: continue
        # Stieltjes sum of K(t - s) dL(s); nodes clustered at s = 0 and s = t (cosine spacing)
        s = tj * 0.5 * (1 - np.cos(np.linspace(0, np.pi, nq)))
        L = pool.lib(s); dL = np.diff(L)
        sm = 0.5 * (s[1:] + s[:-1])
        out[j] = np.sum(part.K(tj - sm) * dL)
    return out


def release(t, part: Particle, by_pool=False, nq=1600):
    """Cumulative fraction released F(t) (0..1) at times t [s]. Eq. (1)."""
    part.check()
    parts = {p.name or f"pool{i}": p.f * _pool_release(part, p, t, nq) for i, p in enumerate(part.pools)}
    F = sum(parts.values())
    return (F, parts) if by_pool else F


# --------------------------------------------------------------------------------------------- PDE reference (Eq. 2)
def release_pde(t_eval, part: Particle, N=160, refine=2.0, dtau=2e-5):
    """Finite-volume solution of Eq. (2) (Fick exit only), backward Euler in dimensionless time,
    surface-graded shells. Independent check of the superposition formula Eq. (1)."""
    assert part.exit == "fick"
    m = SphereFVM(N, refine); G = m.conductance(1.0); mn, up, lo = m.operator_bands(G)
    from scipy.linalg import solve_banded
    k = part.D_cm2s / part.R_cm ** 2
    t_eval = np.asarray(t_eval, float); taus = k * t_eval; T = taus.max()
    f_init = sum(p.f for p in part.pools if p.lib.kind == "immediate")
    srcp = [p for p in part.pools if p.lib.kind != "immediate"]
    c = np.full(N, f_init); out = []; tau = 0.0; i = 0
    # adaptive step: fine at the start (discontinuous data), coarser later
    ab = None
    while i < len(taus) and taus[i] <= 0: out.append(0.0); i += 1
    while tau < T - 1e-15:
        dt = min(dtau * max(1.0, (tau / (50 * dtau)) ** 0.5), T / 2000 + dtau)
        if i < len(taus) and tau + dt > taus[i]: dt = taus[i] - tau
        t0, t1 = tau / k, (tau + dt) / k
        src = sum(p.f * (p.lib(np.array([t1]))[0] - p.lib(np.array([t0]))[0]) for p in srcp)   # liberated in this step
        ab = np.zeros((3, N)); ab[0, 1:] = dt * up; ab[1] = m.V + dt * mn; ab[2, :-1] = dt * lo
        c = solve_banded((1, 1), ab, m.V * (c + src))
        tau += dt
        while i < len(taus) and abs(tau - taus[i]) < 1e-14:
            remaining = m.mass(c) / m.Vtot                                   # mobile drug still inside
            not_yet = sum(p.f * (1 - p.lib(np.array([tau / k]))[0]) for p in srcp)
            out.append(1 - part.f_irr - remaining - not_yet); i += 1
    return np.array(out)
