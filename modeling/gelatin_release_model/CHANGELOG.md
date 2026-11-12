# Changelog

## 1.1.0 — 2026-11-11
- grm/fast.py: closed-form multi-pool model with hydration gate and primitive parameters (R_dry, MW, Q, D_coop, K_b, pools, degradation); tests/test_fast.py.
- W2: weights of all parameters across Fick, swelling, crosslink/binding, degradation and other — global Sobol (regimes A, B, C), local elasticities, time-resolved mechanism weights.
- Simulator 1.1: all-parameter weights, mechanism-weight chart, global Sobol panel, physical D mode (MW, Q, K_b), hydration gate.

## 1.0.1 — 2026-11-11
- Offline single-file simulator (simulator/grm_simulator.html) built from the validated data; JS model mirrors grm/model.py.

## 1.0.0 — 2026-11-11
- Consolidated model package `grm` (pools + liberation laws + Fick/first-order exit; Eq. (1) verified against the PDE).
- Cheng 2010 data re-extracted from the PDF drawing commands (previously read by eye, ±2 %).
- Validation suite V0–V4 and parameter weights W1 with auto-generated results/VALIDATION.md.
- V2 extended: desorption rate transferred from Chang 2023 (PBS) improves Hu 2024 first-8-h RMSE from 33.0 to 17.7 %-points.
- Regime number Λ = μR²/(π²D) and regime map of parameter weights.
- ML scaffolding: ml/formulations.csv (descriptors + identified physical parameters + provenance) and ml/curves_long.csv.
