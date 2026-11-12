# 02 — Project state at hand-off (GRM v1.1.0, commit f060a2e, 12 Nov 2026)

## 1. Scientific question
Which formulation and process parameters control drug release from glutaraldehyde (GA)-crosslinked gelatin microspheres, and by how much? Can release be *predicted* (not fitted) from independently measured or published quantities?

## 2. Model
Drug occupies four pools with fractions f_free + f_weak + f_bound + f_irr = 1.

| Pool | Liberation law Lᵢ(t) | Physical meaning | Source of parameter |
|---|---|---|---|
| free | immediate (after hydration gate) | unbound drug in the network | measured burst / PBS-only curve |
| weak | 1 − e^(−k_weak t) | electrostatic / weak binding, desorbs | separate experiment (e.g. ionic strength) |
| bound | 1 − e^(−μ t) or measured mass loss g(t) | drug released only when network degrades (enzymatic) | Cheng μ(GA) or measured mass loss |
| irr | never | covalently trapped / denatured | mass balance |

Exit from the sphere: Fick kernel K(u) = 1 − (6/π²) Σ (1/n²) exp(−n²π²D u / R²) (Crank), or first-order exit with τ_exit.
Release: F(t) = Σᵢ fᵢ ∫₀ᵗ K(t−s) dLᵢ(s). This equals the linear diffusion PDE with a spatially uniform source (Duhamel); checked against the FVM solver to ≤ 0.018 %-points.

Primitive (physical) parameter route in `grm/fast.py::release_primitive`:
- R = R_dry · Q^(1/3) (Q = volumetric swelling ratio)
- D_w from Stokes–Einstein with molecular weight (or Wilke–Chang + Le Bas)
- D_eff = D_w · MM(φ = 1/Q) / (1 + K_b) (Mackie–Meares obstruction, fast linear binding K_b)
- hydration gate rate a = π² D_coop / R²
- Cheng relations: D(GA) = 7.5132·GA^−0.2281 × 10⁻⁴ µm²/s; μ(GA) = 0.36(1 + 10·e^(−14.29·GA)) d⁻¹ (the "0.1" printed in Cheng is a typo; 10 reproduces his curves)

Regime number Λ = μR²/(π²D): Λ ≪ 0.1 → release limited by liberation (binding/degradation); Λ ≫ 1 → diffusion limited; between → mixed.

## 3. Validation (nothing fitted to the curve it is judged on)
| ID | Case | Result | Verdict |
|---|---|---|---|
| V0 | FVM vs Crank; Eq.(1) vs PDE | 0.011 %-pts (N = 80, 2nd order); ≤ 0.018 | PASS |
| V1 | Cheng 2010, GA 0.25 & 0.625 % (not used for any parameter) | RMSE 2.44 / 3.98; 8/11 points in error bars | PASS (prediction) |
| V1b | Cheng GA 0.125/0.375/0.875 % (used by Cheng for μ) | 3.92 / 2.94 / 3.86 | consistency only |
| V2 | Chang 2023 → Hu 2024 | after day 1: 9.4; first 8 h: 33.0 → 17.7 with Chang's desorption rate | PARTIAL |
| V3 | Mladenovska 2002, sizes B–F from A | 3.6–5.7 (release = mass loss alone: 22–31) | PASS (prediction) |
| V4 | Saravanan 2011, Fick-only with independent D | t50 < 0.1 s vs 5.2–23 d (ratio ≥ 6.2e6) | FAILS AS EXPECTED |

Interpretation: for small hydrophilic drugs in GA-gelatin microspheres, diffusion is almost never limiting (Λ for Hu ≈ 7e-9); release is controlled by binding and network degradation. Pure Fick models in the literature work only because D is fitted.

## 4. Parameter weights (W1 local, W2 global Sobol, N = 1024, bootstrap CIs)
- Local elasticities of t50 at Cheng GA 0.375 %: R +1.20, D −0.60, f_free −0.62, μ −0.40, GA +0.23.
- Total Sobol index of log t50:
  - Regime A (small GA microspheres in buffer): f_free 0.84, weak share 0.20, weak time 0.09.
  - Regime B (Cheng-type, physical route): K_b 0.90, f_free 0.07, R_dry 0.04.
  - Regime C (Cheng design variables GA, R, enzyme): R_dry 0.54, enzyme 0.27, f_free 0.15.
- Group conclusions:
  - **Swelling:** ≈ 0 weight; hydration takes seconds; Q cancels in R²/D, and its net effect is zero near Q ≈ 6.2.
  - **Fick (R, D):** matter only when Λ ≳ 0.1.
  - **Crosslinking:** acts through binding (f_free, weak share, K_b), not through mesh-size diffusion.
  - **Degradation (μ, enzyme, mass loss):** controls the tail (t80, t90).
- Time-resolved mechanism weights: free pool dominates the first hours, weak pool day 0–2, degradation afterwards (figure `W2_mechanism_weights_time.png`).

## 5. Repository map (`modeling/gelatin_release_model/`)
| Path | Content |
|---|---|
| `grm/fick.py` | Crank series (long/short time), profiles, `SphereFVM` (graded mesh, Crank–Nicolson + Rannacher) |
| `grm/model.py` | `Liberation`, `Pool`, `Particle`, `release()` (Stieltjes sum), `release_pde()` |
| `grm/fast.py` | vectorised closed form `release_fast`, `derived`, `release_primitive`, `D_water_from_MW` |
| `grm/correlations.py` | Wilke–Chang, Le Bas, Mackie–Meares, Stokes–Einstein, `D_cheng`, `mu_cheng`, drug table |
| `grm/analysis.py` | RMSE, R², t_x, elasticities, degree of rate control |
| `validation/v0…v4, w1, w2, run_all.py` | each case writes `results/*.json` and `figures/*.png`; run_all writes `VALIDATION.md` |
| `data/*.csv` | digitised curves with provenance columns (vector-extracted where possible) |
| `tools/digitize_cheng2010.py` | vector extraction from PDF (PDF itself not in repo) |
| `ml/build_training_table.py` | `formulations.csv` + `curves_long.csv` (252 points) |
| `simulator/` | `template.html`, `build_simulator.py` → `grm_simulator.html` (offline, CSV/PNG/JSON export) |
| `tests/` | 11 pytest tests (all pass) |
| `README.md`, `AGENTS.md`, `CHANGELOG.md` | documentation; AGENTS.md is the contract for AI agents |

## 6. Thesis documents (in `thesis_docs/`)
- Literature review (advisor's changes accepted, project results removed).
- Chapter 3, methodology: geometry, mesh, mesh independence, one release curve reproduced.
- Chapter 4: model, parameter weights, validation.
All three are Persian, B Nazanin, RTL.

## 7. Known weaknesses (be honest about these)
1. V2 early-time error is large (first 8 h: 17.7) — the weak-pool rate is ionic-strength dependent and not modelled.
2. f_free has no predictive relation; it is measured per formulation (burst). This is the biggest gap for prediction.
3. μ depends on GA (Cheng) but not yet on crosslink degree measured by TNBS/ninhydrin, gelatin type (A/B), or enzyme concentration in a general way.
4. Monodisperse spheres assumed; real batches are polydisperse.
5. Data set is small (6 papers, 252 points); ML on this alone would overfit.
6. Digitised data carry ±1–2 %-point read error (vector extraction better).
7. No license file yet in the repo.
