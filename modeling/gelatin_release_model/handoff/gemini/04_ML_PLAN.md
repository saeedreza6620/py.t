# 04 — Machine-learning plan (physics-informed)

## Principle
ML never predicts the release curve directly. It predicts the physical parameters θ = (f_free, f_weak, k_weak, μ, f_irr, R, [D, K_b]) from formulation descriptors x; GRM then computes F(t; θ). Benefits: physically valid curves (monotone, ≤ 100 %), interpretable errors, small-data friendly.

## Data
- Start: `ml/build_training_table.py` → `formulations.csv` (one row per formulation) + `curves_long.csv` (252 points, 6 papers).
- Grow: systematic literature extraction (target ≥ 40 papers, ≥ 150 formulations). Schema per row: paper DOI, figure, drug (name, MW, log P, pKa, charge at 7.4), gelatin (type A/B, bloom), crosslinker (type, % or mM, time, temperature), crosslink degree (method, %), loading (method, % w/w, efficiency), size (mean, span), medium (pH, ionic strength, enzyme U/mL, T), measured burst, measured mass loss, release curve points, digitisation method and error.
- Every value keeps its provenance label. Digitise with vector extraction when the PDF is vector, otherwise WebPlotDigitizer with recorded error.

## Targets
1. Stage 1 (direct labels): f_free (burst), μ (from mass-loss curves) — measured, no inversion needed.
2. Stage 2 (inverse labels): θ obtained by fitting GRM to *training* curves only (DIAGNOSTIC_FIT labels used as training targets is allowed; test curves never fitted).

## Models (in order)
1. Physics baseline: published relations only (D_cheng, mu_cheng, Mackie–Meares).
2. Linear / ridge on log-parameters with monotonic constraints (e.g. μ decreasing in GA).
3. Gaussian process (small data, gives uncertainty) — preferred.
4. Gradient boosting with monotone constraints only if ≥ 150 formulations.
5. Optional end-to-end differentiable: GRM in JAX/PyTorch, train x → θ through the release loss on training curves.

## Validation protocol
- **Split by paper** (leave-one-paper-out / group k-fold). Random point splits are forbidden (leak).
- Metrics: RMSE of F(t) in %-points, error in t50 (log), coverage of 90 % prediction intervals.
- Always compare against the physics baseline; report when ML does not beat it.
- Applicability domain: flag inputs outside training ranges.

## Inverse design (product feature)
Given target profile (e.g. t50 = 7 d, burst < 15 %), search x with Bayesian optimisation over the surrogate; return top formulations with uncertainty and the GRM curve. Use Sobol weights (W2) to restrict the search to influential variables.

## Deliverables
`ml/dataset_schema.md`, `ml/extract/` (per-paper scripts), `ml/train.py`, `ml/evaluate.py` (LOPO), `results/ml_*.json`, a section in README.
