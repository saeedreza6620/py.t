# AGENTS.md — operating rules for an AI agent continuing this repository

Read README.md sections 2, 4, 5 and 10 before changing anything.

## Must
1. Keep the information-flow rule (README §4): a parameter used in a validation may be MEASURED, PUBLISHED_RELATION,
   CALIBRATED_SEPARATE (on a different experiment, stated), or TRANSFERRED (from another paper). Never fit to the test curve.
   A fit on the test curve is a DIAGNOSTIC and must be labelled so in code, JSON and text.
2. Every number you add needs: source (paper, figure/table, page), evidence label, uncertainty.
3. After a change run: `python validation/run_all.py && python -m pytest -q`. If a validation number changes, update
   README.md §5/§6 from results/VALIDATION.md and add a line to CHANGELOG.md.
4. Report partial passes and failures as such. Do not tune the model until a failing case passes.
5. New paper -> new `validation/vN_<paper>.py` with a docstring stating the information flow; add it to run_all.py.
6. Leave unknown descriptors empty in ml/ tables. Never invent values (gelatin type, Bloom, crosslink degree...).

## Must not
- push to `main` of this repository (it belongs to a separate web app); work on a branch.
- commit PDFs of papers (copyright) or any secret/token.
- change grm/fick.py numerics without re-running V0 and the mesh study.

## Conventions
- Units inside code: cm, s, cm²/s. Release as a fraction 0..1 inside grm, % in results/figures.
- Time constants: H = 3600 s, DAY = 86400 s (grm.DAY).
- Cheng's μ(GA) uses coefficient 10 (the printed 0.1 is a typo; see grm/correlations.py).

## Where to start (priority list, README §10)
1. ionic-strength-dependent desorption k_weak (fixes V2 early hours);
2. size-distribution integration of Eq. (1);
3. a μ(crosslink degree, enzyme concentration) relation from more papers;
4. ML layer predicting θ = (f_free, f_weak, k_weak, μ, f_irr) from descriptors, split by paper (README §9).
