"""Hydration-dependent (Fujita-type) diffusion in a sphere of FIXED radius.

Project notation (relation as summarised in the audit workbook for Abbasi et al. 2008;
the original paper's definition of C_w could not be verified in this session):
    D_i(C_w) = D_i,eq * exp[-beta_i (1 - C_w/C_w,eq)],   i = w (water), d (drug)
Dimensionless form with theta = C_w/C_w,eq, tau = D_d,eq t / R^2, c = C_d/C_d0:
    d theta/d tau = (1/x^2) d/dx [ x^2 (D_w,eq/D_d,eq) e^{-beta_w(1-theta)} d theta/dx ]
    d c/d tau     = (1/x^2) d/dx [ x^2 e^{-beta_d(1-theta)} d c/dx ]
    theta(x,0)=theta0, theta(1,tau)=1 ; c(x,0)=1, c(1,tau)=0 ; zero flux at x=0.
Discretisation: the verified SphereFVM (true shell volumes / face areas); water equation
linearised by lagging D (Picard, 2 sweeps per step), backward Euler for robustness/positivity.
Released fraction: F = 1 - M_d(t)/M_d(0) (relative to the initial drug mass) and,
independently, the time integral of the outlet flux.
"""
import numpy as np
from scipy.linalg import solve_banded
from fick_core import SphereFVM


def _step(m, c, G, dt):
    N = m.N
    main = G[:-1] + G[1:]; off = -G[1:-1]
    ab = np.zeros((3, N)); ab[0, 1:] = dt * off; ab[1] = m.V + dt * main; ab[2, :-1] = dt * off
    rhs = m.V * c.copy()
    return ab, rhs


def solve_coupled(tau_out, beta_d, beta_w=0.0, ratio_w=1.0, theta0=0.0, N=80, dtau=2e-4,
                  theta_fun=None, store_profiles=None, picard=2):
    """If theta_fun(tau) is given, hydration is a prescribed spatially uniform function of time
    (used for the exploratory index model); otherwise the water equation is solved."""
    m = SphereFVM(N)
    tau_out = np.asarray(tau_out, float)
    th = np.full(N, theta0, float); c = np.ones(N)
    M0 = m.mass(c); released = 0.0
    out_F, out_Ff, prof, thetam = [], [], {}, []
    t = 0.0; k = 0
    cmin = 1.0
    for j, T in enumerate(tau_out):
        while t < T - 1e-14:
            dt = min(dtau if t > 50 * dtau else dtau / 10, T - t)
            # ---- water
            if theta_fun is None:
                th_old = th.copy(); th_new = th.copy()
                for _ in range(picard):
                    thf = np.empty(N + 1); thf[1:-1] = 0.5 * (th_new[1:] + th_new[:-1]); thf[0] = th_new[0]; thf[-1] = 1.0
                    G = m.conductance(ratio_w * np.exp(-beta_w * (1 - thf)))
                    ab, rhs = _step(m, th_old, G, dt)
                    rhs[-1] += dt * G[-1] * 1.0          # Dirichlet theta=1 at surface
                    th_new = solve_banded((1, 1), ab, rhs)
                th = np.clip(th_new, 0, 1)
                thf = np.empty(N + 1); thf[1:-1] = 0.5 * (th[1:] + th[:-1]); thf[0] = th[0]; thf[-1] = 1.0
            else:
                thv = float(theta_fun(t + dt)); th[:] = thv; thf = np.full(N + 1, thv)
            # ---- drug (backward Euler, D evaluated at new hydration)
            Gd = m.conductance(np.exp(-beta_d * (1 - thf)))
            ab, rhs = _step(m, c, Gd, dt)
            c = solve_banded((1, 1), ab, rhs)
            released += dt * Gd[-1] * c[-1]
            cmin = min(cmin, c.min())
            t += dt
        out_F.append(1 - m.mass(c) / M0); out_Ff.append(released / M0)
        thetam.append(m.mass(th) / m.Vtot)
        if store_profiles is not None and j in store_profiles: prof[j] = (c.copy(), th.copy())
    return dict(F=np.array(out_F), F_flux=np.array(out_Ff), theta_mean=np.array(thetam),
                profiles=prof, xc=m.xc, cmin=cmin)
