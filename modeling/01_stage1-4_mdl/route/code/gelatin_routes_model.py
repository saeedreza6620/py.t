"""
Gelatin microsphere release — unified model for the three crosslinking routes + degradation (proposal Eq. 4-8)
  free drug  C : diffuses, D(t) = D_w * MackieMeares(phi0 * g(t))                         [route 1 + degradation loosening]
  bound drug S : reversible Langmuir binding, sites Smax(t) = Smax0 * g(t)                 [route 2]
                 Smax0 = (charged groups of opposite sign left after crosslinking) / drug charge
  strong drug P: not desorbable on the test time scale (polyion complex / covalent),       [route 2 special case]
                 freed only when the network carrying it dissolves                          [route 3]
  g(t)         : fraction of gel mass remaining, taken from the MEASURED weight-loss curve  [route 3]
      dC/dt = div(D grad C) - kon C (Smax - S) + koff S + r (S + P)
      dS/dt =                 kon C (Smax - S) - koff S - r S
      dP/dt = - r P ,          r(t) = -g'(t)/g(t)
  boundary: perfect sink (or a membrane with transfer coefficient h, e.g. a dialysis bag)
"""
import numpy as np
from scipy.integrate import solve_ivp

def mackie_meares(phi): return ((1 - phi) / (1 + phi)) ** 2

class Model:
    def __init__(self, R_cm, Dw, phi0=0.1, kon=0.0, koff=0.0, Smax0=0.0, g=None, N=40, h=None, Dfun=None):
        self.R, self.Dw, self.phi0, self.kon, self.koff, self.Smax0, self.N, self.h = R_cm, Dw, phi0, kon, koff, Smax0, N, h
        self.g = g or (lambda t: 1.0); self.Dfun = Dfun
        r = np.linspace(0, R_cm, N + 1); self.rc = .5 * (r[1:] + r[:-1]); self.A = 4 * np.pi * r**2
        self.Vc = 4/3 * np.pi * (r[1:]**3 - r[:-1]**3); self.dr = np.diff(self.rc); self.rface = r

    def gdot(self, t, eps=60.0): return (self.g(t + eps) - self.g(max(t - eps, 0))) / (t + eps - max(t - eps, 0))

    def rhs(self, t, y):
        N = self.N; C, S, P = y[:N], y[N:2*N], y[2*N:]
        g = max(self.g(t), 1e-6); r = max(-self.gdot(t) / g, 0.0)
        D = self.Dfun(t, g) if self.Dfun else self.Dw * mackie_meares(self.phi0 * g)
        F = np.zeros(N + 1); F[1:-1] = D * self.A[1:-1] * (C[1:] - C[:-1]) / self.dr
        if self.h is None: F[-1] = D * self.A[-1] * (0 - C[-1]) / (self.R - self.rc[-1])
        else:              F[-1] = -self.A[-1] * C[-1] / (1 / self.h + (self.R - self.rc[-1]) / D)
        bind = self.kon * C * (self.Smax0 * g - S) - self.koff * S
        dC = (F[1:] - F[:-1]) / self.Vc - bind + r * (S + P)
        dS = bind - r * S
        dP = -r * P
        return np.concatenate([dC, dS, dP])

    def run(self, t_eval, C0=0.0, S0=0.0, P0=0.0, rtol=1e-6):
        y0 = np.concatenate([np.full(self.N, C0), np.full(self.N, S0), np.full(self.N, P0)])
        sol = solve_ivp(self.rhs, (0, t_eval[-1]), y0, method="BDF", t_eval=t_eval, rtol=rtol, atol=1e-12 * max(C0 + S0 + P0, 1),
                        max_step=t_eval[-1] / 200)
        N = self.N; tot = (sol.y[:N] + sol.y[N:2*N] + sol.y[2*N:]) * self.Vc[:, None]
        M0 = (C0 + S0 + P0) * self.Vc.sum()
        return 1 - tot.sum(0) / M0

def crank(t, D, R, n=200):
    k = np.arange(1, n + 1); tau = D * np.asarray(t)[:, None] / R**2
    return 1 - 6 / np.pi**2 * (np.exp(-(k * np.pi)**2 * tau) / k**2).sum(1)

if __name__ == "__main__":
    # ---------- verification ----------
    R, Dw = 10e-4, 5.2e-6; D = Dw * mackie_meares(0.1); t = np.linspace(0, 20, 201)[1:]
    f = Model(R, Dw, N=60).run(t, C0=1.0); print("test 1  no binding vs Crank, max |err| =", np.abs(f - crank(t, D, R)).max())
    Kb = 50.0; kon, Smax = 1e4, 1e3; koff = kon * Smax / Kb       # fast, linear (C << Smax) binding
    t2 = np.linspace(0, 60, 121)[1:]
    m = Model(R, Dw, kon=kon, koff=koff, Smax0=Smax, N=60)
    f2 = m.run(t2, C0=1.0 / (1 + Kb), S0=Kb / (1 + Kb), rtol=1e-8)
    print("test 2  fast linear binding vs Crank with D/(1+Kb), max |err| =", np.abs(f2 - crank(t2, D / (1 + Kb), R)).max())
    gl = lambda tt: max(1 - tt / (10 * 86400), 0.0)
    f3 = Model(R, Dw, g=gl, N=30).run(np.array([86400 * 5.0, 86400 * 9.0]), P0=1.0)
    print("test 3  strong pool freed by linear degradation (expect 0.5, 0.9):", np.round(f3, 3))
