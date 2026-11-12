import os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0, ROOT)
import numpy as np
from grm import Particle, Pool, Liberation, release, DAY
from grm.model import release_pde
from grm.fast import release_fast, derived
H = 3600.0

def test_fast_equals_superposition_without_hydration():
    t = np.array([0.01, 0.3, 1, 3, 8, 20]) * DAY
    for R, D, ff, fw, kw, mu, fi in [(50e-4, 9.4e-12, 0.47, 0, 1e-4, 4.4e-6, 0), (8e-4, 3e-6, 0.3, 0.4, 1 / (2 * H), 1 / (10 * DAY), 0.05)]:
        p = Particle([Pool(ff), Pool(fw, Liberation("first_order", rate=kw)), Pool(1 - ff - fw - fi, Liberation("first_order", rate=mu))], R, D, f_irr=fi)
        assert np.abs(release(t, p) - release_fast(t, R, D, ff, fw, kw, mu, fi)[0]).max() < 1e-5

def test_fast_with_hydration_equals_pde():
    R, D, a, b, kw = 20e-4, 1e-11, 1 / (3 * H), 1 / DAY, 1 / (4 * H)
    s = np.linspace(0, 40 * DAY, 40001); hyp = lambda r: 1 - (r * np.exp(-a * s) - a * np.exp(-r * s)) / (r - a)
    p = Particle([Pool(0.4, Liberation("tabulated", t_tab=s, L_tab=1 - np.exp(-a * s))), Pool(0.2, Liberation("tabulated", t_tab=s, L_tab=hyp(kw))),
                  Pool(0.4, Liberation("tabulated", t_tab=s, L_tab=hyp(b)))], R, D)
    t = np.array([0.05, 0.5, 2, 8, 15]) * DAY
    assert np.abs(release_pde(t, p, N=100) - release_fast(t, R, D, 0.4, 0.2, kw, b, 0, 3 * H)[0]).max() < 3e-4

def test_swelling_cancellation():
    # t50 ~ R^2/D with R = R_dry Q^(1/3), D ~ MM(1/Q): elasticity 2/3 - 4Q/(Q^2-1), zero at Q = 3 + sqrt(10)
    Q0 = 3 + np.sqrt(10); r = lambda Q: (Q ** (2 / 3)) / (((Q - 1) / (Q + 1)) ** 2)
    e = (np.log(r(Q0 * 1.01)) - np.log(r(Q0 / 1.01))) / (2 * np.log(1.01))
    assert abs(e) < 1e-3
