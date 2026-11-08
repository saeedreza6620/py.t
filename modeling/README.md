# Gelatin microsphere drug-release modelling (master's thesis, Persian) — folder `modeling/` of repo py.t

> **For the next AI / person: read this file first, then `BACKUP.md`, then `docs/`.**
> Backup date: 2026-11-08. Owner's language: Persian (Farsi). Reply in Persian unless asked otherwise.

## 1. What this project is
A master's thesis that models drug release from **gelatin microspheres**, following the proposal's numerical hierarchy:
Fick diffusion → + swelling → + binding (crosslinking routes) → + degradation → + non-releasable pool → external test.
A side branch covers **PLGA/PLA** microspheres (`07_plga/`).

## 2. Standing rules (the user insisted on these — do not break them)
1. **Never fit D.** D comes from first principles (Wilke–Chang, Mackie–Meares, Abdekhodaie Eq. 26).
2. **No hypothetical swelling.** Use measured swelling only (Kodra SD%, Zhang Fig. 8).
3. **Parameters must come from the same formulation and the same paper.**
4. **Honest step labels** (rejected / partial / valid prediction / descriptive only). Never call a fitted step a prediction.
5. **Plain Persian wording**, not "قلمبه" (no pompous words). Short, clear sentences.
6. Word reports: font **B Nazanin 12**, **RTL**, Latin digits, equations as **real Word OMML** (not text/images), headings as plain styled paragraphs (NOT Word Heading styles — they show collapse arrows).
7. Decks: Slides artifact type (not .pptx) unless a file is asked for. Speaker notes in Persian.
8. **No secrets in files.** This repo needs no secrets. Never write tokens/keys here.

## 3. Where the model is now (status)
The model is at **step 6 — external test: partially accepted.**

RMSE (% release) on Kodra 2026 (ketoprofen, tannic-acid-crosslinked gelatin), K-1 / K-2 / K-3:

| Step | K-1 | K-2 | K-3 | Mean | Status |
|---|---|---|---|---|---|
| 1 Fick | 69.8 | 59.4 | 49.5 | 59.6 | rejected |
| 2 + swelling | 69.8 | 59.4 | 49.5 | 59.6 | rejected (base needed, not enough alone) |
| 3 + binding | 14.1 | 14.8 | 31.4 | 20.1 | partial |
| 4 + degradation | 17.7 | 12.5 | 12.4 | 14.2 | valid prediction for K-2, K-3 only |
| 5 + non-releasable pool | 10.3 | 12.5 | 12.4 | 11.7 | descriptive, NOT a prediction (f_irr from curve end point) |

Only one fitted parameter: `k_off1 = 2.68e-5 1/s` (K-1, t ≤ 5 h). For K-2/K-3 it is scaled by ln(100/EE) — an **assumption**.
External tests: Mladenovska 2002 (lag law τ = R/v, RMSE 3.6–6.5 %, enzymatic medium only); Hu 2024 (24 h: 83 vs 84 %, RMSE 9.1 % after day 1, 1–8 h too fast).
Abdekhodaie & Wu 2006 (verapamil on Sephadex): four-stage ladder Fick → Eq. 26 → Langmuir equilibrium → Langmuir kinetics, RMS 0.86/0.58/0.62 → 0.029/0.072/0.052. "Got close, not fully": plateau of curves 2–3 comes from the paper's own Eq. 30; one K_ads does not fit all three curves.

## 4. Open gaps / next steps
- Independent `k_off` (Singh, Pharm Res 1205–1210, or Song 2015) instead of fitting.
- Liberation tied to crosslink scission instead of mass loss.
- Zhang 2023 external test not run; Lan 2017 qualitative only.
- Papers not yet received: Cheng 2011, Choy 2008, Singh, Song 2015, full Kodra text.
- Eq. 26 as printed looks like it lacks a "1 −" (Lustig–Peppas) — ask the supervisor.
- Deck slides were never fully visually verified; small ugly line-break of decimals in the Word report.

## 5. Map of this repo
| Folder | Content |
|---|---|
| `01_stage1-4_mdl/` | Stages 1–4: FVM verification, audited dataset, fits, external tests (Hu), regime, stepD, reports. Entry: `run_all.py` (needs original PDFs, not included) |
| `02_abdekhodaie2006/` | Abdekhodaie 2006 four-stage study. `abd06_sync.py`, `agreement_fig.py`, `percurve_fig.py`, `report/build_report.js` → final Word report |
| `03_degradation_doe_kodra/` | Degradation + DOE (Kodra). `kodra_doe.py`, `kodra_fields.py`, full PDE `gelatin_routes_model.py` |
| `04_gelatin_routes/` | Three crosslinking routes model; Chang 2023, Kodra 2026 runs |
| `05_gelatin_design/` | Design map, sensitivity, `kodra_steps.py`, simulator v1 |
| `06_model_completion/` | Mladenovska, Politzer, COMSOL-style figures A–E |
| `07_plga/` | PLGA step 1 (levonorgestrel) and PLGA data bank |
| `08_stepD/` | D-formula check, Abdekhodaie self-check, notebook |
| `09_deck_source/` | Slides deck source (`gen_slides.py` → `project/deck.json` + `slides/*.html`) |
| `10_simulator_source/` | Live simulator HTML source |
| `11_reports_docx/` | Persian Word reports/scripts built so far |
| `docs/` | The 10 Project notes (findings per stage) — the best summary of results |

## 6. Published artifacts (claude.ai, private to the owner)
- Deck (25 slides): https://claude.ai/artifact/KnUxEsCjPvRWabJeETf4tU
- Simulator v5: https://claude.ai/artifact/UeHay5cYMPWSqPCcW1PZA8

## 7. How to work
- Python 3.10+ (numpy, scipy, matplotlib, pandas), Node (`docx` package) for Word, LibreOffice for PDF check.
- Scripts contain absolute `/home/claude/...` paths: run `bash link_original_paths.sh` once.
- Details, rebuild commands and "how to change X" are in **`BACKUP.md`**.
- Literature PDFs are NOT in the repo (copyright). Ask the user to re-attach them if needed.
