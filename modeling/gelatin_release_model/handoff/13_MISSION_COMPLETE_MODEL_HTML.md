# 13 — MISSION: complete the model (GRM 2.0) and deliver it as one HTML file

Paste this whole file to Grok after it has read `GROK_KNOWLEDGE_BASE.md` (or the ZIP). It is self-contained.

---

## Your mission
Take GRM 1.1 (validated multi-pool release model for glutaraldehyde-crosslinked gelatin) to **GRM 2.0**. The modelling is complete when the parameters the user asked about at the start have *quantified* effects, each with a source:
- crosslinker (type and amount);
- gelatin type A/B;
- crosslinker-to-gelatin ratio;
- drug type (MW, charge, log P);
- initial drug loading;
- particle size and distribution;
- medium (ionic strength, enzyme).

Deliver the result as **one self-contained HTML file** plus the code changes.

## Hard rules (repeat them back before starting)
1. No parameter is fitted on a curve used to judge the model. The allowed labels are: MEASURED, PUBLISHED_RELATION, CALIBRATED_SEPARATE, TRANSFERRED, ASSUMED (with reason), and DIAGNOSTIC_FIT (diagnostics only).
2. No invented data, references or numbers. If a relation has no data behind it, it ships as a **hypothesis** with label ASSUMED, shown in grey in the HTML, and is excluded from validation claims.
3. The GRM 1.1 results must stay reproducible (02 §3). If you change a number, explain why.
4. Branch `modeling/gelatin-release-model-v1` only. No PDFs, no secrets.
5. The user is Persian-speaking. The HTML interface and all explanations are in Persian (RTL). Code stays in English.

## Work packages (do them in this order; report after each one)

### M1 — Ionic strength → weak desorption (closes V2 early-time gap)
- k_weak(I) and f_weak(I), using Debye screening or salt-competition Langmuir.
- Parameters must come from separate binding/release-vs-salt data on gelatin. List the papers and ask the user for the PDFs before implementing.
- **Accept when:** V2 first-8-h RMSE drops below 17.7 with nothing tuned on Hu; V1 and V3 do not change by more than 0.1.

### M2 — Size distribution
- F_batch = ∫ w(R) F(t; R) dR, with a log-normal option and a histogram option.
- **Accept when:** σ → 0 equals the monodisperse result to 1e-6; V3 is re-run with the reported size spreads.

### M3 — Degradation μ(crosslink degree, gelatin type, enzyme)
- Calibrate on mass-loss data only.
- Cheng μ(GA) must come out as a special case.
- **Accept when:** V1 RMSE is not worse than before.

### M4 — Binding fractions from formulation (the user's parameter list)
- Build a physics-informed relation for f_free, f_weak and K_b from:
  - drug charge at the medium pH relative to the gelatin pI (type A pI ≈ 7–9, type B ≈ 4.7–5.4; cite a source);
  - crosslinker/gelatin ratio (free amine consumption);
  - loading route (soak vs in-situ);
  - initial loading (saturation of binding sites, Langmuir capacity).
- Use the existing evidence:
  - CD alone failed as a descriptor (11 §7);
  - f_w depends on loading route and drug.
- Validate leave-one-paper-out on the audited data (`data/release_dataset_audited.csv`, `ml/formulations.csv`).
- **Accept when:** the error is reported honestly. If it fails, M4 ships as "hypothesis + test result".

### M5 — Beyond microspheres
- Add slab and cylinder Crank kernels so that gelatin hydrogels, films and scaffolds can be simulated.
- **Accept when:** each kernel is verified against its analytical series (test). Validate on one GA hydrogel data set if available; otherwise label it "not validated".

### M6 — Weights of all parameters, GRM 2.0
- Extend W2 (Sobol + elasticities + time-resolved mechanism weights) to include the new formulation inputs: gelatin type, GA/gelatin ratio, drug charge, log P, MW, loading, R and σ_R, ionic strength, enzyme.
- Report per regime (A, B, C as in 02 §4).

### M7 — Validation 2.0
- Re-run V0–V4.
- Add at least one new held-out paper with GA gelatin that is not used anywhere in calibration (ask the user for candidates/PDFs).
- Write a `VALIDATION.md` table showing before → after.

### M8 — The HTML deliverable (`GRM_2.0_Model_Report.html`)
One file that works offline: no CDN and no external fonts. It is built by a script (`simulator/build_report.py`) from Python results, so the numbers in the HTML are produced by code, not typed.

| Tab (Persian title) | Content |
|---|---|
| مدل | every equation, written in HTML with sub/sup or inline SVG; symbols with units; pool diagram (inline SVG) |
| منشأ پارامترها | table of every parameter: value, unit, source (paper, figure, page), label, uncertainty |
| اعتبارسنجی | V0–V7 table with verdict colours; one chart per case, model vs data (inline SVG/canvas) |
| وزن پارامترها | elasticity bars grouped Fick / swelling / crosslink-binding / degradation / formulation / medium; Sobol per regime with CIs; mechanism weights vs time |
| شبیه‌ساز | interactive simulator extended from `simulator/template.html`, with new inputs: gelatin type, GA/gelatin ratio, drug charge/log P/MW, loading, σ_R, ionic strength, enzyme, geometry (sphere/slab/cylinder). Hypothesis-based relations are shown with a grey "فرضیه" badge |
| طراحی معکوس | target t50 / burst → feasible formulation ranges (grid or simple optimiser in JS on the closed form) |
| محدودیت‌ها و کارهای باز | honest list |

HTML requirements:
- `dir="rtl"`, `lang="fa"`; font stack `'B Nazanin', 'Vazirmatn', Tahoma, sans-serif`; Persian digits in the text.
- Works on a phone (no horizontal scroll); light/dark mode.
- Exports CSV, PNG and JSON. Settings saved in localStorage, wrapped in try/catch.
- **JS–Python parity:** the build script embeds reference curves computed by `grm/fast.py` for every preset. The page recomputes them in JS and shows the maximum difference (it must be < 0.1 %-point) in a footer badge.
- Size target < 300 kB.

## How to deliver (you cannot push)
1. For each work package, give:
   - a unified `git diff` or the full files with their paths;
   - the commands to run;
   - the expected output.
2. **If you can execute Python:** run `python validation/run_all.py && python -m pytest -q` and paste the real output.
   **If you cannot:** write "NOT RUN" next to every number. The user runs the commands and pastes the output back to you. Never present an un-run number as a result.
3. At the end, give:
   - the complete `GRM_2.0_Model_Report.html` (or its build script plus template, if it is too long for one message, split into numbered parts the user can concatenate);
   - CHANGELOG entry 2.0.0 and README updates;
   - a Persian summary for the user (1 page): what changed, the validation table, open issues.

## First reply
Do not write code yet. Reply in Persian with:
- (a) the rules in your own words;
- (b) whether you can run Python in this chat;
- (c) for M1, M3, M4, the list of papers you need (only papers you are sure exist, with DOI);
- (d) your plan and time order for M1–M8.
