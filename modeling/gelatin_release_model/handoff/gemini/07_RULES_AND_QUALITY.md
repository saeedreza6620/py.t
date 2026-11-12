# 07 — Rules and quality bar (non-negotiable)

## Scientific integrity
1. **No fitting on the judging curve.** A parameter's value may come only from:
   - `MEASURED` (same paper, different measurement, e.g. mass loss, burst, size);
   - `PUBLISHED_RELATION` (equation from a paper, with page/equation number);
   - `CALIBRATED_SEPARATE` (fitted on a different experiment, named);
   - `TRANSFERRED` (taken from another paper's formulation).
   A fit to the curve under test is `DIAGNOSTIC_FIT` and may appear only in diagnostics, labelled.
2. **No invented numbers or references.** Unknown stays "unknown". DOIs must be checked. Market numbers need a URL and date.
3. **Report failures.** PARTIAL and FAIL are valid results. Never adjust code to make a test pass without a physical reason written in CHANGELOG.
4. **Assumptions labelled** `ASSUMED` with the reason and the sensitivity of the result to it.
5. Digitised data: record method (vector / manual), axis calibration, estimated read error.

## Code
- Python ≥ 3.10, numpy/scipy/matplotlib only in core (`grm/`). Extras go to `requirements-dev.txt`.
- Do not change `grm/fick.py` numerics without re-running V0 (mesh study must stay 2nd order).
- Pure functions, SI-consistent units documented in docstrings (time in s internally; days in plots).
- Every new feature: a test in `tests/`, a line in CHANGELOG, a README section.
- Figures produced by scripts; never edited by hand.
- `results/VALIDATION.md` is auto-generated — never edit by hand.

## Git
- Never commit to or open PRs against `main` of saeedreza6620/py.t (unrelated web app).
- Base branch: `modeling/gelatin-release-model-v1`; feature branches `gemini/<task-id>`.
- Never commit paper PDFs (copyright), tokens, API keys, emails or personal data.
- Commit messages in English, imperative, with a body explaining *why*.

## Documents for the user
- Persian, B Nazanin, right-to-left, Persian digits; English technical terms in footnotes; equations numbered.
- Cite valid references only (author, year, journal, DOI).

## Reporting format for every task
1. What changed (files).
2. Commands run and their output (run_all + pytest).
3. Validation table before → after.
4. New parameters with source + label.
5. Open questions / what was not done.
