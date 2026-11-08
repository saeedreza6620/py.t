# Degradation + design of experiment (Kodra 2026) — code

Run order (Python 3, numpy, scipy, matplotlib):

1. `python3 kodra_doe.py`     -> five-step ladder, figs/9, 10, 11 and kodra_doe_results.json
2. `python3 kodra_fields.py`  -> COMSOL-style fields (full PDE), figs/12, kodra_fields_results.json, PDE-vs-lumped check

Files
- kodra_doe.py            data of the three formulations (crosslinking 4 / 2 / 0.5 h), lumped model, steps 1-5
- gelatin_routes_model.py full PDE (finite volume, free C / bound S / strong P pools, degradation r = -g'/g)
- comsol_fields_lib.py    half-disc plot in COMSOL style (jet, white flux arrows, min/max markers)
- kodra_fields.py         fields for the three formulations at 1, 3, 5, 12, 24 h

Status labels of the steps (also in the report)
1, 2 rejected | 3 partial (k_off fitted on MS/K-1, t <= 5 h) | 4 valid prediction for K-2, K-3 | 5 descriptive (f_irr from the curve end point)

The Abdekhodaie part (Fick -> Langmuir) is in abd06_sync.py, agreement_fig.py, percurve_fig.py (README.md).
