"""Fast tests (< 1 min). Run:  python -m pytest -q
Numerical tests check the mathematics; regression tests pin the validation numbers reported in README.md.
If you change the model and a regression number moves, update README.md and results/VALIDATION.md together
(python validation/run_all.py) and explain the change in CHANGELOG.md."""
import os, sys, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0, ROOT)
import numpy as np, pytest
from grm import *
from grm.model import release_pde
H = 3600.0

def test_crank_series_and_short_time_agree():
    tau = np.geomspace(1e-5, 0.05, 40)
    assert np.abs(release_series(tau) - release_short_time_ref(tau)).max() < 1e-12

def release_short_time_ref(tau):
    from grm.fick import release_short_time
    return release_short_time(tau)

def test_known_values():
    assert release_analytical(np.array([0.030546524298]))[0] == pytest.approx(0.5, abs=1e-9)   # tau50
    assert release_analytical(np.array([0.1]))[0] == pytest.approx(0.770478738, abs=1e-8)

def test_fvm_second_order_and_mass_conservation():
    taus = np.array([0.005, 0.0305, 0.1]); ex = release_analytical(taus); e = []
    for N in (20, 40, 80):
        res = SphereFVM(N, 2.0).solve(taus, 1e-5, theta=0.5)
        e.append(np.abs(res["F_inv"] - ex).max()); assert np.abs(res["F_inv"] - res["F_flux"]).max() < 1e-12
    assert np.log2(e[0] / e[1]) > 1.8 and np.log2(e[1] / e[2]) > 1.8

def test_superposition_equals_pde():
    p = Particle([Pool(0.4, name="free"), Pool(0.35, Liberation("first_order", rate=1 / (2 * DAY)), "bound"),
                  Pool(0.2, Liberation("first_order", rate=1 / (4 * H)), "weak")], 30e-4, 5e-12, f_irr=0.05)
    t = np.array([0.1, 0.5, 1, 3, 7, 15]) * DAY
    assert np.abs(release(t, p) - release_pde(t, p, N=120)).max() < 5e-4

def test_limits():
    p = Particle([Pool(1.0, name="free")], 10e-4, 1e-6)            # fast diffusion: immediate
    assert release(np.array([60.0]), p)[0] > 0.999
    lib = Liberation("first_order", rate=1 / DAY)                  # fast diffusion + first-order liberation = first order
    p = Particle([Pool(1.0, lib)], 1e-4, 1e-6)
    assert release(np.array([DAY]), p)[0] == pytest.approx(1 - np.exp(-1), abs=1e-3)
    with pytest.raises(ValueError): Particle([Pool(0.7)], 1e-4, 1e-6).check()

def test_cheng_relations():
    assert mu_cheng(np.array([0.125, 0.375, 0.875])) * DAY == pytest.approx([0.963, 0.377, 0.360], abs=2e-3)   # Fig 2.7 caption: 1, 0.38, 0.36
    assert D_cheng(0.125) / D_cheng(0.875) == pytest.approx(1.56, abs=0.01)

def test_wilke_chang_diclofenac():
    assert wilke_chang(DRUGS["diclofenac"]["V"]) == pytest.approx(7.38e-6, rel=0.01)

RES = os.path.join(ROOT, "results")
@pytest.mark.skipif(not os.path.exists(os.path.join(RES, "summary.json")), reason="run validation/run_all.py first")
def test_validation_numbers_are_pinned():
    v1 = json.load(open(os.path.join(RES, "v1_cheng2010.json")))
    assert v1["test"]["GA 0.25"]["rmse_pct"] < 3.0 and v1["test"]["GA 0.625"]["rmse_pct"] < 4.5
    v2 = json.load(open(os.path.join(RES, "v2_hu2024_from_chang2023.json")))
    assert v2["hu_pred_with_1.0dM-G"]["rmse_after_1d"] < 10 and v2["hu_pred_B_weak_rate_from_chang"]["rmse_first_8h"] < 20
    v3 = json.load(open(os.path.join(RES, "v3_mladenovska2002.json")))
    assert max(v3["rmse_predicted_sizes"]) < 6.0
    v4 = json.load(open(os.path.join(RES, "v4_saravanan2011_negative_control.json")))
    assert min(min(c["ratio_obs_over_fick"]) for c in v4["cases"].values()) > 1e6
