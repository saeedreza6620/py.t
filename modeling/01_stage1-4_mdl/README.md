# Drug release from gelatin microspheres — stages 1–4

Reproducible code, audited dataset and figures behind `report/Report_Stage1-4_fa.docx` (Persian, RTL, editable Word equations).

```
python run_all.py /path/to/folder/with/original/PDFs
```
Requirements: Python 3.10+, numpy, scipy, pandas, matplotlib, pdfplumber, Pillow, poppler-utils (`pdfimages`).
Stage 1 takes ~3 min, stage 4 ~2 min.

| Folder | Content |
|---|---|
| `code/` | `fick_core.py` (analytical series with tail-bound control, spherical FVM), stage scripts, digitization helpers |
| `data/release_dataset_audited.csv` | One row per point: case, formulation, time, value, unit, evidence label, digitization uncertainty, include flag + reason, locator |
| `data/swelling_dataset_C3.csv` | Kodra 2026 gravimetric swelling (SD%) of the same MS/K formulations |
| `data/digitization/` | Vector-extracted Saravanan 2011 Fig. 6 |
| `results/` | `split.json` (fixed before fitting), stage-2 fit table/summary, stage-3 readiness, stage-4 comparison, t50 |
| `figures/` | Numbered figures (Fig1_x verification, Fig2_x fits, Fig3_1, Fig4_x comparison, FigA1 digitization QA) |

Evidence labels: DIRECT_FIGURE_DATA_LABEL, VECTOR_EXTRACTED, DIGITIZED_AUTO, DIGITIZED_VISUAL, DIRECT_PROSE.
Abbasi et al. 2008 values are copied from the audit workbook (full text not verified in this session).
