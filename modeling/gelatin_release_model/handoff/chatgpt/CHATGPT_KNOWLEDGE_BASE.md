# CHATGPT KNOWLEDGE BASE — GRM (gelatin release model) project, complete context

Generated 12 Nov 2026 from the hand-off ZIP (ChatGPT_Handoff.zip). Everything the previous assistant knew is here: instructions, user profile and decision log, project state, full simulation history, rules, writing style, literature-review guide, roadmap, the MISSION (section 13), product and marketing, repository docs, all core code, all data, and per-stage notes. The latest literature review (Persian) is in `thesis_docs/markdown/` of the ZIP (too long to inline). The simulator template is in `repo_snapshot/gelatin_release_model/simulator/template.html`.

## Table of contents
1. 01_CHATGPT_MASTER_PROMPT.md
2. 12_USER_AND_COLLABORATION.md
3. 02_PROJECT_STATE.md
4. 11_SIMULATION_HISTORY_AND_NOTES.md
5. 07_RULES_AND_QUALITY.md
6. 09_WRITING_STYLE_GUIDE.md
7. 10_LITERATURE_REVIEW_GUIDE.md
8. 03_TECHNICAL_ROADMAP.md
9. 04_ML_PLAN.md
10. 13_MISSION_COMPLETE_MODEL_HTML.md
11. 05_PRODUCT_STRATEGY.md
12. 06_MARKETING_GTM.md
13. 08_TASK_PROMPTS.md
14. LINKS.txt
15. repo/README.md
16. repo/AGENTS.md
17. repo/CHANGELOG.md
18. repo/results/VALIDATION.md
19. repo/results/summary.json
20. code/grm/__init__.py
21. code/grm/analysis.py
22. code/grm/correlations.py
23. code/grm/fast.py
24. code/grm/fick.py
25. code/grm/model.py
26. code/validation/common.py
27. code/validation/run_all.py
28. code/validation/v0_verification.py
29. code/validation/v1_cheng2010.py
30. code/validation/v2_hu2024_from_chang2023.py
31. code/validation/v3_mladenovska2002.py
32. code/validation/v4_saravanan2011_negative_control.py
33. code/validation/w1_parameter_weights.py
34. code/validation/w2_all_parameters.py
35. code/tests/test_fast.py
36. code/tests/test_model.py
37. code/ml/build_training_table.py
38. code/simulator/build_simulator.py
39. code/tools/digitize_cheng2010.py
40. code/requirements.txt
41. data/data/chang2023_mass_loss_regressions.csv
42. data/data/cheng2010_release_vector.csv
43. data/data/hu2024_mass_remaining.csv
44. data/data/mladenovska2002_digitized.csv
45. data/data/release_dataset_audited.csv
46. data/data/saravanan2011_fig6_vector.csv
47. data/ml/formulations.csv
48. notes/abdekhodaie2006_selfcheck.md
49. notes/abdekhodaie_fick_to_langmuir.md
50. notes/degradation_doe_kodra_nov2026.md
51. notes/external_test_hu2024.md
52. notes/gelatin_design_map.md
53. notes/gelatin_routes_step3.md
54. notes/model_completion_nov2026.md
55. notes/plga_step1_findings.md
56. notes/stage1-4_findings.md
57. notes/stepD_formula_D_findings.md


<!-- ===== 01_CHATGPT_MASTER_PROMPT.md ===== -->

# FILE: 01_CHATGPT_MASTER_PROMPT.md

# Master prompt for ChatGPT — paste this as the first message

You are joining an ongoing research-to-product project as the lead technical collaborator. Read this whole message and the attached files before writing any code.

## Who you work for
Saeedreza Barzkar, graduate student. The work is his thesis (advisor: Dr. Kiaei, who reviews in Word with comments and tracked changes) and the seed of a startup. He writes in Persian; answer him in Persian unless he writes in English. Code, code comments, commit messages and README stay in English. Persian documents follow `09_WRITING_STYLE_GUIDE.md` exactly (thesis track: B Nazanin 14, RTL, Persian digits, English terms in footnotes, real Word equations labelled «معادله (۳-n)»).

## The project in one paragraph
GRM (Gelatin Release Model) is a mechanistic model of drug release from glutaraldehyde (GA)-crosslinked gelatin microspheres. Drug sits in pools — free, weakly bound (first-order desorption), network-bound (freed by degradation), non-releasable — and leaves a sphere by Fickian diffusion after hydration. Release is F(t) = Σ fᵢ ∫ K(t−s) dLᵢ(s) (exact for the linear PDE with uniform source; verified). It is validated on published data with NO parameter fitted to the curve it is tested on. Version 1.1 also quantifies the weight of every parameter (Fick, swelling, crosslink/binding, degradation, other) with local elasticities, global Sobol indices and time-resolved mechanism weights. An offline HTML simulator mirrors the model.

## Where the code is
- GitHub: https://github.com/saeedreza6620/py.t — branch `modeling/gelatin-release-model-v1` — folder `modeling/gelatin_release_model/` (model code at commit 0e30a0c; later commits only add hand-off documents).
- A full copy is in `repo_snapshot/gelatin_release_model/` of the uploaded ZIP.
- Read `12_USER_AND_COLLABORATION.md` first (who the user is, how he works, decision log). Your main assignment is `13_MISSION_COMPLETE_MODEL_HTML.md`.
- Then read, in this order: `README.md` (sections 2, 4, 5, 6, 6.1, 10), `AGENTS.md`, `02_PROJECT_STATE.md`, `11_SIMULATION_HISTORY_AND_NOTES.md` (full history, all lessons), `03_TECHNICAL_ROADMAP.md`, `07_RULES_AND_QUALITY.md`, `09_WRITING_STYLE_GUIDE.md` (how every document is written), `10_LITERATURE_REVIEW_GUIDE.md` + `thesis_docs/markdown/Literature_Review_Gelatin_Microspheres_final.md` (the latest literature review).
- You cannot push. Deliver changes as complete files with their repository paths, or as a unified `git diff` patch. Never target branch `main` (it belongs to an unrelated web app).

## Working inside ChatGPT (important)
- **Run the code yourself** with the Python tool (Code Interpreter / data analysis):
  ```
  unzip -q /mnt/data/ChatGPT_Handoff.zip -d /mnt/data/work
  cd /mnt/data/work/ChatGPT_Handoff/repo_snapshot/gelatin_release_model
  python validation/run_all.py && python -m pytest -q
  ```
  numpy, scipy, matplotlib and pandas are normally preinstalled. The sandbox has no internet, so do not `pip install`. If a package is missing, say so.
- Compare your output with `results/VALIDATION.md` **before** changing anything. Report any difference.
- **Return work as downloadable files:**
  - a ZIP of the full updated `gelatin_release_model/` folder, including a `CHANGES_LOG.md` that says what changed in this session;
  - a `git diff` patch;
  - the HTML report as its own file.
  Also show the key numbers in the chat.
- **Sandbox files expire.** If they are gone, ask the user to upload the latest ZIP *you* returned, and continue from its `CHANGES_LOG.md`.
- Use web browsing only to find and verify papers (DOI, journal page). Never take data values from memory. Ask the user to upload the PDF.

## Non-negotiable rules (details in 07_RULES_AND_QUALITY.md)
1. Never fit a parameter (especially the diffusion coefficient D) to the release curve that is used to judge the model. Allowed sources: MEASURED in the same paper, PUBLISHED_RELATION, CALIBRATED_SEPARATE (on a different experiment, stated), TRANSFERRED (from another paper). A fit on the test curve is a DIAGNOSTIC and must be labelled so everywhere.
2. Every number you add needs a source: paper, figure/table, page, evidence label, uncertainty. Never invent a value, a reference, a DOI or a market figure. If you are not sure, write "unknown" and say what would resolve it.
3. After any change: `python validation/run_all.py && python -m pytest -q`. Show the output. If a validation number moves, update README §5/§6, `results/VALIDATION.md` (auto-generated) and `CHANGELOG.md`, and explain why.
4. Report partial passes and failures as such. Do not tune the model until a failing case passes.
5. Do not commit PDFs of papers or any secret.
6. Change one thing at a time; keep `grm/fick.py` numerics untouched unless you re-run the mesh study (V0).

## Current numbers you must be able to reproduce (results/VALIDATION.md)
- V0 verification: FVM error 0.011 %-points at N = 80 (2nd order); Eq. (1) vs PDE ≤ 0.018.
- V1 Cheng 2010, GA levels never used for any parameter: RMSE 2.44 and 3.98 %-points → PASS.
- V2 Chang 2023 → Hu 2024 (cross-paper, nothing tuned on Hu): RMSE 9.4 after day 1; first 8 h 17.7 → PARTIAL.
- V3 Mladenovska 2002, five sizes predicted from one: RMSE 3.6–5.7 → PASS.
- V4 Saravanan 2011, Fick with independent D: off by > 10⁶ → FAILS AS EXPECTED (negative control).
- W2 global weights of log t50: regime A (small GA microspheres, buffer) free fraction 0.84; regime B (Cheng-type) fast binding K_b 0.90; regime C (Cheng design variables) radius 0.54, enzyme 0.27.

## What I want from you first
Reply with: (a) a 10-line summary of the model and of the provenance rule in your own words; (b) the commands you would run to reproduce the numbers above; (c) which task from `03_TECHNICAL_ROADMAP.md` you propose to start with and why; (d) any file you could not read. Do not write code in this first reply.

## Working style
- Be precise and short. Show numbers, not adjectives.
- When you disagree with an instruction or a result, say so and give the evidence.
- If a task needs a paper you do not have, ask for it (the user can upload PDFs); do not reconstruct data from memory.
- For product and marketing work (05, 06), separate facts with sources from assumptions, and mark every assumption.



<!-- ===== 12_USER_AND_COLLABORATION.md ===== -->

# FILE: 12_USER_AND_COLLABORATION.md

# 12 — The user, how he works, and the decision log (so ChatGPT can continue like the previous assistant)

## 1. Who and what
- Saeedreza Barzkar, graduate student. The thesis is a mathematical model of drug release from gelatin microspheres. The advisor is Dr. Kiaei (دکتر کیائی).
- **The work uses literature data only.** There are no lab experiments, so every parameter must come from published papers.
- **The goal is beyond the thesis:** real industrial value and a startup (see 05, 06). PLGA microspheres are the industrial direction. The base paper there is Chen, Hu & Ouyang 2026 (adaptive FEM).
- **Related outputs:**
  - an ISPST 2026 (Amirkabir University) extended abstract on gentamicin release from gelatin microspheres, using a constant-D Fickian FVM/FEM model validated on Chang 2023 data;
  - a 15-minute Persian presentation of the modelling, with emphasis on industrial application.

## 2. How he wants you to work
1. **Language and readability:**
   - Reply in Persian, short and plain («ساده، نه قلمبه»).
   - Only formulas and symbols in English, so the Persian sentences don't get jumbled.
2. **Depth and originality:** he rejects generic or incremental work. He wants rigorous, novel and well-argued results, with numbers.
3. **Absolute rules on parameters:**
   - No fitting of D, and no fitting of any parameter on the curve used to judge the model.
   - No assumed parameters without an explicit «فرض» label.
   - No invented swelling or other data.
4. **Honest verdicts:** rejected / partial / valid prediction / descriptive only. A partial pass must never be called a success.
5. **Step-by-step work:**
   - He gives a multi-step plan («گام ۱، گام ۲، گام ۳»). Do step 1 completely before step 2.
   - When he says «ادامه بده», continue exactly where the work stopped.
6. **Deliverables are files, not chat text:**
   - Word documents in the style of 09.
   - HTML simulators that work offline and outside Claude.
   - ZIP packages with code and data.
   - Everything also on GitHub, on the branch only.
7. **Advisor workflow:**
   - The advisor's comments are applied as tracked changes in her own Word file, with replies to her comments.
   - Our own project results do not go into the literature review.
8. **Engagement:**
   - He often asks «این انجام شده؟» (has this been done?). Answer yes or no first, then show where (file, section, number).
   - If something was missing, do it and say so.
9. **Papers:** he can upload PDFs. Ask for a specific paper (author, year, journal) instead of guessing its content.

## 3. Decision log (chronological; newest last)
| When (1405 / 2026) | Decision |
|---|---|
| Mehr / Oct | **Fitting dropped.** Step 1: D from formula (Wilke–Chang and gel obstruction). Step 2: D corrected for swelling (Abdekhodaie 2006). Then overlay Fick, the swelling-corrected model and the data. |
| Mehr | **Large gap found.** Formula-D Fick is 10⁴–10⁷ times faster than the data. Next: benchmark on Abdekhodaie 2006, then crosslinking/binding, then degradation. |
| 8 Aban / 29 Oct | **PLGA branch opened** for industrial value, with the same no-fit workflow. Gelatin work continued as the validated core. |
| 12 Aban / 2 Nov | **Three crosslinking routes, binding and degradation model; Kodra DOE ladder.** One fitted k_off (K-1 only), labelled. |
| 17 Aban / 7 Nov | **Mladenovska lag law and Politzer D check.** Hu 2024 external test: partial pass. |
| 18 Aban / 8–9 Nov | **GA focus requested by the advisor.** Record authors' interpretations and empirical fits, and weight mechanisms over time through a measurable quantity (diameter). |
| 18 Aban | **Crosslink degree (CD) chosen, then rejected.** The user first chose measured CD as the model variable. The CD transfer test rejected CD as a stand-alone descriptor. **Current decision:** measured mass loss g(t) plus a measured fast fraction f_w; CD only as side information. |
| 19 Aban / 9 Nov | **Cheng 2010 dissertation received.** μ typo found (0.1 → 10). Data vector-extracted. |
| 20 Aban / 10–11 Nov | **Thesis path in three steps:** (1) methodology chapter, done; (2) GA relations into the literature review, done; (3) parameter weights + model + validation on a separate paper, done as Chapter 4 and GRM. |
| 20 Aban | **Literature review finalised.** All the advisor's changes accepted; our project results removed. |
| 20–21 Aban / 11 Nov | **GRM 1.0 on GitHub** with a README for any AI; ML scaffold. Simulator made savable and usable offline. |
| 21 Aban / 11 Nov | **All-parameter weights (GRM 1.1),** grouped as Fick / swelling / crosslink / degradation / other, with local elasticities and Sobol; shown in the HTML. |
| 21–22 Aban / 12 Nov | **Hand-off to ChatGPT** (this package). |

## 4. Things he explicitly asked for that remain open
- Weight of **gelatin type A vs B**, the **crosslinker/gelatin ratio**, **drug type** and the **initial drug concentration**:
  - Partly covered through binding parameters (f_free, f_weak, K_b) and drug MW.
  - No *predictive* relations yet. These are the core of the mission in `13_MISSION_COMPLETE_MODEL_HTML.md`.
- **Gelatin network beyond microspheres** (hydrogels, scaffolds, films): the model is geometry-general (sphere now; slab and cylinder kernels are easy to add) but has not been validated on those geometries.
- **Thesis Chapter 5** and an English paper.
- **PLGA module.**

## 5. What not to do (things that annoyed him or broke rules before)
- Calling a fitted D a "prediction".
- Inventing a swelling ratio or another missing value.
- Long English answers.
- Heading-style collapse arrows in working reports (use the style tracks in 09).
- Pushing to `main`, or putting PDFs or secrets in the repo.
- Saying "done" without the file and the numbers.



<!-- ===== 02_PROJECT_STATE.md ===== -->

# FILE: 02_PROJECT_STATE.md

# 02 — Project state at hand-off (GRM v1.1.0, commit 0e30a0c, 12 Nov 2026)

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



<!-- ===== 11_SIMULATION_HISTORY_AND_NOTES.md ===== -->

# FILE: 11_SIMULATION_HISTORY_AND_NOTES.md

# 11 — Complete simulation history and every lesson learned

This is the full record of how the model was built, from the first Fick test to GRM 1.1. It covers what each stage showed, what was rejected and why, the bugs that were fixed, and the open questions. Detailed notes per stage are in `project_notes/`. The code for the earlier stages is in `repo_snapshot/modeling_earlier_work/`, which is text files only. Its Word reports and figures are on GitHub under `modeling/0x_*`. Dates are given in the Persian calendar and in 2026.

## 0. The proposal's hierarchy (the logic of the thesis)
Fick diffusion → + swelling → + binding (crosslinking routes) → + degradation → + non-releasable pool → external test → unified model (GRM) → parameter weights → ML.
At every step, an independent parameter source was used, and the step was given an honest label: **rejected / partial / valid prediction / descriptive only**.

## 1. Stage 1–4 (25 Mehr 1405) — `project_notes/stage1-4_findings.md`, code `01_stage1-4_mdl/`
- **Verification of the FVM solver:**
  - spatial order 2.00;
  - temporal order 1.00 with backward Euler, 2.00 with Crank–Nicolson + Rannacher;
  - mass balance error 1.4e-14.
- **Data set:** built from the PDFs with evidence labels DIRECT / VECTOR_EXTRACTED / DIGITIZED_AUTO / DIGITIZED_VISUAL. Cases:
  - Jin 2023 (morphine)
  - Saravanan 2011 (diclofenac)
  - Kodra 2026 (ketoprofen, tannic acid)
  - Zhang 2023 (vancomycin, EDC)
  - Chang 2023 and Hu 2024 (gentamicin, GA)
  - Lan 2017 (bFGF)
  - Liu 2022 (icariin)
- **Constant-D Fick, *fitted* D_app:**
  - Looks sufficient for diclofenac and icariin, with D_app 5e-14 to 3.5e-13 cm²/s.
  - Fails for Kodra K-2/K-3, vancomycin (dialysis bag, plateau < 100 %) and bFGF (sigmoid).
- **Abbasi 2008 swelling model (front-fixing):** inconsistencies were found — a dry initial condition for a water-containing gel, swapped symbols, and r0 confused with diameter.

## 2. Step D — D from first principles (29 Mehr) — `stepD_formula_D_findings.md`
- **Rule set here: D is never fitted.**
  - D_w from Wilke–Chang, with the Le Bas molar volume.
  - D_gel from Mackie–Meares with φ = 1/Q.
  - Swelling correction from Abdekhodaie Eq. 26.
- **Checks:**
  - verapamil: 3.24e-6 vs the paper's 3.21e-6;
  - rhodamine: 3.95e-6 vs 4.0e-6 measured;
  - GelMA: ratio 0.82–0.89.
- **Problem in Eq. 26 as printed:** it gives D_gel > D_w for Q < 10. A "1 −" (Lustig–Peppas) is probably missing. This question goes to the advisor; ratios above 1 are capped at D_w.
- **Measured swelling exists only in two papers:** Kodra (Q 27.2/24.0/13.6) and Zhang (Q ≈ 6.3/6.5). Swelling is never invented for other papers.
- **Key result:** the model gives t50 = 0.008–0.13 s, while the data give 1 h to 11 d, a factor of 5e4 to 3e7. Swelling changes D at most 2×, so diffusion is **not** the controlling step.

## 3. Abdekhodaie & Wu 2006 (verapamil on Sephadex) — `abdekhodaie_fick_to_langmuir.md`, `abdekhodaie2006_selfcheck.md`
Four-stage ladder, RMS for curves 1/2/3:

| Stage | RMS 1 / 2 / 3 |
|---|---|
| Fick | 0.86 / 0.58 / 0.62 |
| + network, Eq. 26 | unchanged |
| + Langmuir equilibrium (K = 6056 1/M and C_max = 0.229 M, from an independent Fig. 12) | 0.095 / 0.098 / 0.089 |
| + Langmuir kinetics (K_ads fitted by the paper on curve 1 only) | 0.029 / 0.072 / 0.052 |

- **Level:** Fick alone can take up at most 2.4 %, while 93 % is taken up, because the drug binds to SP groups.
- **Speed:** τ_D ≈ 3 s and τ_ads ≈ 33 s, while the data take about 3 min. The speed is set by binding.
- **Honest wording, "got close, not fully":**
  - The plateaus of curves 2 and 3 come from the paper's own equilibrium equation.
  - The best K_ads per curve is 0.10 / 0.05 / 0.07, so one K_ads does not fit all three curves.
- **Sign error:** Eq. 4 of the paper needs a minus sign.
- **Parameter provenance (the full table is in the project doc):**
  - independently measured: K, C_max, Q;
  - fitted: K_ads;
  - assumed: T = 25 °C, R = 100 µm.

## 4. Routes model (12 Aban) — `gelatin_routes_step3.md`, code `04_gelatin_routes/`
- **Three pools:**
  - free C, which diffuses;
  - reversibly bound S (Langmuir, with sites ∝ g(t));
  - strongly bound P, freed only by degradation, r = −g′/g.
- **Verification:**
  - no binding reproduces Crank (1e-5);
  - fast linear binding reproduces Crank with D/(1+K_b) (7e-5).
- **Route activation per paper:**
  - Chang and Hu (gentamicin⁺, type-B gelatin, GA): electrostatic route active.
  - Kodra (ketoprofen⁻, tannic acid): drug–TA binding.
  - Saravanan and Liu: dispersed drug, no binding route.
  - Zhang: dialysis-bag barrier.
  - Lan: isotherm saturates.
- **Chang 2023:** free fraction 0.83 / 0.54. Freeing the bound pool in proportion to mass loss frees it too early (day 16: 94/77 % predicted vs 84/59 % in the data). **Liberation lags mass loss.**

## 5. Design map and Kodra DOE (12–18 Aban) — `gelatin_design_map.md`, `degradation_doe_kodra_nov2026.md`
- **Lumped ODE:** dM/dt = −(π²D/R²)M + (k_off + r)S. It differs from the full PDE by 3e-6.
- **Design groups:**
  - desorption share: > 0.7 desorption-controlled, < 0.3 degradation-controlled;
  - free fraction: > 0.5 gives burst/biphasic release;
  - diffusion time ≈ 0.1 s, negligible.
- **Kodra DOE** (crosslinking time 4 / 2 / 0.5 h), RMSE for K-1 / K-2 / K-3:

| Step | RMSE K-1 / K-2 / K-3 | Mean | Label |
|---|---|---|---|
| 1 Fick | 69.8 / 59.4 / 49.5 | — | rejected |
| 2 + swelling | same as Fick | — | rejected |
| 3 + binding | 14.1 / 14.8 / 31.4 | — | partial |
| 4 + degradation | 17.7 / 12.5 / 12.4 | — | valid prediction for K-2 and K-3 only |
| 5 + non-releasable pool | — | 11.7 | descriptive only |

- **The one fitted constant:** k_off = 2.68e-5 1/s, fitted on K-1 for t ≤ 5 h. Scaling it to K-2 and K-3 by ln(100/EE) is an **assumption**, labelled as such.
- **Sensitivity around K-2:**
  - desorption time: t50 changes −48 / +44 %;
  - degradation time: −12 / +3 %;
  - R and Q: 0.
- **Conclusion: crosslinking acts through binding strength.**

## 6. GA focus requested by the advisor (18 Aban) — content of `claude/glutaraldehyde_mechanisms_nov2026.md` (Projects)
- **Papers by crosslinker:**
  - GA: Saravanan 2011, Mladenovska 2002, Liu 2022, Chang 2023, Hu 2024, Cheng 2010/2011, Choy 2008.
  - Others: Kodra 2026 (tannic acid), Zhang 2023 (EDC), De Clercq 2019 (genipin), Lan 2017 (paraformaldehyde).
- **What the authors claimed:**
  - Saravanan: Higuchi R² 0.975–0.998 and Korsmeyer–Peppas n = 0.50 / 0.43 / 0.38, read as "diffusion".
  - Mladenovska: biexponential fit.
  - Dinarvand 2005: swelling 8.34 / 4.51 / 1.44 for 1 / 4 / 12 h of crosslinking.
  - Rattana 2012: D changes only 3× over GA 0.25–7 %.
  - Tabata group: release controlled by degradation through polyion complexes.
- **Time-resolved mechanism weight:** w_i(t) = |∂F/∂ln k_i|, normalised over mechanisms (Campbell's degree of rate control).
  - Kodra: binding 0.70 / 0.81 / 0.41, the rest degradation; swelling ≈ 0.
  - Kodra hydration-time scan: if τ_sw = 1 h, RMSE rises from 12.5 to 19.2, so the data favour τ_sw ≲ 5 min.
  - Chang: the surface pool carries ≈ 98 % of the weight for the first 2 h; degradation dominates after day 1.

## 7. Crosslink degree (CD) as a descriptor — REJECTED (18 Aban) — content of `claude/cd_transfer_test_nov2026.md` (Projects)
- **Model:** F = f_w(1 − e^(−k_w t)) + (1 − f_w)(1 − g(t − λ·t50_deg)).
- **Data sets:** Chang (CD 55 / 51 %), Hu (85 %), Kodra (96 / 93 / 91 %, tannic acid).
- **Leave-one-out with h linear in CD fails even within GA:** RMSE 21.5 / 26.0 / 15.6, against own-fit values of 2.8 / 4.7 / 3.7.
- **Transfer from GA to tannic acid fails** except for K-2.
- **What carries over and what does not:**
  - k_w is similar across all sets (0.26–1.17 1/h);
  - λ ≈ 0.5–1;
  - f_w differs, because it is tied to loading route and drug.
- **Decision:** the model inputs are the measured g(t) plus a measured f_w, obtained from a quick wash or a non-degrading medium. CD is side information only.

## 8. Model completion (17 Aban) — `model_completion_nov2026.md`
- **Mladenovska 2002** (BSA, six sizes, collagenase):
  - Fick: RMSE 40–63.
  - Release taken equal to mass loss: 22–31.
  - With a lag dF/dt = (L − F)/τ, τ ∝ d^0.90, v ≈ 0.62 µm/h calibrated on size A only: sizes B–F give 3.6–5.7.
  - t50 ∝ d^0.83: neither diffusion (exponent 2) nor pure front (exponent 1).
- **Politzer 1996:** D of small molecules in swollen gelatin is 2.9–16.7e-7 cm²/s. This confirms the order of our first-principles D, so slow release cannot come from D.
- **COMSOL-style figures (A–E):** in a Fick-only gentamicin sphere, the drug empties in about 0.1 s.

## 9. External test Hu 2024 (Step 6) — `external_test_hu2024.md`
- **Inputs:** nothing tuned on Hu. Free fraction from Chang; g(t) from Hu's own weight loss.
- **Results:**
  - RMSE 9.1 after day 1;
  - 24 h: 83 % predicted vs 84 % measured;
  - 1–8 h: the model is too fast.
- **Interpretation:** release is about 95 % by day 4–8 while mass loss is only 23–40 %. Degradation controls only the last few percent.
- **Artifact:** the dip at day 28–32 is a background-subtraction artifact of the data.

## 10. Cheng 2010 dissertation (9 Aban–19 Aban) — content of `claude/cheng2010_GA_reaction_diffusion_model.md` (Projects)
- **System:**
  - monodisperse type-B microspheres, R ≈ 50 µm;
  - GA 0.125–0.875 %;
  - acidic dye;
  - medium: PBS with or without collagenase 373 ng/mL.
- **Model:** reaction–diffusion with a source μ·C_i0·e^(−μt) (Michaelis–Menten with S ≪ K_M).
- **D(GA) is fitted** on the first 3 days in PBS: D = 7.5132·GA^−0.2281 × 10⁻⁴ µm²/s.
- **μ(GA) has a typo:** μ = 0.36(1 + 10·e^(−14.29·GA)). The "0.1" printed in the dissertation does not reproduce μ = 1 / 0.38 / 0.36; 10 does.
- **Weak validation by the author:** only GA 0.25 % and 0.625 % are held out, and both are interpolations.
- **Data:** vector-extracted from the PDF with `tools/digitize_cheng2010.py`. This is better than reading by eye.

## 11. Thesis chapters 3 and 4 (19–20 Aban) — content of `claude/thesis_ch3_*`, `claude/thesis_ch4_*` (Projects)
- **Chapter 3 mesh study:**
  - Uniform N = 80 fails at τ = 0.001 (0.69 %).
  - Graded mesh, p = 2, N = 80, passes: max change 0.079 %, GCI ≤ 0.13 %. This mesh was selected.
  - Time: Crank–Nicolson with 4 Rannacher half-steps, dτ = 1e-5.
- **Chapter 3 baseline (Saravanan):**
  - Fick-only t50 = 0.02–0.07 s vs 5.2–23 d observed.
  - Diclofenac D_w(37 °C) = 7.38e-6 cm²/s.
- **Chapter 4:** the unified model F = f_m·Φ + (1 − f_m)∫l·Φ, validated on Cheng, Chang→Hu and Mladenovska. Elasticities of t50: R +1.21, D −0.61, f_m −0.63, μ −0.39, GA +0.23.

## 12. GRM 1.0 → 1.1 (20–21 Aban) — `grm_v1_*`, `grm_all_parameter_weights_*`
- **Unification:**
  - one package with pools and kernels;
  - Eq. (1) equals the PDE with a source (≤ 0.018);
  - V0–V4 validation (numbers in 02 §3);
  - an ML scaffold (252 points).
- **Version 1.1 adds:**
  - primitive parameters: R = R_dry·Q^(1/3), D_w from MW, D_eff = D_w·MM(1/Q)/(1+K_b), hydration gate;
  - closed form verified against the PDE (≤ 3e-4);
  - Sobol global weights (02 §4).
- **Regime C weights at 7 d:** enzyme 0.50, radius 0.41.
- **Swelling elasticity analytic:** 2/3 − 4Q/(Q² − 1), which is zero at Q = 6.2.
- **Stated assumptions:** D_coop = 1e-7 cm²/s (typical value); Q = 6 for Cheng.

## 13. Simulators
| Version | Where | What |
|---|---|---|
| v1 (12 Aban) | `05_gelatin_design/` | design map, Kodra and Chang presets, crosslink-time slider |
| v5 | `modeling/simulator/index.html` + `SIMULATOR_SPEC.md` (rebuild spec) | steps 1–5 ladder, Hu external test |
| Ch4 artifact | claude.ai artifact "شبیه‌ساز رهایش ژلاتین–گلوتارآلدئید" | Cheng relations, GA slider |
| **GRM 1.0 / 1.1 (current)** | `simulator/GRM_simulator_v1.1.html` (also `gelatin_release_model/simulator/`) | see below |

**GRM simulator 1.1:**
- **Delivery:** a single offline HTML file of about 55 kB with no external libraries. It works from disk, on GitHub Pages and in claude.ai.
- **Built from** `simulator/template.html` by `build_simulator.py`, which injects a `DATA` JSON: validation curves, Sobol results, version.
  - **Never edit `grm_simulator.html` by hand.** Edit the template and rebuild.
- **Presets:** Cheng (GA), Hu, Mladenovska, Saravanan, custom.
- **D modes:** physical (MW → D_w, with Mackie–Meares and binding), Cheng D(GA), manual.
- **Inputs:** Q, D_coop gate, K_b, MW, pools, degradation half-life or enzyme.
- **Outputs:**
  - release curve with data overlay;
  - t50 / t80;
  - regime number Λ;
  - all-parameter elasticity bars grouped by stage (Fick / swelling / crosslink-binding / degradation / other);
  - time-resolved mechanism-weight chart;
  - Sobol panel per regime.
- **Export:**
  - CSV, PNG and JSON;
  - inside claude.ai through the `downloads` capability; outside, a plain blob link;
  - state saved in localStorage under key `grm-sim-v2`, wrapped in try/catch.
- **Numerical parity:** the JS closed form must match `grm/fast.py`. Any change to `fast.py` must be mirrored in the template, and the two compared on the presets.

## 14. Bugs fixed (do not reintroduce)
- **Simulator:**
  - The t50 bisection had a lower bound of 1 s; it is now 1e-4 s, because the Fick-only regime releases in under 1 s.
  - Time readouts now show seconds as well.
  - Radius and D had been mixed in one readout cell; they are now separate.
  - Leftover `<style>` tags inside extracted CSS rendered as text and caused horizontal scroll on mobile.
- **fast.py:**
  - Weight-array broadcasting is done with `np.broadcast_to`.
  - Large grids are processed in chunks (`chunk=64`) to limit memory.
  - Scalar τ is wrapped with `np.atleast_1d`.
- **Validation scripts:**
  - In v3, dict keys containing "-" need a dict literal.
  - For the W1 regime map, f_free = 0.5 made t50 pathological; 0.3 is used.
- **Literature review docx:**
  - body paragraphs had been styled as Heading 2;
  - footnote ids were out of order. LibreOffice and Google Docs then showed the wrong footnote text; Word was not affected.
- **Equation and data typos found in papers:**
  - Cheng μ coefficient: 0.1 printed, 10 is correct.
  - Abdekhodaie Eq. 4: missing minus sign.
  - Abdekhodaie Eq. 26: likely missing "1 −".
  - Abdekhodaie Eq. 24 is mislabelled "Eq. 30" in older reports and code.
  - Abbasi 2008: r0 confused with diameter.

## 15. PLGA branch (8 Aban) — `plga_step1_findings.md`, code `07_plga/`
- **Why PLGA:** this is the industrial direction.
- **Sources:**
  - base numerics: Chen, Hu & Ouyang 2026 (AAMM 18:897; 3-D Fick, adaptive FEM);
  - physics: Ford Versypt 2013 review and Mittapelly 2024.
- **Step 1 (levonorgestrel in PLLA, Sivasankaran 2022):**
  - dissolved-drug Fick: t50 = 0.2–0.3 s;
  - dispersed-drug Higuchi sphere: t50 = 11 min–1 h;
  - data: t50 = 1.8–118 h;
  - the model's trend with loading is opposite to the data.
- **Unknowns:** loading-dependent porosity and percolation, polymer state (Tg), burst.

## 16. Open questions to settle (with the advisor or with new papers)
1. An independent k_off (desorption). Candidate sources: Singh (Pharm Res), Song 2015.
2. Liberation tied to crosslink scission instead of mass loss (the lag λ).
3. Eq. 26 of Abdekhodaie: is a "1 −" missing?
4. The Zhang 2023 external test has not been run; Lan 2017 is qualitative only.
5. Papers not yet obtained:
   - Choy 2008;
   - Singh;
   - Song 2015;
   - the full Kodra text;
   - SI tables of the 2024 PLGA implant paper.
6. Whether f_w (fast fraction) can be predicted from the loading route, drug charge and gelatin type. This is the most important open question for prediction (roadmap T4).



<!-- ===== 07_RULES_AND_QUALITY.md ===== -->

# FILE: 07_RULES_AND_QUALITY.md

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
- Base branch: `modeling/gelatin-release-model-v1`; feature branches `chatgpt/<task-id>`.
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



<!-- ===== 09_WRITING_STYLE_GUIDE.md ===== -->

# FILE: 09_WRITING_STYLE_GUIDE.md

# 09 — Writing style guide (how every document in this project is written)

ChatGPT: follow this for every Persian thesis document, report, or Word file you produce. The three Word files in `thesis_docs/` are the reference examples. The generator code for Chapter 3 (docx-js, `Thesis_Ch3_code_and_data.zip` style) followed exactly these settings.

## 1. Language and voice
- Thesis, reports and explanations for the user: **Persian**. Code, comments, README, commit messages: **English**.
- Academic but plain: short sentences, one claim per sentence, numbers instead of adjectives ("RMSE ۲٫۴ واحد درصد", not «تطابق عالی»).
- No hype words (عالی، فوق‌العاده، بی‌نظیر، انقلابی). No unsupported novelty claims.
- Each section ends with a short «تحلیل» or «جمع‌بندی» paragraph saying what the evidence means for *our* model.
- State the evidence type for every number: measured / published relation / calibrated on a separate experiment / transferred / diagnostic fit / assumed.
- Clearly separate what authors *claim* from what the data *show* (e.g. «نویسندگان رهایش را نفوذ فیکی نامیده‌اند؛ اما با R و D مستقل، زمان نفوذ چند ثانیه است»).

## 2. Typography (Word)
| Item | Setting |
|---|---|
| Persian font | **B Nazanin** (complex-script font) |
| Latin font | Times New Roman |
| Body | 14 pt, line spacing 1.67 (400 twips on 14 pt), 6 pt after, justified |
| Heading 1 | 16 pt bold, black, 18 pt before / 8 pt after, keep with next |
| Heading 2 | 14 pt bold, black, 12 pt before / 5 pt after, keep with next |
| Body paragraphs | **never** styled as Heading (a defect of this kind was fixed in the final literature review, §3-7) |
| Direction | right-to-left paragraphs (bidi), Persian language tag fa-IR |
| Digits | Persian digits in Persian text (۰–۹), Persian decimal separator «٫» (۲٫۴۴); a hyphen between Persian digits gets RLM marks so «۳-۲» does not flip |
| Margins | top 3 cm, right 3 cm (binding side), bottom 2.5 cm, left 2.5 cm |
| Page numbers | footer, centred, 10 pt, grey |
| Footnotes | every English technical term appears once as a footnote at first use, Times New Roman 9 pt (e.g. «نفوذ فیکی» → *Fickian diffusion*). Footnote ids must be sequential in document order (LibreOffice/Google Docs mis-number them otherwise — this was fixed in the final literature review) |
| Tables | RTL table, header row bold, 11 pt, centred cells, caption above: «جدول ۳-۲. …» 12 pt bold centred |
| Figures | centred, caption below: «شکل ۳-۴. …» 12 pt bold; figures generated by script at 200 dpi, labels in English or Persian consistently |
| Equations | real Word equations (OMML), not images; in a borderless 2-column table: equation centred, label right-aligned «معادله (۳-۵)» |
| References | numbered in order of first citation, «[۱۲]» in text; list at end in English (Authors. Title. Journal Vol (Year) pages. DOI) |

## 2b. Second style track: working reports, scripts, slide guides (not thesis chapters)
Earlier project reports (`modeling/11_reports_docx/`, Kodra/Abdekhodaie reports) used a lighter style the user asked for at that time:
- B Nazanin **12**, RTL, **Latin digits** allowed, equations as real Word OMML.
- Headings as **plain bold styled paragraphs**, not Word Heading styles (the user did not want collapse arrows).
- Very plain Persian («ساده، نه قلمبه»): short sentences, everyday words, explain each symbol.
Rule: **thesis chapters and the literature review → §2 (B Nazanin 14, Persian digits, Heading styles for the table of contents); working reports, presentation scripts, guides → this track.** If unsure, ask the user which one.

## 2c. Slides
Slide decks are made as Claude Slides artifacts in this project; with ChatGPT, produce a .pptx or a Markdown outline with Persian speaker notes. One message per slide, numbers with source, no decorative text.

## 3. Structure of a thesis chapter
1. Short introduction (what the chapter answers).
2. Sections numbered «۳-۱، ۳-۲ …», sub-sections «۳-۲-۱».
3. Every equation followed by a sentence defining every symbol with units.
4. Every result: table or figure + one paragraph interpretation + limitation.
5. Chapter summary (bullet list allowed only here).

## 4. Tracked changes and the advisor
- The advisor (Dr. Kiaei) reviews in Word. When asked to apply her comments, edit **in the same Word file as tracked changes** (w:ins/w:del, author name stated), reply to her comments in the comment thread, and do not silently rewrite other text.
- When asked to "accept all", produce a clean copy and check that deleted paragraphs did not leave empty bullets.
- Project results (our own model numbers) do **not** belong in the literature review; they go to Chapters 3–5. The final literature review had them removed.

## 5. Citations and honesty
- Only real references with verifiable bibliographic data. If only the abstract was read, say so in the text («متن کامل در دسترس نبود»).
- Numbers read from figures: say «خوانده‌شده از شکل ۶ مقاله، خطای خواندن حدود ۱ تا ۲ واحد درصد».
- Never present a fitted D as a prediction.

## 6. Checklist before delivering a Word file
- Render to PDF and look at every page (RTL, digits, equation labels, footnote numbers match).
- Remove ZIP directory entries (`zip -d file.docx '*/'`) so Word through cloud services opens it.
- File name in English, descriptive: `Thesis_Chapter5_Discussion_fa.docx`.



<!-- ===== 10_LITERATURE_REVIEW_GUIDE.md ===== -->

# FILE: 10_LITERATURE_REVIEW_GUIDE.md

# 10 — The latest literature review: what it is and how to continue it

**File:** `thesis_docs/Literature_Review_Gelatin_Microspheres_final.docx` (37 pages, 85 references, 81 footnotes, Persian, B Nazanin, RTL).
**Readable copy for AI:** `thesis_docs/markdown/Literature_Review_Gelatin_Microspheres_final.md` (pandoc export; equations appear as TeX).
**Paper audit table:** `thesis_docs/Gelatin_Papers_Audit_P01-P30.xlsx` (which paper, which figure, digitisable or not, evidence quality).

## 1. History of the document
1. First full review written (modelling + gelatin microsphere experiments).
2. The advisor (Dr. Kiaei) reviewed it in Word and asked to:
   - focus on **glutaraldehyde (GA)-crosslinked gelatin**;
   - record each author's own mechanism interpretation;
   - collect the empirical models the authors fitted (Higuchi, Korsmeyer–Peppas, biexponential, …);
   - extract the mathematical relations by which GA changes release.
   These were applied as **tracked changes** in her file, with replies to her comments.
3. Cheng's 2010 PhD dissertation (full text behind Cheng 2011, Int J Pharm 403:90–95) was added as reference [84]; Politzer 1996 as [85].
4. Final step (11 Nov 2026): **all tracked changes accepted**, and all results of our own project removed from the review (they now live in Chapters 3–4).
5. Hand-off fix (12 Nov 2026):
   - Nine body paragraphs in §3-7 (machine learning) were wrongly styled as Heading 2 and are now normal text.
   - Footnote ids were renumbered in reading order, because LibreOffice and Google Docs showed the wrong footnote text from footnote 59 onward. Word was not affected.
   - No wording changed.

## 2. Structure
| § | Title (Persian) | Content |
|---|---|---|
| — | چکیده | abstract |
| 1 | مقدمه | 1-1 gelatin as carrier; 1-2 fabrication methods; 1-3 release mechanisms; 1-4 why modelling |
| 2 | روش مرور | search strategy, inclusion, evidence classification (table / text / figure; digitisable or not) |
| 3 | مدل‌سازی و شبیه‌سازی رهایش دارو | 3-1 empirical and semi-empirical models (zero order, first order, Higuchi, Korsmeyer–Peppas with n table, Peppas–Sahlin, Hixson–Crowell, Weibull); 3-2 mechanistic diffusion (Fick 2nd law, Crank series, obstruction / free volume / hydrodynamic theories, Mackie–Meares, Lustig–Peppas, Fujita, Wilke–Chang); 3-3 swelling and hydrogels; 3-4 degradation and erosion (Hopfenberg, Charlier, Monte Carlo, enzymatic); 3-5 drug binding and ion exchange (Abdekhodaie & Wu 2006 Langmuir model, effective D = D/(1+K_b)); 3-6 PK simulation; 3-7 machine learning (Bannigan 2023, Song 2026, MC-NODE 2026); 3-8 comparison table of modelling papers |
| 4 | مقالات تجربی رهایش از میکروسفر ژلاتینی | 4-1 crosslinking and swelling; 4-2 size and enzymatic/cellular degradation; 4-3 ionic interaction and charge; 4-4 antibiotics and composites; 4-5 other drugs and new systems; 4-6 comparison table; 4-7 cross-paper analysis; **4-8 GA gelatin: authors' interpretations and empirical models (Tables 4, 5)**; **4-9 mathematical relations of GA effect on release** (Cheng D(GA), μ(GA) via Michaelis–Menten, reaction–diffusion model); 4-10 mechanism interpretation; 4-11 parameter weights from published data (elasticity) |
| 5 | بحث: شکاف‌های پژوهشی | gaps |
| 6 | جهت‌های آینده | future directions |
| 7 | نتیجه‌گیری | conclusion |
| — | منابع | 85 references, numbered by first citation |

## 3. Key messages the review must keep
1. Empirical fits (Higuchi R², Korsmeyer–Peppas n ≈ 0.43–0.5) are **not** evidence of a diffusion mechanism. For small drugs and R ≈ 1–55 µm, R²/(π²D) is seconds, while release lasts days.
2. In GA gelatin, release is controlled by **liberation from the network**: binding, polyion complexes, and enzymatic degradation (Tabata group, Cheng 2010).
3. Cheng's D(GA) is *fitted* (first 3 days in PBS). His "no adjustable parameters" claim holds only for 2 interpolated GA levels. The printed μ(GA) coefficient 0.1 is a typo for 10.
4. Gelatin lacks an ML-ready database (9 auditable curves from 24 papers vs hundreds of curves for PLGA). The path is mechanism first, then ML on physical parameters.

## 4. How to continue it (tasks for ChatGPT)
- Add new GA-gelatin papers to §4-8 / Tables 4–5 with the same columns: crosslinker conditions, drug, size, medium, authors' interpretation (their words), fitted model and parameters, our remark.
- Every new relation goes to §4-9 with an equation, symbols and units, the source, and whether it is fitted or predictive.
- Keep project results out of this document; cite Chapter 4 instead.
- Follow `09_WRITING_STYLE_GUIDE.md`. When the user sends the advisor's new comments, work with tracked changes in her file.
- Keep a change log at the end of your answer: section, what was added, which references.

## 5. Other thesis documents
- `Thesis_Chapter3_Methodology_fa.docx`:
  - geometry (1-D radial sphere) and cell-centred FVM shells;
  - mesh study: uniform vs surface-graded, p = 2; graded N = 80 selected; observed order 2.0; GCI ≤ 0.13 %;
  - time stepping: Crank–Nicolson with Rannacher start-up;
  - verification against Crank (0.012 %-points);
  - baseline release curve: Saravanan 2011 diclofenac. Fick-only t50 is 0.02–0.07 s against an observed 5.2–23 d, which motivates the multi-mechanism model.
- `Thesis_Chapter4_Model_Weights_Validation_fa.docx`:
  - unified model, GA relations, parameter weights;
  - validation on Cheng, Chang→Hu and Mladenovska.
  - Its numbers are superseded by GRM 1.1 (`results/VALIDATION.md`) where they differ slightly. For example, Cheng RMSE was 2.2/4.0 with eye-read data in Ch4 and is 2.44/3.98 with vector-extracted data in GRM. Update Ch4 to the GRM numbers when revising it.
- Chapter 5 (discussion and conclusion) is **not written yet** (prompt P13 in 08).



<!-- ===== 03_TECHNICAL_ROADMAP.md ===== -->

# FILE: 03_TECHNICAL_ROADMAP.md

# 03 — Technical roadmap (prioritised, with acceptance criteria)

Order matters: each task closes a known weakness (02 §7) before new scope is added. One task = one branch `chatgpt/<task-id>` = one patch.

## T1 — Ionic-strength-dependent weak desorption (closes V2 early-time gap)
- **Why:** V2 first-8-h error 17.7 %-pts; Chang/Hu run in PBS where salt screens electrostatic binding of charged drugs to gelatin (pI of type A ≈ 7–9, type B ≈ 4.7–5.4).
- **Do:** add k_weak(I) and/or f_weak(I) using a Debye-screening or Langmuir–salt-competition form; parameters must come from a *separate* experiment (release in water vs PBS, or binding isotherm vs NaCl) found in literature. If no such data exist, write that down and stop.
- **Accept:** V2 first-8-h RMSE improves without changing any Hu-derived input; V1, V3 unchanged within 0.1; new test in `tests/`; provenance label CALIBRATED_SEPARATE or TRANSFERRED.

## T2 — Particle-size distribution
- **Do:** F_batch(t) = ∫ w(R) F(t; R) dR with log-normal or measured histogram; vectorise in `fast.py`.
- **Accept:** reduces exactly to monodisperse for σ → 0 (test); V3 re-run with each paper's reported size range; report change honestly.

## T3 — μ as a function of crosslink degree, gelatin type and enzyme
- **Do:** collect published mass-loss vs (GA %, crosslink degree %, gelatin A/B, collagenase U/mL) data; build μ = μ₀(enzyme) · h(crosslink degree) with Michaelis–Menten-type enzyme dependence. Keep Cheng μ(GA) as special case.
- **Accept:** relation calibrated on mass-loss data only (never on release curves); predicts V1 within current RMSE; table of sources in `data/` with provenance columns.

## T4 — Predictor for f_free (burst) — the largest gap
- **Do:** literature table of burst (% in first 1 h) vs drug log P, charge at pH 7.4, MW, loading method (pre- vs post-loading), drug:gelatin ratio, GA %. Start with a physics-informed form (partition coefficient + surface fraction 3δ/R) before any ML.
- **Accept:** leave-one-paper-out error reported; never evaluated on a curve used to fit it.

## T5 — Gelatin-type and crosslinker generalisation
- Gelatin A vs B (charge, pI), bloom strength; crosslinkers GA, genipin, EDC/NHS. Same model; new relations for f_weak, μ.
- **Accept:** at least one held-out paper per crosslinker; otherwise label "not validated".

## T6 — ML layer (see 04_ML_PLAN.md)
After T1–T4. ML predicts physical parameters θ; physics produces the curve.

## T7 — PLGA extension (product scope)
- **Do:** new module `grm/plga.py`: autocatalytic hydrolysis (MW decay), pore formation, erosion; base paper to obtain from the user: Chen, Hu & Ouyang 2026 (ask for the PDF; do not reconstruct). Same pool/kernel structure where valid.
- **Accept:** separate validation set (≥ 2 papers), same provenance rules; gelatin results untouched.

## T8 — Engineering and product readiness
1. Add a `LICENSE` (the user decides; propose MIT for academic code or a dual license for commercial — do not add without his choice).
2. `pyproject.toml`, version from CHANGELOG, `pip install -e .`.
3. GitHub Actions CI: run_all + pytest on push to the branch.
4. FastAPI service `api/` with `/simulate`, `/weights`, `/fit-diagnostic` (labelled), JSON schema for formulation input.
5. Simulator: keep single-file offline HTML; add an input form for a user's own measured burst and mass-loss, and export of a report (PDF via print CSS).
6. Type hints + docstrings in `grm/`; numerical regression tests freezing `results/summary.json` within tolerance.

## T9 — Thesis outputs
- Chapter 5 (discussion/conclusion) and an English paper draft "Release from GA-crosslinked gelatin microspheres is liberation-controlled: a provenance-strict multi-pool model" — target journals to be checked by the user (e.g. Int. J. Pharm., J. Control. Release, Eur. J. Pharm. Biopharm.). Do not claim novelty without a literature search.

## Definition of done (all tasks)
`python validation/run_all.py && python -m pytest -q` passes; README/CHANGELOG updated; every new number has source + label; figure regenerated by script, not by hand.



<!-- ===== 04_ML_PLAN.md ===== -->

# FILE: 04_ML_PLAN.md

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



<!-- ===== 13_MISSION_COMPLETE_MODEL_HTML.md ===== -->

# FILE: 13_MISSION_COMPLETE_MODEL_HTML.md

# 13 — MISSION: complete the model (GRM 2.0) and deliver it as one HTML file

Paste this whole file to ChatGPT after it has read `CHATGPT_KNOWLEDGE_BASE.md` (or the ZIP). It is self-contained.

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



<!-- ===== 05_PRODUCT_STRATEGY.md ===== -->

# FILE: 05_PRODUCT_STRATEGY.md

# 05 — Product strategy

Labels: **[FACT + source]**, **[ASSUMPTION]** (to be validated with customers), **[DECISION NEEDED]** (the user decides).

## 1. Product in one sentence
An in-silico formulation designer for controlled-release microspheres: enter formulation and process variables, get a mechanistic release prediction with uncertainty, the parameters that control it, and suggested formulations that hit a target profile — with every input traceable to its source.

Working name: **GRM Designer** [DECISION NEEDED: final name; check trademark availability].

## 2. Problem
- Microsphere development is trial-and-error; each release study takes days to weeks (our data: t50 from hours to > 20 days). [FACT: data in repo]
- Published "Fickian" models fit D to each curve and therefore cannot predict a new formulation. GRM shows that for GA-gelatin microspheres release is controlled by binding and degradation (Λ ≪ 1), not diffusion. [FACT: V4, Λ in VALIDATION.md]
- Regulators encourage model-informed and QbD development (ICH Q8(R2) design space). [FACT: ICH Q8(R2) guideline — ChatGPT must cite the official ICH page]
- Formulators lack a tool that says *which* parameter to change and by how much. [ASSUMPTION]

## 3. Users and buyers
| Segment | User | Buyer | Need |
|---|---|---|---|
| Academic labs (pharmaceutics, biomaterials) | PhD/MSc students, postdocs | PI (grant) | design experiments, interpret curves, thesis/papers |
| Pharma / biotech formulation R&D | formulation scientist | R&D head | fewer experimental iterations, design space for QbD |
| CDMOs specialising in microspheres / long-acting injectables | process scientist | business unit head | faster client feasibility studies |
| Tissue-engineering / growth-factor delivery startups | scientist | founder | gelatin carriers for proteins/GFs |
| Teaching | lecturers | department | interactive teaching of release kinetics |

## 4. Value proposition
- Predict, don't fit: validated on independent data with RMSE 2.4–5.7 %-points on held-out formulations. [FACT: V1, V3]
- Explain: parameter weights (local + Sobol) show what controls burst, t50 and tail. [FACT: W1, W2]
- Trust: provenance labels on every number — suitable for regulatory documentation. [ASSUMPTION: value to regulators to be checked]
- Speed: closed-form solver, curves in milliseconds; runs offline in a browser. [FACT]

## 5. MVP (0–3 months)
1. Web simulator (existing single-file HTML) + hosted version.
2. Python package `grm` (pip) with documented API.
3. REST API (`/simulate`, `/weights`, `/design`) — FastAPI.
4. "Bring your data" mode: upload burst + mass-loss → prediction; clearly separate prediction from diagnostic fit.
5. PDF report export (inputs, sources, curve, weights).
Out of MVP: PLGA, ML inverse design, user accounts with team sharing.

## 6. Roadmap after MVP
- v2 (3–6 months): size distribution, ionic strength, μ(crosslink degree, enzyme), f_free predictor (T1–T4).
- v3 (6–12 months): PLGA module, ML surrogate + inverse design, literature database of formulations.
- v4: integration with lab data (ELN/LIMS export, CSV templates), audit trail for GMP-adjacent use.

## 7. Architecture
- Core: Python `grm` (numpy/scipy), pure functions, versioned.
- Service: FastAPI + pydantic schemas; stateless; container (Docker).
- Front-end: keep the offline HTML for free tier; hosted React/Next front-end later.
- Data: Postgres for formulation database; object storage for reports.
- Validation as a product feature: every release publishes `VALIDATION.md` and test status (CI badge).

## 8. Business model [ASSUMPTION — validate with ≥ 15 customer interviews]
| Tier | For | Content | Price idea |
|---|---|---|---|
| Free / academic | students, teaching | offline simulator, Python package | free (citation required) |
| Pro | individual researchers | hosted designer, report export, data upload | to be tested |
| Team / enterprise | pharma, CDMO | API, inverse design, private formulation DB, support, validation pack | annual license, to be tested |
| Services | pharma, CDMO | model-based formulation studies, custom modules | per project |
Do not publish prices before interviews.

## 9. Legal and IP [DECISION NEEDED]
- Choose a license (open-core: MIT/BSD for the core model, proprietary for hosted designer, database and inverse design).
- Data: digitised curves from papers are facts derived from published figures; keep citations; no PDFs in the repo.
- Thesis ownership: check university rules on IP of thesis results before commercialising.
- Company registration, trademark: user's decision and jurisdiction (Iran and/or abroad); note that sanctions can affect cloud hosting, payments and app stores — ChatGPT should research current rules, not assume.

## 10. Success metrics
- Scientific: held-out RMSE ≤ 5 %-points on ≥ 5 independent papers; published paper.
- Product: weekly active users of simulator; number of formulations simulated; reports exported.
- Commercial: interviews done, pilots signed, conversion free → paid.



<!-- ===== 06_MARKETING_GTM.md ===== -->

# FILE: 06_MARKETING_GTM.md

# 06 — Marketing and go-to-market

Labels: **[FACT + source]**, **[ASSUMPTION]**, **[TO RESEARCH]**. ChatGPT must verify every market figure with a second source before it goes into a pitch deck or business plan.

## 1. Market context
| Item | Value | Source | Status |
|---|---|---|---|
| Long-acting injectables market | USD 21.59 B (2026) → USD 38.63 B (2031), CAGR 12.34 %; microspheres are a listed formulation segment | Mordor Intelligence, Long-Acting Injectables Market report — https://www.mordorintelligence.com/industry-reports/long-acting-injectables-market | FACT (single commercial source; verify) |
| Microsphere market size | — | knowledge-sourcing page had no figures | TO RESEARCH |
| Pharma modelling & simulation software market | — | — | TO RESEARCH |
| Number of labs publishing on gelatin / PLGA microspheres per year | — | Scopus/PubMed query | TO RESEARCH (good proxy for academic segment size) |

Positioning: the beachhead is academic gelatin/biopolymer carriers (where the model is validated now); the money is long-acting injectables (PLGA microspheres), reached via the PLGA module (roadmap T7).

## 2. Competitors and alternatives
| Alternative | What it is | Strength | Gap GRM fills | Source |
|---|---|---|---|---|
| Simulations Plus DDDPlus | mechanistic in-vitro dissolution software; models controlled-release and long-acting injectables since v6 | established, regulatory credibility, PBPK link (GastroPlus) | not specific to crosslinked biopolymer microspheres; binding/degradation pools; price | https://www.simulations-plus.com/software/dddplus/ |
| Siemens/PSE gPROMS FormulatedProducts | process & product modelling platform | process-scale, broad | heavy, expensive, expert users | https://www.businesswire.com/news/home/20180115005279/en/4266611/PSE-Releases-Major-gPROMS-FormulatedProducts-Update |
| COMSOL Multiphysics | general PDE solver | flexible | user must build model; no validated parameter relations | TO RESEARCH (cite vendor page) |
| DDSolver / KinetDS and similar | empirical fitting (Higuchi, Korsmeyer–Peppas, Weibull) | free, popular | fit only, no prediction, no mechanism | TO RESEARCH (cite papers) |
| In-house Excel / MATLAB | — | free | not validated, not reusable | ASSUMPTION |

Message against empirical fitting: "A Korsmeyer–Peppas n tells you the curve's shape; GRM tells you which formulation variable to change."

## 3. Ideal customer profile (first 12 months) [ASSUMPTION]
1. Academic groups working on gelatin, collagen or other biopolymer microspheres/hydrogels for drug or growth-factor delivery.
2. Small biotech / university spin-offs with long-acting formulation projects.
3. CDMO feasibility teams (after PLGA module).

## 4. Positioning statement
For formulation scientists developing controlled-release microspheres who waste weeks on trial-and-error release studies, GRM Designer is a mechanistic formulation simulator that predicts release from independently measured inputs and shows which parameters control it. Unlike empirical fitting tools, every prediction is validated on held-out data and every input is traceable to its source.

## 5. Channels
- **Scientific credibility first:** publish the model paper; preprint (bioRxiv/ChemRxiv) + GitHub release with DOI (Zenodo).
- **Open-source core:** GitHub, pip package, examples notebook; "Cite GRM" section.
- **Content:** short posts/videos: "Why Fick fails for GA-gelatin" (V4), "Swelling does not matter (and why)" (W2), "Λ: one number to know if diffusion matters".
- **Communities:** LinkedIn (pharmaceutics, drug-delivery groups), ResearchGate, X/Twitter scientific community, Controlled Release Society (CRS) meetings, AAPS — conference posters. [TO RESEARCH: deadlines]
- **Direct outreach:** authors of the papers used in validation and of recent gelatin/PLGA microsphere papers — offer free simulation of their published data.
- **University/teaching:** offer simulator for drug-delivery courses.
- **Persian-language channel:** Iranian pharmaceutics and biomedical engineering departments, local pharma companies; Persian webinar.

## 6. 90-day plan
| Weeks | Product | Marketing | Evidence of progress |
|---|---|---|---|
| 1–2 | license decision, pip package, CI, Zenodo DOI | landing page (GitHub Pages) with simulator | page live, DOI minted |
| 3–4 | hosted simulator, report export | 3 technical posts; list of 50 target labs/companies | posts published, list ready |
| 5–8 | "bring your data" mode; T1 ionic strength | 15–20 customer-discovery interviews (script below); 2 "we modelled your paper" demos | interview notes, pain ranking |
| 9–10 | fix top 3 interview pains | preprint submitted; conference abstract | preprint link |
| 11–12 | pilot package (validation pack + report) | 3 pilot offers (academic or industry) | ≥ 1 pilot accepted |

## 7. Customer-discovery interview script (30 min)
1. Describe your last microsphere/hydrogel release project. How many iterations to reach the target profile?
2. How long does one release study take, and what does it cost (time, material, analytics)?
3. How do you model release today? What do you do with the fitted parameters?
4. Which variable do you find hardest to control: burst, t50, tail, batch variability?
5. Would a validated prediction before the experiment change what you test? What accuracy would you need?
6. Who decides on buying software in your group? Budget range for tools like DDDPlus/COMSOL?
7. What would make you trust a model's prediction (validation, publications, regulatory use)?
Record answers in a table; do not lead the interviewee.

## 8. Metrics
- Awareness: GitHub stars, page visits, simulator sessions.
- Activation: users who run a custom formulation; reports exported.
- Validation: interviews completed, % confirming the pain, willingness to pay.
- Revenue: pilots, conversion, annual contract value (after interviews).

## 9. Brand and messaging rules
- Never claim regulatory acceptance, clinical validity or accuracy beyond VALIDATION.md.
- Always show PARTIAL/FAIL cases — transparency is the brand.
- No customer logos or testimonials without written permission.



<!-- ===== 08_TASK_PROMPTS.md ===== -->

# FILE: 08_TASK_PROMPTS.md

# 08 — Copy-paste task prompts for ChatGPT

Send one at a time, after the master prompt (01). Replace nothing unless marked <…>.

---
## P0 — Orientation (first message after 01)
Read 01–07 and repo_snapshot/gelatin_release_model/README.md and AGENTS.md. Do not write code. Give me: (a) model summary in 10 lines, (b) the provenance rule in your words, (c) commands to reproduce results/VALIDATION.md, (d) your proposed first task and acceptance criteria, (e) files you could not open. Answer in Persian.

---
## P1 — Reproduce
Walk me through reproducing all numbers in results/VALIDATION.md on my computer (Windows/Linux). List expected output lines. If any number would differ, explain why before changing anything.

---
## P2 — Task T1 (ionic strength)
Do roadmap task T1. First, list literature sources (author, year, journal, DOI, figure) that measure drug binding or release from gelatin as a function of ionic strength — only sources you are sure exist; mark uncertain ones. Wait for my confirmation and the PDFs before implementing. Then implement on branch chatgpt/t1-ionic-strength as a unified diff, with tests, CHANGELOG, README. Show before/after validation table. No parameter may be fitted to Hu 2024.

---
## P3 — Task T2 (size distribution)
Do roadmap task T2 in grm/fast.py with a log-normal and a histogram option. Add a test that σ→0 reproduces the monodisperse curve within 1e-6. Re-run V3 using each paper's reported size range (state where the range comes from). Deliver a diff and the before/after table.

---
## P4 — Task T3 (degradation relation)
Build a literature table of gelatin mass loss vs GA %, crosslink degree, gelatin type and collagenase concentration (sources only you can verify; ask me for PDFs). Propose μ = μ0(enzyme)·h(crosslink degree), calibrate on mass-loss data only, check it reproduces Cheng μ(GA), and test on V1. Diff + table + provenance labels.

---
## P5 — Task T4 (burst predictor)
Design the dataset schema for burst (f_free) prediction and a physics-informed baseline (partition + surface layer 3δ/R). Evaluate with leave-one-paper-out. Report honestly if it fails.

---
## P6 — Engineering (T8)
Propose pyproject.toml, GitHub Actions CI (run_all + pytest on the branch), and a FastAPI service with /simulate and /weights including pydantic schemas and tests. Do not add a LICENSE file; list license options with pros/cons for an open-core business.

---
## P7 — ML (04_ML_PLAN.md)
Implement ml/dataset_schema.md and ml/evaluate.py with leave-one-paper-out evaluation, using physics baseline vs GP on log-parameters. Use only the existing 6 papers now; report that results are preliminary.

---
## P8 — PLGA module (T7)
I will upload Chen, Hu & Ouyang 2026 and other PLGA papers. Read them, summarise the governing equations with equation numbers, then propose grm/plga.py design. No code until I approve the design.

---
## P9 — Product
Using 05_PRODUCT_STRATEGY.md, write a one-page product brief and an MVP backlog (user stories with acceptance criteria) for the hosted simulator. Separate facts (with sources) from assumptions.

---
## P10 — Market research
Verify every market figure in 06_MARKETING_GTM.md with a second independent source; find: microsphere-based drug delivery market size, pharma modelling & simulation software market size, list prices or price ranges for DDDPlus/COMSOL academic licenses. Give URLs and access dates. Mark anything you cannot verify.

---
## P11 — Go-to-market
Build the list of 50 target labs/companies (public info only: group name, institution, recent relevant paper with DOI, why relevant). No personal emails or phone numbers. Then draft a respectful outreach message offering free simulation of their published data.

---
## P12 — Pitch deck outline
Outline a 12-slide deck (problem, insight Λ, validation, weights, product, market with sources, competition, business model, GTM, team, roadmap, ask). Every number with a source; validation numbers from results/VALIDATION.md only.

---
## P13 — Thesis Chapter 5 and paper
Draft Chapter 5 (discussion and conclusion) in Persian (B Nazanin, RTL, Persian digits) from 02_PROJECT_STATE.md and results, then an English paper outline. References must be real and verifiable; list any you are unsure of separately.

---
## P14 — Advisor's new comments on the literature review
I am attaching the advisor's commented Word file. Read 09_WRITING_STYLE_GUIDE.md and 10_LITERATURE_REVIEW_GUIDE.md. For every comment: (1) quote it, (2) say what you will change and with which reference, (3) produce the change as tracked changes in the same Word file (author "Saeedreza"), (4) draft a short Persian reply to each comment. Do not add our project results to the review. List any reference you are unsure exists.

---
## P15 — Continue the literature review (new GA papers)
Search for GA-crosslinked gelatin micro/nanoparticle release papers from 2020 onward that are not in the 85 references. For each: full citation with DOI, crosslinking conditions, drug, size, medium, the authors' mechanism interpretation (their words), fitted empirical model and parameters, and whether release data are digitisable. Give the table first; write the Persian text for §4-8 only after I approve the list.



# FILE: LINKS.txt

````text
GRM — Gelatin Release Model — links

Repository:  https://github.com/saeedreza6620/py.t
Branch:      modeling/gelatin-release-model-v1      (NEVER use main)
Folder:      modeling/gelatin_release_model/
Browse:      https://github.com/saeedreza6620/py.t/tree/modeling/gelatin-release-model-v1/modeling/gelatin_release_model
Commit at hand-off: 0e30a0c  (version 1.1.0)

Clone & run:
  git clone -b modeling/gelatin-release-model-v1 https://github.com/saeedreza6620/py.t
  cd py.t/modeling/gelatin_release_model
  pip install -r requirements.txt
  python validation/run_all.py
  python -m pytest -q

Offline simulator: simulator/GRM_simulator_v1.1.html (open in any browser)

Market / competitor sources used in 06_MARKETING_GTM.md:
  https://www.mordorintelligence.com/industry-reports/long-acting-injectables-market
  https://www.simulations-plus.com/software/dddplus/
  https://www.businesswire.com/news/home/20180115005279/en/4266611/PSE-Releases-Major-gPROMS-FormulatedProducts-Update

````


# FILE: repo/README.md

````markdown
# Gelatin Release Model (GRM) — drug release from glutaraldehyde-crosslinked gelatin spheres

**Version 1.0.0 · 2026-11-11 · Author: Saeedreza Barzkar (MSc thesis project), with AI assistance (Claude)**

A mechanistic, *no-fit-to-the-test-curve* model of drug release from crosslinked gelatin microspheres, verified
against analytical solutions and validated on four published data sets. It is written so that a person or another AI
can continue the work — including a machine-learning layer — without re-deriving anything.

<div dir="rtl">

**خلاصه فارسی.** این مخزن مدل ریاضی رهایش دارو از میکروسفر ژلاتین کراس‌لینک‌شده با گلوتارآلدئید است. دارو در ذره به چند «بخش» تقسیم می‌شود:
آزاد (فوراً متحرک)، متصلِ ضعیف (جداشدن برگشت‌پذیر با ثابت مرتبه اول) و متصل به شبکه (آزادشدن با تخریب شبکه).
داروی متحرک با قانون فیک از کره خارج می‌شود. حل عددی با حل تحلیلی Crank صحت‌سنجی شده (خطا کمتر از ۰٫۰۲ واحد درصد) و مدل روی
داده چهار مقاله آزموده شده است. نتیجه اصلی: پیش‌بینی غلظت‌های GA که در هیچ پارامتری به کار نرفته‌اند با خطای ۲٫۴ و ۴٫۰ واحد درصد (Cheng)،
پیش‌بینی اثر اندازه ذره با خطای ۳٫۶ تا ۵٫۷ (Mladenovska)، و انتقال پارامتر از یک مقاله به مقاله دیگر با خطای ۹٫۴ پس از روز اول (Chang→Hu، قبول ناقص).
قانون فیک به‌تنهایی با ضریب نفوذ مستقل شکست می‌خورد (Saravanan، اختلاف بیش از شش مرتبه بزرگی). کدام پارامتر طراحی مهم است به عدد
Λ = μ·R²/(π²D) بستگی دارد. برای توسعه با یادگیری ماشین، ML باید پارامترهای فیزیکی مدل را از مشخصات فرمولاسیون پیش‌بینی کند، نه خود منحنی را.

</div>

---

## Contents
1. [Quick start](#1-quick-start)
2. [The model](#2-the-model)
3. [Where glutaraldehyde enters](#3-where-glutaraldehyde-enters)
4. [Parameter provenance rules](#4-parameter-provenance-rules)
5. [Verification and validation results](#5-verification-and-validation-results)
6. [Parameter weights and the regime number Λ](#6-parameter-weights-and-the-regime-number-λ)
7. [Data](#7-data)
8. [Repository map](#8-repository-map)
9. [Extending with machine learning](#9-extending-with-machine-learning)
10. [Known limitations and next steps](#10-known-limitations-and-next-steps)
11. [Rules for whoever continues (human or AI)](#11-rules-for-whoever-continues-human-or-ai)
12. [References](#12-references)

---

## 1. Quick start

```bash
pip install -r requirements.txt            # numpy, scipy, pandas, matplotlib, pytest (pdfplumber only for tools/)
python validation/run_all.py               # ~30 s: re-runs every test, writes results/*.json, results/VALIDATION.md, figures/*.png
python -m pytest -q                        # 11 tests: mathematics + pinned validation numbers
python ml/build_training_table.py          # writes ml/formulations.csv and ml/curves_long.csv
python simulator/build_simulator.py        # rebuilds simulator/grm_simulator.html from data/ and results/
```

**Interactive simulator:** open `simulator/grm_simulator.html` in any browser (one self-contained file, no internet needed).
Same equations as `grm/model.py`; presets reproduce the validation cases (Cheng RMSE 2.4/2.9/4.0, Hu 12.4, Mladenovska A 6.5) with the data points;
weights of ALL parameters (Fick, swelling, crosslink/binding, degradation, other) as local elasticities on any output, the time-resolved weight of each mechanism, and the global Sobol weights of §6.1 update live, together with the regime number Λ; curves can be pinned for comparison and exported as CSV/PNG; settings save to JSON.

Minimal use:

```python
import numpy as np
from grm import Particle, Pool, Liberation, release, D_cheng, mu_cheng, DAY

ga = 0.375                                              # % v/v glutaraldehyde
p = Particle(pools=[Pool(0.47, name="free"),            # mobile from t = 0
                    Pool(0.53, Liberation("first_order", rate=mu_cheng(ga)), "bound")],   # freed by enzymatic degradation
             R_cm=50e-4, D_cm2s=D_cheng(ga))            # Fick exit from a 100 µm sphere
t = np.array([1, 3, 6, 12]) * DAY
print(100 * release(t, p))                              # cumulative release, %
```

Python ≥ 3.10. Tested with Python 3.13, NumPy 2.5, SciPy 1.18, pandas 2.x, Matplotlib 3.11.

---

## 2. The model

### 2.1 Pools and liberation laws
The drug in one particle is split into pools. Pool *i* holds mass fraction *fᵢ* and has a **liberation law** *Lᵢ(s)*:
the fraction of that pool that has become mobile by time *s* (0 → 1).

| Pool | Symbol | Liberation law *L(s)* | Physical meaning |
|---|---|---|---|
| free | *f_free* | 1 for *s* ≥ 0 | dissolved / unbound drug, mobile from the start |
| weak | *f_weak* | 1 − exp(−*k_weak* *s*) | reversible (ionic, hydrogen-bond) binding; first-order desorption |
| bound | *f_bound* | 1 − exp(−μ *s*) **or** (1 − *g*(*s*)) / (1 − *g*(∞)) | polyion complex / entrapment, freed only when the network is degraded; μ = first-order enzymatic rate; *g* = **measured** mass fraction remaining |
| irreversible | *f_irr* | 0 | not released within the experiment (plateau < 100 %) |

*f_free + f_weak + f_bound + f_irr = 1* (checked by `Particle.check()`).

### 2.2 Exit kernel
Mobile drug leaves the particle through an exit kernel *K(t)*:

* **Fick (default)** — sphere of radius *R*, uniform load, perfect sink (Crank 1975, Eq. 6.20):

  *K(t) = Φ(Dt/R²)*,  Φ(τ) = 1 − (6/π²) Σₙ exp(−n²π²τ)/n²

* **first-order** — *K(t) = 1 − exp(−t/τ_exit)*; used when a large protein leaves through an eroding front rather than by diffusion (V3).

### 2.3 Release
<pre>
F(t) = Σᵢ fᵢ ∫₀ᵗ K(t − s) dLᵢ(s)                                                     (1)
</pre>

With the Fick kernel, Eq. (1) is the **exact** solution of the linear PDE

<pre>
∂C/∂t = (1/r²) ∂/∂r (D r² ∂C/∂r) + C₀ Σᵢ fᵢ dLᵢ/dt,   ∂C/∂r(0,t) = 0,  C(R,t) = 0,  C(r,0) = f_free C₀     (2)
</pre>

because the source is spatially uniform (Duhamel superposition). This identity is checked numerically in V0 (difference ≤ 0.018 %-points).

### 2.4 Assumptions (all explicit)
1. Spherical particles, one radius per formulation (mean reported in the paper). Size distribution is not yet integrated (see §10).
2. Perfect sink at the surface; no external boundary layer.
3. Freshly liberated drug is uniformly distributed in the sphere (needed for the superposition to be exact).
4. *D* constant in time (swelling is assumed complete before release starts; for GA spheres hydration takes seconds–minutes).
5. Pools do not exchange except through their liberation law (weak drug does not re-bind).

### 2.5 Numerics
* Φ: eigen-series with a rigorous tail bound (tolerance 1e-13) for τ ≥ 0.01, short-time image series below (`grm/fick.py`).
* Eq. (1): Stieltjes sum on 1600 cosine-clustered nodes per output time (`grm/model.py::_pool_release`).
* Reference PDE solver: cell-centred finite volumes on spherical shells (exact shell volumes/areas), surface-graded mesh
  *x_f = 1 − (1 − i/N)²*, Crank–Nicolson with Rannacher start-up (`grm/fick.py::SphereFVM`) and backward Euler with source (`grm/model.py::release_pde`).
* Mesh-independence (thesis Chapter 3): graded *N* = 80 changes every monitored quantity by < 0.1 % when *N* is doubled; observed order 2.0; GCI ≤ 0.13 %.

---

## 3. Where glutaraldehyde enters

GA crosslinks the ε-amino groups of lysine/hydroxylysine (Schiff base → stabilised adducts). In the model it acts through four routes:

| Route | Effect of more GA | Model parameter | Quantitative relation available | Source |
|---|---|---|---|---|
| network density | slightly slower diffusion | *D* | *D* = 7.5132·[GA]^−0.2281 ×10⁻⁴ µm²/s (0.125–0.875 % v/v) — only **1.5×** over a 7× GA range | Cheng 2010, Fig. 2.6B |
| enzymatic degradation | slower, saturating | μ | μ = 0.36 (1 + **10** e^(−14.29·GA)) d⁻¹ | Cheng 2010, Eq. 2.12 (printed coefficient 0.1 is a typo; 10 reproduces the stated μ = 1, 0.38, 0.36) |
| charge / amine consumption | fewer binding sites for anionic drugs, more negative ζ (+4 → −7 mV) | *f_free*, *f_weak* | none yet (measured per formulation) | Cheng 2010, Fig. 2.4 |
| crosslink degree vs mass loss | slower hydrolytic mass loss | *g(t)* | measured curves only (Chang 2023, Hu 2024, Mladenovska 2002) | — |

Main consequence (V4 and the regime map): for small drugs in 10–50 µm GA spheres, diffusion is **never** the slow step
(τ_D ≈ 0.02–0.2 s with an independent *D*); the release time is set by binding/desorption and degradation. Diffusion matters
only for large swollen spheres with strongly hindered diffusion (Cheng: τ_D ≈ 3 days).

---

## 4. Parameter provenance rules

The central rule of this project: **no parameter is fitted to the curve it is tested on.** Every parameter is one of

| Label | Meaning | Allowed in a validation? |
|---|---|---|
| `MEASURED` | reported in the same paper (R, mass loss *g(t)*, loading) | yes |
| `PUBLISHED_RELATION` | a correlation from the literature (Wilke–Chang, Mackie–Meares, Cheng's D(GA), μ(GA)) | yes |
| `CALIBRATED_SEPARATE` | fitted on a *different experiment* than the test (e.g. *f_free* from the no-enzyme curve, τ_exit from one size) | yes, and it must be stated |
| `TRANSFERRED` | taken from a different paper (Chang → Hu) | yes |
| `DIAGNOSTIC_FIT` | fitted on the test curve itself | **never counts as validation**; reported only to size a missing mechanism |

Each validation script states its information flow in its docstring.

---

## 5. Verification and validation results

Generated by `python validation/run_all.py` (the table below is copied from `results/VALIDATION.md`).

| ID | Case | Type of test | Inputs (none fitted to the test curve) | Result | Verdict |
|---|---|---|---|---|---|
| V0 | code verification | FVM vs Crank series; Eq. (1) vs PDE | none (mathematics) | FVM error 0.011 %-pts at N = 80 (2nd order); Eq. (1) vs PDE ≤ 0.018 %-pts | PASS |
| V1 | Cheng 2010, GA 0.25 % & 0.625 % | GA level never used for any parameter | *f_free* from PBS curves; D(GA), μ(GA) published | RMSE 2.44 and 3.98 %-pts; 8 of 11 points inside error bars | **PASS (prediction)** |
| V1b | Cheng 2010, GA 0.125/0.375/0.875 % | same curves Cheng used for μ(GA) | as above | RMSE 3.92 / 2.94 / 3.86 %-pts | PASS (consistency only) |
| V2 | Hu 2024 from Chang 2023 | different paper, same chemistry, no tuning on Hu | *f_free* and desorption rate from Chang; Hu's own mass loss | RMSE after day 1: 9.4; first 8 h: 33.0 (free pool instant) → 17.7 (Chang desorption rate) | **PARTIAL** |
| V3 | Mladenovska 2002, six sizes | sizes B–F predicted from size A | measured mass loss; τ_exit from size A, ∝ diameter | RMSE 3.6–5.7 %-pts (release = mass loss without exit step: 22–31) | **PASS (prediction)** |
| V4 | Saravanan 2011 (negative control) | Fick with independent D | Wilke–Chang × Mackie–Meares | t50 predicted < 0.1 s vs observed 5.2–23.0 d (ratio ≥ 6.2e+06) | FAILS AS EXPECTED |

### V1 — Cheng 2010 (primary validation)
![V1](figures/V1_cheng2010.png)
GA-crosslinked basic gelatin (IEP 9), monodisperse 100 µm swollen spheres, trypan blue (acidic dye), PBS ± collagenase 373 ng/ml.
Data were **vector-extracted** from the dissertation PDF (`tools/digitize_cheng2010.py`; marker centres from the drawing commands, axes from tick marks).
*f_free* (0.517 / 0.467 / 0.550) is calibrated on the 3-day no-enzyme curves only; the five enzyme curves are then predicted.
GA 0.25 % and 0.625 % were not used by Cheng or by us for any parameter. *f_free* at those levels is interpolated; the shaded band shows the full range of *f_free*.

### V2 — cross-paper transfer, Chang 2023 → Hu 2024 (partial pass)
![V2](figures/V2_hu2024_from_chang2023.png)
From day 1 onward the prediction is good (RMSE 9.4 %-pts, 24 h level 83 vs 84 %). The first 8 h are not: with an instantaneous free pool RMSE = 33;
with the desorption rate measured in Chang's PBS data (t½ = 0.72 h, **transferred**, not fitted) RMSE = 17.7; a diagnostic fit on Hu gives t½ = 1.8 h.
Hu released into **deionised water**, Chang into **PBS**: ionic desorption of cationic gentamicin from anionic type-B gelatin is expected to be slower without
counter-ions. This is the main open mechanism (§10). The last two Hu points (days 28–32) are a background-subtraction artefact (drug-free background rises).

### V3 — size effect in an enzymatic medium (Mladenovska 2002)
![V3](figures/V3_mladenovska2002.png)
BSA (66 kDa) is treated as fully network-bound (*f_free* = 0). Liberation follows the measured mass loss of drug-free spheres of the same series.
A Fick exit with any plausible BSA diffusivity empties a 3.5 µm sphere in seconds, so exit is first order with τ_exit calibrated on the largest size and
scaled ∝ diameter (constant front speed 0.62 µm/h). The free per-size fit gives τ ∝ d^0.90, consistent with the hypothesis.

### V4 — negative control (Saravanan 2011)
![V4](figures/V4_saravanan2011.png)
Fick with an independent *D* (Wilke–Chang 7.4×10⁻⁶ cm²/s × Mackie–Meares) predicts 50 % release in 0.02–0.07 s; observed t50 is 5.2–23 days.
An apparent *D* fitted to the data (diagnostic) is 5×10⁻¹⁴–3.5×10⁻¹³ cm²/s, i.e. 10⁷–10⁸ below the physical value: the "Fickian" label in the original paper
(Higuchi best, n ≈ 0.4–0.5) describes curve shape, not mechanism. The full model cannot be tested on this paper because no mass-loss or binding data were reported.

### V0 — verification
![V0](figures/V0_superposition_vs_pde.png)

---

## 6. Parameter weights and the regime number Λ

![weights](figures/W1_parameter_weights.png)

Elasticities *E = ∂ln(output)/∂ln(parameter)* (central difference ±10 %), `validation/w1_parameter_weights.py`:

| Cheng, GA 0.375 % | radius R | diffusivity D | free fraction | degradation μ | GA % (via D and μ) |
|---|---|---|---|---|---|
| F(1 day) | −0.82 | +0.41 | +0.61 | +0.18 | −0.14 |
| t50 | **+1.20** | −0.60 | −0.62 | −0.40 | +0.23 |
| t90 | +1.15 | −0.57 | −0.22 | −0.43 | +0.24 |

In the Hu regime (16 µm, gentamicin) *R* and *D* have **zero** weight; the release is controlled by the first-phase fraction (F(1 d) elasticity 1.0),
the desorption rate (F(1 h) 0.59) and the degradation time scale (t95 −1.0).

**General result (panel c).** Which design parameter matters is set by one dimensionless number

<pre>
Λ = μ · R²/(π² D)  =  diffusion time / liberation time
</pre>

* Λ ≪ 0.1 (small spheres, small drugs — most GA microspheres): t50 depends on μ (elasticity −1) and the free fraction; *R* and *D* do nothing.
* Λ ≫ 10 (large, strongly hindered spheres): t50 ∝ R²/D (elasticities +2 and −1); degradation does nothing.
* Cheng sits at Λ ≈ 1.2 (mixed): everything matters. Hu sits at Λ ≈ 10⁻⁸.

This is the key design rule and the most important feature for any data-driven extension (§9).

### 6.1 All parameters: Fick → swelling → crosslinking / binding → degradation → other

`validation/w2_all_parameters.py`, model `grm/fast.py` (closed form of Eq. (1) with a hydration gate; verified against the PDE in `tests/test_fast.py`).
Every *primitive* parameter a formulator can change is mapped into the model:

| Stage | Primitive parameter | How it enters |
|---|---|---|
| Fick | dry radius *R_dry*; drug size (MW) | *R = R_dry Q^(1/3)*; *D_w* by Stokes–Einstein from MW |
| swelling | volume swelling ratio *Q*; collective gel diffusivity *D_coop* | polymer fraction 1/*Q* in Mackie–Meares; hydration time *τ_sw = R²/(π² D_coop)* (Tanaka & Fillmore 1979) gates every pool |
| crosslink / binding | fast reversible binding *K_b*; free fraction; share of weakly bound drug; desorption half-life; (GA % through Cheng's relations) | *D_eff = D_w MM(1/Q)/(1+K_b)*; pool sizes; first-order desorption |
| degradation | degradation half-life (or enzyme level, or the measured mass-loss curve) | first-order liberation of network-bound drug |
| other | non-releasable fraction | plateau below 100 % |

**(1) Global weights** — total Sobol index *S_T* (share of output variance incl. interactions; Saltelli/Jansen estimators, 1024 scrambled-Sobol base samples, 200 bootstrap resamples) over two design regimes:
regime **A** = GA microspheres 5–50 µm, small drug, buffer (Saravanan/Chang/Hu/Liu type); regime **B** = large swollen spheres with strongly hindered diffusion and enzyme (Cheng type). Ranges are in the script and in `results/w2_all_parameters.json`.

| Stage | Parameter | A: t50 | A: release 1 d | A: t90 | B: t50 | B: release 1 d |
|---|---|---|---|---|---|---|
| Fick | dry radius R_dry | 0.01 | 0.00 | 0.00 | 0.04 | 0.04 |
| Fick | drug size MW | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |
| swelling | swelling ratio Q | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |
| swelling | gel network diffusivity D_coop (hydration time) | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |
| crosslink / binding | fast reversible binding 1+K_b | 0.01 | 0.00 | 0.00 | **0.90** | **0.90** |
| crosslink / binding | free fraction | **0.84** | **0.47** | **0.13** | 0.07 | 0.03 |
| crosslink / binding | share of weakly bound drug | **0.20** | **0.53** | **0.26** | 0.02 | 0.02 |
| crosslink / binding | desorption half-life | 0.09 | 0.04 | 0.04 | 0.01 | 0.00 |
| degradation | degradation half-life | 0.01 | 0.02 | 0.07 | 0.01 | 0.04 |
| other | non-releasable fraction | 0.04 | 0.06 | **0.85** | 0.00 | 0.00 |

In regime A the release at 7 days is shared by weakly bound share 0.44, free fraction 0.32, degradation half-life 0.30 and non-releasable fraction 0.12 (t90 is dominated by the non-releasable fraction because 90 % is often never reached).

![global weights](figures/W2_global_weights.png)

Regime **C** = Cheng's own design variables (GA 0.125–0.875 %, swollen radius 25–75 µm, enzyme ×0.25–4, free fraction 0.3–0.7):

| Cheng design variable | t50 | release 7 d |
|---|---|---|
| R_dry | 0.54 | 0.41 |
| enzyme | 0.27 | 0.50 |
| f_free | 0.15 | 0.06 |
| GA | 0.07 | 0.08 |

**(2) Local elasticities** at the validated Cheng point (Q = 6 and D_coop = 10⁻⁷ cm²/s assumed; K_b set so that D_eff equals Cheng's fitted D, i.e. 1+K_b ≈ 1.6×10⁵):

| Parameter (Cheng, GA 0.375 %) | t50 | release 1 h | release 1 d |
|---|---|---|---|
| dry radius R_dry | +1.20 | -0.97 | -0.82 |
| drug size MW | +0.20 | -0.16 | -0.14 |
| swelling ratio Q | -0.01 | +0.01 | +0.01 |
| gel network diffusivity D_coop (hydration time) | -0.00 | +0.00 | +0.00 |
| fast reversible binding 1+K_b | +0.60 | -0.48 | -0.41 |
| free fraction | -0.62 | +0.98 | +0.61 |
| degradation half-life | +0.40 | -0.01 | -0.18 |

**(3) Which mechanism controls at each moment** (degree of rate control on the four rates):

![mechanism weights](figures/W2_mechanism_weights_time.png)

**Answer to "which parameters control release, and how much".**
1. **Swelling (Q, hydration time) has ~zero weight in every regime.** Hydration takes seconds to a minute (τ_sw ≈ 0.3–25 s for swollen diameters of 10–100 µm with D_coop ≈ 10⁻⁷ cm²/s, an assumed typical value), and the swelling ratio cancels in the diffusion time: t_D ∝ R²/D ∝ Q^(2/3)/MM(1/Q), whose elasticity 2/3 − 4Q/(Q²−1) is zero at Q = 3+√10 ≈ 6.2 and small for 3 < Q < 15. Swelling matters only for tightly crosslinked gels (Q < 2.5) in the diffusion-limited regime.
2. **Fick parameters (radius, drug size) matter only when diffusion is the slow step (Λ ≳ 0.1).** In regime A their weight is ≈ 0; in Cheng's system the radius is the largest single weight (S_T 0.54 for t50).
3. **Crosslinking acts through binding, not through mesh size.** In regime A the free fraction (S_T 0.84 for t50) and the weakly bound share decide the burst and t50; in regime B the fast binding constant K_b (S_T 0.90) decides everything, because it is what slows diffusion by five orders of magnitude. GA concentration itself, through Cheng's relations, carries only S_T 0.07 — its effect saturates above ~0.375 %.
4. **Degradation controls the tail** (release after a week, t90): S_T 0.30 for release at 7 days in regime A, 0.50 for Cheng; and in enzyme media it is the second lever after size.

---

## 7. Data

All files in `data/`. Every number has a source (figure/page) and an evidence label. No PDF is included (copyright).

| File | Content | Evidence |
|---|---|---|
| `cheng2010_release_vector.csv` | Cheng 2010 Figs 2.6A, 2.7, 2.8: 57 markers with error-bar half-heights | `VECTOR_EXTRACTED` (marker centres from PDF drawing commands; triangle centroid corrected) |
| `saravanan2011_fig6_vector.csv` | Saravanan 2011 Fig. 6, three loadings, SE bars | `VECTOR_EXTRACTED` |
| `release_dataset_audited.csv` | audited points of 8 papers (Jin 2023, Saravanan 2011, Kodra 2026, Zhang 2023, Chang 2023, Hu 2024, Lan 2017, Liu 2022) with include/exclude flags and reasons | `DIRECT_FIGURE_DATA_LABEL`, `VECTOR_EXTRACTED`, `DIGITIZED_AUTO`, `DIGITIZED_VISUAL` |
| `mladenovska2002_digitized.csv` | release and blank-sphere mass remaining, six sizes | `DIGITIZED_RASTER` (400 dpi, ±1–2 %) |
| `hu2024_mass_remaining.csv` | mass remaining of drug-free m-Em in water (Fig. 3) | `DIGITIZED_RASTER` (±2 %) |
| `chang2023_mass_loss_regressions.csv` | linear weight-loss regressions printed in Chang 2023 Sec. 3.4 | `DIRECT_PROSE` |

**Adding a paper (checklist).**
1. Extract the release curve with the best available method (printed numbers > vector extraction > raster digitization); record figure, page, evidence label, uncertainty.
2. Record every formulation descriptor in `ml/build_training_table.py` (leave unknowns empty — never guess).
3. Record the independent measurements the model can use: radius (and its basis: dry/swollen), mass loss *g(t)*, swelling, binding/EE, release in a non-degrading medium.
4. Write `validation/vN_<paper>.py` with a docstring stating the information flow (§4) and add it to `run_all.py`.
5. If the paper lacks the inputs the model needs, report it as *not testable* (like V4) — do not fit.

---

## 8. Repository map

```
grm/                       the model (import grm)
  fick.py                  Crank series with tail bound, short-time series, profiles, spherical FVM (CN + Rannacher)
  model.py                 pools, liberation laws, exit kernels, release() = Eq. (1), release_pde() = Eq. (2)
  correlations.py          Wilke–Chang, Le Bas volumes, Mackie–Meares, Stokes–Einstein, Cheng D(GA) and μ(GA), drug table
  analysis.py              RMSE, R², t_x, elasticities, degree of rate control
  fast.py                  closed-form Eq. (1) with hydration gate and primitive parameters (R_dry, MW, Q, D_coop, K_b, ...) — vectorised
validation/                one script per test; run_all.py regenerates results/ and figures/
data/                      extracted data with provenance (see §7)
results/                   JSON outputs + VALIDATION.md (auto-generated)
figures/                   PNG figures (auto-generated)
ml/                        build_training_table.py -> formulations.csv, curves_long.csv
simulator/                 template.html + build_simulator.py -> grm_simulator.html (offline, single file)
tools/digitize_cheng2010.py  vector extraction from the dissertation PDF (needs pdfplumber and the PDF)
tests/test_model.py        pytest: mathematics + pinned validation numbers
AGENTS.md                  short operating rules for an AI agent continuing this repository
CHANGELOG.md
```

The older exploratory work (Abdekhodaie ion-exchange model, Kodra degradation DOE, design maps, decks, Word reports) lives in the sibling folders of
`modeling/` on this branch and on `backup/modeling-2026-11-08`. GRM is the consolidated, tested version.

---

## 9. Extending with machine learning

### 9.1 Architecture: ML predicts parameters, physics predicts curves
```
formulation descriptors X  ──ML──►  physical parameters θ = (f_free, f_weak, k_weak, μ or g(t) time scale, D, τ_exit, f_irr)
                                        │
                                        ▼
                               grm.release(t, θ, R)  ──►  release curve F(t)
```
Why not learn curves directly: the audited gelatin data hold only a few dozen formulations with usable curves (21 in `data/release_dataset_audited.csv`, 14 more in the Cheng and Mladenovska files); a curve-to-curve
model would interpolate shapes without physics and could not extrapolate in size, time or medium. θ has 5–7 numbers with physical bounds,
and the validated model guarantees mass balance, monotonicity and correct size scaling (Λ).

### 9.2 Inputs (X) — already laid out in `ml/formulations.csv`
crosslinker type · crosslinker concentration and unit · crosslink time and temperature · crosslink mode (in-situ / post) · degree of crosslinking (TNBS/ninhydrin) ·
gelatin type (A/B), IEP, Bloom, concentration · fabrication method · radius and its basis (dry/swollen) · drug MW, net charge at release pH, log P, pKa ·
loading method (incorporated / soaked) and loading % · release medium (buffer / water / enzyme and concentration / ionic strength) · temperature.
Derived features that carry physics: **Λ**, charge product (drug charge × gelatin net charge at pH 7.4), Le Bas volume, free-solution *D_w*.

### 9.3 Targets (Y) and how to obtain them per paper
| Target | Best independent measurement | Fallback |
|---|---|---|
| *f_free* | release in a non-degrading medium (plateau), or wash-out | first release plateau |
| *f_weak*, *k_weak* | release vs ionic strength; early time points (< 2 h) | — (missing in most papers) |
| μ or *g(t)* | mass loss of drug-free particles in the same medium | degree of crosslinking → μ relation (to be built) |
| *D* | measured diffusivity; else Wilke–Chang × Mackie–Meares | — |
| *f_irr* | final plateau below 100 % | — |

### 9.4 Rules for the ML layer
1. **Split by paper** (`split_group` column), never by point or by formulation: points of one paper share lab, assay and normalisation.
2. Report error on held-out papers in %-points of release *after* passing θ̂ through `grm.release`, not only error on θ.
3. Keep the provenance label of every target; train first on `MEASURED`/`PUBLISHED_RELATION` targets.
4. Use bounded outputs (sigmoid for fractions, log for rates) and propagate uncertainty (ensembles or Gaussian processes; the data set is small).
5. Use Λ to stratify: a model trained only on Λ ≪ 1 data must not be used for Λ ≫ 1 formulations.
6. Recommended first model: Gaussian-process or gradient-boosted regression of log μ and logit *f_free* on (crosslinker, concentration, crosslink degree, gelatin type, drug charge product, medium). Then active learning: the experiment with the largest predictive variance on t50 is the next one to run.

### 9.5 Data the ML layer needs most (in order)
1. mass loss of drug-free spheres for every formulation (gives μ or *g(t)* directly);
2. release in buffer **and** in enzyme for the same spheres (separates *f_free* from the degradation pool, as Cheng did);
3. early sampling (5 min – 2 h) at two ionic strengths (gives *k_weak*);
4. swollen radius distribution, not only dry mean.

---

## 10. Known limitations and next steps

| # | Limitation | Consequence | Next step |
|---|---|---|---|
| 1 | *D*(GA) and μ(GA) relations exist only for Cheng's system (basic gelatin, acidic dye, collagenase 373 ng/ml) | cannot be transferred to other gelatins/drugs/enzyme levels as is | build μ(crosslink degree, enzyme) from more papers; Cheng notes μ ∝ [enzyme] (or ²) |
| 2 | no predictive relation for *f_free* from gelatin type, GA/gelatin ratio and loading | *f_free* must be measured | collect buffer-only release data; model charge balance (Abdekhodaie & Wu 2006 ion-exchange framework is in `../02_abdekhodaie2006`) |
| 3 | desorption rate depends on the medium (PBS vs water) | V2 early-hour error | add an ionic-strength-dependent *k_weak* (ion-exchange kinetics) and test on a paper with two media |
| 4 | single radius per formulation | broad size distributions (Saravanan 1–60 µm) are smeared | integrate F over the number/volume size distribution (straightforward, Eq. (1) is linear) |
| 5 | Cheng's *f_free* at 0.25/0.625 % is interpolated | small extra uncertainty in V1 | shown as a band in Fig. V1 |
| 6 | Mladenovska and Hu inputs are raster-digitized (±1–2 %) | small | redo with vector extraction if the PDFs are vector |
| 7 | swelling kinetics not in the model (assumed instantaneous) | could matter for dry-loaded large spheres in the first minutes | the swelling/hydration solver exists in `../04_gelatin_routes` |

---

## 11. Rules for whoever continues (human or AI)

See `AGENTS.md`. In short:
* Never fit *D* (or any parameter) to the curve that is used to judge the model. Fits are allowed only as labelled diagnostics.
* Every new number gets a source (paper, figure, page) and an evidence label.
* After any change: `python validation/run_all.py && python -m pytest -q`; if a validation number moves, update this README and `CHANGELOG.md`.
* Report failures as failures (V2 is "partial", V4 "fails as expected"). A model that passes everything is not credible with these data.
* Work on a branch; do not push to `main` of this repository (it is a separate web-app project).

---

## 12. References
1. Crank J. *The Mathematics of Diffusion*, 2nd ed. Oxford University Press, 1975.
2. Cheng F. *Study of drug delivery and cell encapsulation using biocompatible hydrogel.* PhD dissertation, University of Illinois at Urbana-Champaign, 2010, Ch. 2. (Published as Cheng F. et al., Int. J. Pharm. 403 (2011) 90–95.)
3. Chang K.-C. et al. Polymers 15 (2023) 1504. doi:10.3390/polym15061504
4. Hu M.-H. et al. Materials 17 (2024) 3578. doi:10.3390/ma17143578
5. Mladenovska K. et al. Biodegradation and drug release studies of BSA loaded gelatin microspheres. Int. J. Pharm. 242 (2002) 247.
6. Saravanan M. et al. J. Drug Target. 19 (2011) 96–103. doi:10.3109/10611861003733979
7. Wilke C.R., Chang P. AIChE J. 1 (1955) 264–270.
8. Mackie J.S., Meares P. Proc. R. Soc. Lond. A 232 (1955) 498–509.
9. Poling B.E., Prausnitz J.M., O'Connell J.P. *The Properties of Gases and Liquids*, 5th ed. McGraw-Hill, 2001 (Le Bas volumes).
10. Campbell C.T. J. Catal. 204 (2001) 520–524 (degree of rate control).
11. Celik I.B. et al. J. Fluids Eng. 130 (2008) 078001 (grid convergence index).
12. Rannacher R. Numer. Math. 43 (1984) 309–327.
13. Abdekhodaie M.J., Wu X.Y. Biomaterials 27 (2006) 3652–3662.
14. Siepmann J., Peppas N.A. Int. J. Pharm. 418 (2011) 6–12 (Higuchi: derivation, use and misuse).

````


# FILE: repo/AGENTS.md

````markdown
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

````


# FILE: repo/CHANGELOG.md

````markdown
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

````


# FILE: repo/results/VALIDATION.md

````markdown
# Validation summary (auto-generated by validation/run_all.py — do not edit by hand)

| ID | Case | Type of test | Inputs (none fitted to the test curve) | Result | Verdict |
|---|---|---|---|---|---|
| V0 | code verification | FVM vs Crank series; Eq. (1) vs PDE | none (mathematics) | FVM error 0.011 %-pts at N = 80 (2nd order); Eq. (1) vs PDE ≤ 0.018 %-pts | PASS |
| V1 | Cheng 2010, GA 0.25 % & 0.625 % | GA level never used for any parameter | f_free from PBS curves; D(GA), μ(GA) published | RMSE 2.44 and 3.98 %-pts; 8 of 11 points inside error bars | PASS (prediction) |
| V1b | Cheng 2010, GA 0.125/0.375/0.875 % | same curves Cheng used for μ(GA) | as above | RMSE 3.92 / 2.94 / 3.86 %-pts | PASS (consistency only) |
| V2 | Hu 2024 from Chang 2023 | different paper, same chemistry, no tuning on Hu | f_free and desorption rate from Chang; Hu's own mass loss | RMSE after day 1: 9.4; first 8 h: 33.0 (free pool instant) → 17.7 (Chang desorption rate) | PARTIAL |
| V3 | Mladenovska 2002, six sizes | sizes B–F predicted from size A | measured mass loss; τ_exit from size A, ∝ diameter | RMSE 3.6–5.7 %-pts (release = mass loss without exit step: 22–31) | PASS (prediction) |
| V4 | Saravanan 2011 (negative control) | Fick with independent D | Wilke–Chang × Mackie–Meares | t50 predicted < 0.1 s vs observed 5.2–23.0 d (ratio ≥ 6.2e+06) | FAILS AS EXPECTED |

Regime number Λ = μ·R²/(π²D): Cheng GA 0.375 % → 1.18 (mixed); Hu 2024 → ~7e-09 (diffusion is never limiting).

Elasticities of t50 (Cheng, GA 0.375 %): R +1.20, D -0.60, f_free -0.62, mu -0.40, GA +0.23

Global weights (total Sobol index of log t50, W2): A: f_free 0.84, w_weak 0.20, t_weak_h 0.09; B: K_b 0.90, f_free 0.07, R_dry 0.04; C: R_dry 0.54, enzyme 0.27, f_free 0.15

````


# FILE: repo/results/summary.json

````json
{
 "version": "1.0.0",
 "rows": [
  {
   "id": "V0",
   "case": "code verification",
   "type": "FVM vs Crank series; Eq. (1) vs PDE",
   "inputs": "none (mathematics)",
   "result": "FVM error 0.011 %-pts at N = 80 (2nd order); Eq. (1) vs PDE ≤ 0.018 %-pts",
   "verdict": "PASS"
  },
  {
   "id": "V1",
   "case": "Cheng 2010, GA 0.25 % & 0.625 %",
   "type": "GA level never used for any parameter",
   "inputs": "f_free from PBS curves; D(GA), μ(GA) published",
   "result": "RMSE 2.44 and 3.98 %-pts; 8 of 11 points inside error bars",
   "verdict": "PASS (prediction)"
  },
  {
   "id": "V1b",
   "case": "Cheng 2010, GA 0.125/0.375/0.875 %",
   "type": "same curves Cheng used for μ(GA)",
   "inputs": "as above",
   "result": "RMSE 3.92 / 2.94 / 3.86 %-pts",
   "verdict": "PASS (consistency only)"
  },
  {
   "id": "V2",
   "case": "Hu 2024 from Chang 2023",
   "type": "different paper, same chemistry, no tuning on Hu",
   "inputs": "f_free and desorption rate from Chang; Hu's own mass loss",
   "result": "RMSE after day 1: 9.4; first 8 h: 33.0 (free pool instant) → 17.7 (Chang desorption rate)",
   "verdict": "PARTIAL"
  },
  {
   "id": "V3",
   "case": "Mladenovska 2002, six sizes",
   "type": "sizes B–F predicted from size A",
   "inputs": "measured mass loss; τ_exit from size A, ∝ diameter",
   "result": "RMSE 3.6–5.7 %-pts (release = mass loss without exit step: 22–31)",
   "verdict": "PASS (prediction)"
  },
  {
   "id": "V4",
   "case": "Saravanan 2011 (negative control)",
   "type": "Fick with independent D",
   "inputs": "Wilke–Chang × Mackie–Meares",
   "result": "t50 predicted < 0.1 s vs observed 5.2–23.0 d (ratio ≥ 6.2e+06)",
   "verdict": "FAILS AS EXPECTED"
  }
 ],
 "Lambda_cheng_0p375": 1.1758833489225173,
 "Lambda_hu": 7.274937291697183e-09
}
````


# FILE: code/grm/__init__.py

````python
"""grm — Gelatin Release Model (crosslinked gelatin spheres; glutaraldehyde focus)."""
from .model import Liberation, Pool, Particle, release, release_pde
from .correlations import (wilke_chang, lebas, mackie_meares, stokes_einstein, D_cheng, mu_cheng, DRUGS, DAY)
from .analysis import rmse, r2, t_at, elasticities, rate_control_weights
from .fick import release_analytical, release_series, profile_analytical, SphereFVM
__version__ = "1.0.0"

````


# FILE: code/grm/analysis.py

````python
"""grm.analysis — error metrics, characteristic times, parameter weights (elasticities, degree of rate control)."""
import numpy as np
from scipy.optimize import brentq

def rmse(pred, obs):
    pred, obs = np.asarray(pred, float), np.asarray(obs, float)
    return float(np.sqrt(np.mean((pred - obs) ** 2)))

def r2(pred, obs):
    pred, obs = np.asarray(pred, float), np.asarray(obs, float)
    return float(1 - np.sum((obs - pred) ** 2) / np.sum((obs - obs.mean()) ** 2))

def t_at(F, level, lo, hi):
    """time at which the monotone release function F(t) reaches `level` (fraction)."""
    return brentq(lambda x: float(np.atleast_1d(F(np.array([x])))[0]) - level, lo, hi, xtol=1e-6 * hi)

def elasticities(build, p0: dict, keys, outputs: dict, h=1.1):
    """E[k][o] = d ln(output o) / d ln(parameter k), central difference with factor h.
    build(p) -> F(t) callable; outputs: name -> function(F) -> positive scalar."""
    base = {o: g(build(p0)) for o, g in outputs.items()}; E = {}
    for k in keys:
        up, dn = dict(p0), dict(p0); up[k] = p0[k] * h; dn[k] = p0[k] / h
        Fu, Fd = build(up), build(dn)
        E[k] = {o: float((np.log(g(Fu)) - np.log(g(Fd))) / (2 * np.log(h))) for o, g in outputs.items()}
    return base, E

def rate_control_weights(build, p0: dict, rate_keys: dict, t, h=1.1):
    """Degree of rate control (Campbell 2001) of each mechanism on F(t):
    X_i(t) = |dF/d ln k_i|, w_i = X_i / sum_j X_j.  rate_keys: mechanism name -> parameter key of its rate."""
    X = {}
    for m, k in rate_keys.items():
        up, dn = dict(p0), dict(p0); up[k] = p0[k] * h; dn[k] = p0[k] / h
        X[m] = np.abs(build(up)(t) - build(dn)(t)) / (2 * np.log(h))
    tot = sum(X.values()); tot = np.where(tot < 1e-9, np.nan, tot)
    return {m: v / tot for m, v in X.items()}

````


# FILE: code/grm/correlations.py

````python
"""
grm.correlations — parameter relations used WITHOUT fitting to release curves.

Every function states its source. Units: cm, s, K, cP, cm^3/mol.
"""
import numpy as np

NA, KB = 6.02214076e23, 1.380649e-23
DAY = 86400.0

# --- diffusion in water --------------------------------------------------------------------------------------
def eta_water_cP(T):
    """Viscosity of water, Vogel-type fit (about 1 % for 0-100 C)."""
    return 2.414e-2 * 10 ** (247.8 / (T - 140.0))

def wilke_chang(V_s, T=310.15, phi_B=2.6, M_B=18.015):
    """Wilke & Chang (1955) AIChE J 1:264.  D_w = 7.4e-8 (phi_B M_B)^0.5 T / (eta V_s^0.6)  [cm^2/s]."""
    return 7.4e-8 * np.sqrt(phi_B * M_B) * T / (eta_water_cP(T) * V_s ** 0.6)

LEBAS = dict(C=14.8, H=3.7, O=7.4, O_me=9.1, O_eth=11.0, O_acid=12.0, N_prim=10.5, N_sec=12.0, N_tert=10.8,
             N_dbl=15.6, Cl=24.6, ring6=-15.0, ring5=-11.5)
def lebas(**counts):
    """Le Bas molar volume at the normal boiling point (Poling, Prausnitz, O'Connell 5th ed., Table 11-5)."""
    return sum(LEBAS[k] * v for k, v in counts.items())

def stokes_einstein(r_cm, T=310.15):
    return KB * T / (6 * np.pi * eta_water_cP(T) * 1e-3 * r_cm * 1e-2) * 1e4

# --- diffusion in the gel ------------------------------------------------------------------------------------
def mackie_meares(phi):
    """Mackie & Meares (1955) Proc R Soc A 232:498.  D_gel / D_w = ((1 - phi)/(1 + phi))^2."""
    return ((1 - phi) / (1 + phi)) ** 2

# --- glutaraldehyde-crosslinked basic gelatin, acidic dye, collagenase 373 ng/ml (Cheng 2010, Ch. 2) ---------
def D_cheng(ga_pct):
    """Fig. 2.6B power law, D = 7.5132 [GA]^-0.2281 x 1e-4 um^2/s  (fitted by Cheng on the first 3 days in PBS).
    Valid for 0.125 <= GA <= 0.875 % v/v, R ~ 50 um swollen spheres."""
    return 7.5132 * np.asarray(ga_pct, float) ** -0.2281 * 1e-4 * 1e-8

def mu_cheng(ga_pct, coeff=10.0):
    """Eq. 2.12, mu = 0.36 (1 + c exp(-14.29 C_GA)) per day.
    The dissertation prints c = 0.1, which gives 0.366/0.360/0.360 1/d at 0.125/0.375/0.875 % and contradicts the
    values stated in the caption of Fig. 2.7 (1, 0.38, 0.36). c = 10 reproduces them (0.963/0.377/0.360).
    Returned in 1/s."""
    return 0.36 * (1 + coeff * np.exp(-14.29 * np.asarray(ga_pct, float))) / DAY

# --- drugs used in the validation set (Le Bas counts) --------------------------------------------------------
DRUGS = {
    "diclofenac": dict(V=lebas(C=14, H=11, Cl=2, N_sec=1, O_acid=2, ring6=2), MW=296.1, charge=-1),
    "gentamicin": dict(V=lebas(C=21, H=43, N_prim=3, N_sec=2, O=4, O_eth=3, ring6=3), MW=477.6, charge=+5),
    "ketoprofen": dict(V=lebas(C=16, H=14, O=1, O_acid=2, ring6=2), MW=254.3, charge=-1),
    "morphine": dict(V=lebas(C=17, H=19, N_tert=1, O=2, O_eth=1, ring6=4, ring5=1), MW=285.3, charge=+1),
}

````


# FILE: code/grm/fast.py

````python
"""
grm.fast — closed-form release for the four-stage parameter hierarchy, vectorised (for sensitivity analysis and the simulator).

Primitive parameters (what a formulator can change) and the stage they belong to
  Fick          R_dry [cm], drug MW [Da] (-> D_w by Stokes-Einstein), T [K]
  Swelling      Q (equilibrium volume swelling ratio: R = R_dry Q^(1/3), polymer fraction phi = 1/Q),
                D_coop [cm^2/s] (collective gel diffusivity: hydration time tau_sw = R^2/(pi^2 D_coop), Tanaka & Fillmore 1979)
  Crosslinking  K_b  (fast, linear reversible binding / partition: D_eff = D / (1 + K_b)),
                f_free, f_weak (pool sizes), k_weak [1/s] (slow desorption)
  Degradation   mu [1/s] (first-order liberation of network-bound drug)
  Other         f_irr (never released in the window)

Model (same as grm.model, Eq. 1), all liberation laws written as sums of exponentials so the convolution with the
exit kernel K(u) = 1 - sum_n w_n exp(-lam_n u) is analytic:
  int_0^t c e^{-r s} K(t - s) ds = c [ (1 - e^{-r t})/r  -  sum_n w_n (e^{-lam_n t} - e^{-r t})/(r - lam_n) ]
Hydration gates every pool: a pool with its own first-order step (rate b) becomes hypo-exponential (a then b).
Fick kernel: w_n = 6/(pi^2 n^2), lam_n = n^2 pi^2 D_eff / R^2 (NTERMS terms; truncation error <= 6/(pi^2 NTERMS)).
Approximation: R and D_eff are the swollen-state values during the whole release (exact when tau_sw << release time;
the gating term carries the delay). Verified against grm.release / grm.release_pde in tests/test_fast.py.
"""
import numpy as np
from .correlations import mackie_meares, stokes_einstein, NA

NTERMS = 300
_n = np.arange(1, NTERMS + 1, dtype=float)
_W = 6 / (np.pi ** 2 * _n ** 2)

def D_water_from_MW(MW, T=310.15, rho=1.3):
    """Stokes-Einstein with a solute radius from MW and density rho [g/cm3] (small molecules; order-of-magnitude)."""
    r = (3 * np.asarray(MW, float) / (4 * np.pi * rho * NA)) ** (1 / 3)        # cm
    return stokes_einstein(r, T)

def derived(p):
    """primitive dict -> model quantities (arrays broadcast)."""
    Q = np.asarray(p["Q"], float)
    R = np.asarray(p["R_dry"], float) * Q ** (1 / 3)
    Dw = p["D_w"] if "D_w" in p else D_water_from_MW(p["MW"], p.get("T", 310.15))
    D = Dw * mackie_meares(1 / Q) / (1 + np.asarray(p.get("K_b", 0.0), float))
    tau_sw = R ** 2 / (np.pi ** 2 * np.asarray(p["D_coop"], float)) if p.get("D_coop") is not None else np.zeros_like(R)
    return R, D, tau_sw

def _phi(tau):
    tau = np.asarray(tau, float); out = np.empty_like(tau)
    s = tau < 0.01
    out[s] = np.clip(6 * np.sqrt(np.clip(tau[s], 0, None) / np.pi) - 3 * tau[s], 0, 1)
    tt = tau[~s][..., None]
    out[~s] = 1 - np.sum(_W * np.exp(-_n ** 2 * np.pi ** 2 * tt), -1)
    return out

def _conv(c, r, lam, w, t):
    """sum over kernel terms of c * int_0^t e^{-r s} (1 - sum w e^{-lam (t-s)}) ds; shapes: c, r (...,1), lam (...,1,N), t (...,T)."""
    t = t[..., None]; r3 = r[..., None]
    first = c * (-np.expm1(-r * t[..., 0])) / r
    d = r3 - lam
    small = np.abs(d) < 1e-9 * np.maximum(r3, lam)
    dsafe = np.where(small, 1.0, d)
    E = np.where(small, t * np.exp(-r3 * t), (np.exp(-lam * t) - np.exp(-r3 * t)) / dsafe)
    return first - c * np.sum(w * E, -1)

def release_fast(t, R, D, f_free, f_weak, k_weak, mu, f_irr=0.0, tau_sw=0.0, exit_tau=None, by_pool=False, chunk=64):
    """F(t) for arrays of formulations. t: (T,) seconds; every other argument scalar or shape (M,). Returns (M, T)."""
    t = np.atleast_1d(np.asarray(t, float))
    args = [np.atleast_1d(np.asarray(x, float)) for x in (R, D, f_free, f_weak, k_weak, mu, f_irr, tau_sw)]
    M = max(map(len, args))
    if M > chunk:
        args = [np.broadcast_to(x, (M,)) for x in args]; et = None if exit_tau is None else np.broadcast_to(np.atleast_1d(exit_tau), (M,))
        parts = [release_fast(t, *[x[i:i + chunk] for x in args], exit_tau=None if et is None else et[i:i + chunk], by_pool=by_pool, chunk=chunk) for i in range(0, M, chunk)]
        if not by_pool: return np.vstack(parts)
        return np.vstack([q[0] for q in parts]), {k: np.vstack([q[1][k] for q in parts]) for k in parts[0][1]}
    R, D, f_free, f_weak, k_weak, mu, f_irr, tau_sw = (np.atleast_1d(np.asarray(x, float)) for x in (R, D, f_free, f_weak, k_weak, mu, f_irr, tau_sw))
    M = max(map(len, (R, D, f_free, f_weak, k_weak, mu, f_irr, tau_sw)))
    R, D, f_free, f_weak, k_weak, mu, f_irr, tau_sw = (np.broadcast_to(x, (M,)) for x in (R, D, f_free, f_weak, k_weak, mu, f_irr, tau_sw))
    f_bound = np.clip(1 - f_free - f_weak - f_irr, 0, 1)
    if exit_tau is None:
        lam = (_n ** 2 * np.pi ** 2)[None, :] * (D / R ** 2)[:, None]; w = np.broadcast_to(_W[None, :], lam.shape)
        Kimm = _phi((D / R ** 2)[:, None] * t[None, :])
    else:
        lam = (1 / np.broadcast_to(np.atleast_1d(exit_tau), (M,)))[:, None]; w = np.ones((M, 1))
        Kimm = -np.expm1(-lam * t[None, :])
    lam3, w3, T = lam[:, None, :], w[:, None, :], t[None, :]
    a = np.where(tau_sw > 0, 1 / np.where(tau_sw > 0, tau_sw, 1), np.inf)
    def single(rate):                                      # density rate*e^{-rate s}
        rr = rate[:, None]; return _conv(rr, rr, lam3, w3, T)
    def gated(b):                                          # hydration (a) then first-order step (b): hypo-exponential
        out = np.zeros((M, len(t)))
        g = np.isfinite(a)
        if (~g).any(): out[~g] = single(b[~g]) if (~g).all() else single(b)[~g]
        if g.any():
            aa, bb = a[g], np.where(np.abs(b[g] - a[g]) < 1e-12 * a[g], b[g] * (1 + 1e-6), b[g])
            c = (aa * bb / (bb - aa))[:, None]
            out[g] = _conv(c, aa[:, None], lam3[g], w3[g], T) + _conv(-c, bb[:, None], lam3[g], w3[g], T)
        return out
    free = np.where(np.isfinite(a)[:, None], single(np.where(np.isfinite(a), a, 1.0)), Kimm)
    weak = np.where((f_weak > 0)[:, None], gated(np.maximum(k_weak, 1e-30)), 0.0)
    bound = np.where((mu > 0)[:, None] & (f_bound > 0)[:, None], gated(np.maximum(mu, 1e-30)), 0.0)
    F = f_free[:, None] * free + f_weak[:, None] * weak + f_bound[:, None] * bound
    F = np.clip(F, 0, 1)
    return (F, dict(free=f_free[:, None] * free, weak=f_weak[:, None] * weak, bound=f_bound[:, None] * bound)) if by_pool else F

def release_primitive(t, p, by_pool=False):
    """F(t) from primitive parameters (dict of scalars or arrays)."""
    R, D, tau_sw = derived(p)
    return release_fast(t, R, D, p["f_free"], p.get("f_weak", 0.0), p.get("k_weak", 1.0), p.get("mu", 0.0), p.get("f_irr", 0.0), tau_sw, by_pool=by_pool)

````


# FILE: code/grm/fick.py

````python
"""
fick_core.py — verified building blocks for drug release from a sphere.

Dimensionless problem (x = r/R, tau = D t / R^2, c = C/C0):
    dc/dtau = (1/x^2) d/dx ( x^2 dc/dx ),   0 < x < 1
    c(x,0) = 1,  dc/dx(0,tau) = 0,  c(1,tau) = 0 for tau > 0
Released fraction (relative to initial mass):
    F(tau) = 1 - 3 * int_0^1 c x^2 dx
Analytical (Crank 1975, eq. 6.20):
    F(tau) = 1 - (6/pi^2) sum_{n>=1} exp(-n^2 pi^2 tau)/n^2
"""
from __future__ import annotations
import numpy as np
from scipy.special import erfc
from scipy.linalg import solve_banded

PI2 = np.pi ** 2

# ---------------------------------------------------------------------------
# 1. Analytical release with explicit truncation control
# ---------------------------------------------------------------------------
def _tail_bound(N: int, tau: float) -> float:
    """Rigorous upper bound of (6/pi^2) * sum_{n>N} exp(-n^2 pi^2 tau)/n^2.
    Uses exp(-n^2 a) <= exp(-(N+1)^2 a) * exp(-(n-N-1)(2N+2) a) for n >= N+1."""
    a = PI2 * tau
    m = N + 1
    q = np.exp(-(2 * m) * a)
    return (6 / PI2) * np.exp(-m * m * a) / (m * m) / (1.0 - q)


def release_series(tau, tol: float = 1e-13, nmax: int = 2_000_000, return_terms=False):
    """F(tau) from the eigen-series; the number of terms is chosen per tau so
    that the rigorous tail bound is below `tol`. For tau = 0, F = 0 exactly."""
    tau = np.atleast_1d(np.asarray(tau, dtype=float))
    out = np.zeros_like(tau)
    nterms = np.zeros(tau.shape, dtype=int)
    for i, t in enumerate(tau):
        if t <= 0:
            out[i] = 0.0
            continue
        # smallest N with tail_bound(N) < tol (search by doubling + bisection)
        N = 1
        while _tail_bound(N, t) > tol and N < nmax:
            N *= 2
        lo, hi = max(1, N // 2), N
        while lo < hi:
            mid = (lo + hi) // 2
            if _tail_bound(mid, t) > tol:
                lo = mid + 1
            else:
                hi = mid
        N = lo
        n = np.arange(1, N + 1, dtype=float)
        s = np.sum(np.exp(-n * n * PI2 * t) / (n * n))
        out[i] = 1.0 - (6 / PI2) * s
        nterms[i] = N
    return (out, nterms) if return_terms else out


def release_short_time(tau, nimg: int = 6):
    """Independent short-time (image) form, Crank eq. 6.21:
    F = 6 sqrt(tau) [ 1/sqrt(pi) + 2 sum ierfc(n/sqrt(tau)) ] - 3 tau."""
    tau = np.atleast_1d(np.asarray(tau, dtype=float))
    out = np.zeros_like(tau)
    pos = tau > 0
    t = tau[pos]
    s = np.zeros_like(t)
    for n in range(1, nimg + 1):
        z = n / np.sqrt(t)
        ierfc = np.exp(-z * z) / np.sqrt(np.pi) - z * erfc(z)
        s += ierfc
    out[pos] = 6 * np.sqrt(t) * (1 / np.sqrt(np.pi) + 2 * s) - 3 * t
    return out


def release_analytical(tau, tol: float = 1e-13):
    """Production evaluator: series with tail control for tau >= 0.01,
    short-time image form below (both forms are verified against each other)."""
    tau = np.atleast_1d(np.asarray(tau, dtype=float))
    out = np.empty_like(tau)
    small = tau < 0.01
    out[small] = release_short_time(tau[small])
    if np.any(~small):
        n = np.arange(1, 40, dtype=float)[:, None]
        t = tau[~small][None, :]
        out[~small] = 1 - (6 / PI2) * np.sum(np.exp(-n * n * PI2 * t) / (n * n), axis=0)
    return out


def profile_analytical(x, tau, nterms: int = 4000):
    """c(x,tau) = (2/(pi x)) sum (-1)^{n+1}/n sin(n pi x) exp(-n^2 pi^2 tau); x>0."""
    x = np.asarray(x, dtype=float)
    n = np.arange(1, nterms + 1, dtype=float)[:, None]
    xx = np.where(x == 0, 1e-12, x)[None, :]
    s = np.sum(((-1) ** (n + 1)) / n * np.sin(n * np.pi * xx) * np.exp(-n * n * PI2 * tau), axis=0)
    c = 2 / (np.pi * xx[0]) * s
    # x -> 0 limit: 2 sum (-1)^{n+1} exp(-n^2 pi^2 tau)
    c0 = 2 * np.sum(((-1) ** (n[:, 0] + 1)) * np.exp(-n[:, 0] ** 2 * PI2 * tau))
    return np.where(x == 0, c0, c)


# ---------------------------------------------------------------------------
# 2. Spherical finite-volume solver (cell-centred, true shell volumes/areas)
# ---------------------------------------------------------------------------
class SphereFVM:
    """Cell-centred FVM on 0<=x<=1.
    faces x_{i-1/2}, cell volume V_i = (x_{i+1/2}^3 - x_{i-1/2}^3)/3 (per 4 pi),
    face area A_f = x_f^2 (per 4 pi). Centre face area is 0 and its flux is set
    to 0 explicitly (symmetry). Surface: Dirichlet c = 0 through a half-cell
    distance (perfect sink). D may be a scalar or an array of face values."""

    def __init__(self, N: int, refine: float = 1.0):
        # refine>1 clusters cells toward the surface (x=1): xf = 1-(1-s)^refine
        s = np.linspace(0.0, 1.0, N + 1)
        xf = 1.0 - (1.0 - s) ** refine if refine != 1.0 else s
        self.N = N
        self.xf = xf
        self.xc = 0.5 * (xf[:-1] + xf[1:])
        self.V = (xf[1:] ** 3 - xf[:-1] ** 3) / 3.0
        self.A = xf ** 2                              # A[0] = 0 at centre
        d = np.empty(N + 1)
        d[1:-1] = self.xc[1:] - self.xc[:-1]
        d[0] = np.inf                                  # centre: no flux
        d[-1] = 1.0 - self.xc[-1]                      # half cell to the surface
        self.d = d
        self.Vtot = self.V.sum()                      # = 1/3 exactly

    def conductance(self, Dface=1.0):
        Dface = np.broadcast_to(np.asarray(Dface, dtype=float), (self.N + 1,))
        G = self.A * Dface / self.d
        G[0] = 0.0                                     # symmetry: zero flux at x=0
        return G

    def operator_bands(self, G):
        """Return banded matrix (3,N) for  V dc/dt = -L c  with L SPD-like."""
        N = self.N
        main = G[:-1] + G[1:]                          # west + east (east of last = surface)
        upper = -G[1:-1]
        lower = -G[1:-1]
        return main, upper, lower

    def surface_flux(self, c, G):
        """Outward flux (per 4 pi, dimensionless) through x=1: G_s * (c_N - 0)."""
        return G[-1] * c[-1]

    def mass(self, c):
        return np.dot(self.V, c)

    def solve(self, tau_out, dtau, theta=0.5, rannacher=4, Dfun=None, c0=None,
              store_profiles=None):
        """theta-scheme time stepping. theta=1 backward Euler, 0.5 Crank-Nicolson.
        `rannacher` initial steps are done with backward Euler at dtau/2 (damps the
        CN oscillation caused by the discontinuous initial/boundary data).
        Dfun(tau) -> face diffusivities (dimensionless, D/D_ref); None means 1.
        Returns dict with F_inventory, F_flux (independent outlet integral),
        min concentration, profiles."""
        N = self.N
        c = np.ones(N) if c0 is None else c0.copy()
        tau_out = np.asarray(tau_out, dtype=float)
        T = tau_out.max()
        M0 = self.mass(c)
        F_inv, F_flx, cmin = [], [], []
        prof = {}
        t = 0.0
        released = 0.0
        k = 0
        out_idx = 0
        G_old = self.conductance(1.0 if Dfun is None else Dfun(0.0))
        # record tau=0 if requested
        while out_idx < len(tau_out) and tau_out[out_idx] <= 0:
            F_inv.append(0.0); F_flx.append(0.0); cmin.append(c.min()); out_idx += 1
        nsteps_ran = 0
        cmin_all = c.min(); dmin_all = np.inf
        while t < T - 1e-15:
            if nsteps_ran < rannacher and theta < 1:
                dt, th = dtau / 2, 1.0
            else:
                dt, th = dtau, theta
            # do not overshoot output times: shorten the step to land exactly
            if out_idx < len(tau_out) and t + dt > tau_out[out_idx] - 1e-14:
                dt = tau_out[out_idx] - t
            G_new = self.conductance(1.0 if Dfun is None else Dfun(t + dt))
            mn, up, lo = self.operator_bands(G_new)
            mo, uo, loo = self.operator_bands(G_old)
            # explicit part: (V - (1-th) dt L_old) c
            Lc = mo * c
            Lc[:-1] += uo * c[1:]
            Lc[1:] += loo * c[:-1]
            rhs = self.V * c - (1 - th) * dt * Lc
            ab = np.zeros((3, N))
            ab[0, 1:] = th * dt * up
            ab[1, :] = self.V + th * dt * mn
            ab[2, :-1] = th * dt * lo
            c_new = solve_banded((1, 1), ab, rhs)
            # outlet flux integrated with the SAME theta weighting (discrete conservation)
            J_old = self.surface_flux(c, G_old)
            J_new = self.surface_flux(c_new, G_new)
            inc = dt * (th * J_new + (1 - th) * J_old)
            released += inc
            cmin_all = min(cmin_all, c_new.min()); dmin_all = min(dmin_all, inc)
            c = c_new
            G_old = G_new
            t += dt
            nsteps_ran += 1
            while out_idx < len(tau_out) and abs(t - tau_out[out_idx]) < 1e-12:
                F_inv.append(1.0 - self.mass(c) / M0)
                F_flx.append(released / M0)
                cmin.append(c.min())
                if store_profiles is not None and out_idx in store_profiles:
                    prof[out_idx] = c.copy()
                out_idx += 1
        return dict(tau=tau_out, F_inv=np.array(F_inv), F_flux=np.array(F_flx),
                    cmin=np.array(cmin), profiles=prof, c_final=c,
                    cmin_all_steps=cmin_all, min_release_increment=dmin_all)


# ---------------------------------------------------------------------------
# 3. Dimensional helpers used in the fitting stages
# ---------------------------------------------------------------------------
def F_const(t, k):
    """Released fraction for constant D: F(k t), k = D_app / R_ref^2 [1/time]."""
    return release_analytical(np.clip(k * np.asarray(t, float), 0, None))


def F_burst(t, k, b):
    t = np.asarray(t, float)
    F = b + (1 - b) * F_const(t, k)
    return np.where(t > 0, F, 0.0)

````


# FILE: code/grm/model.py

````python
"""
grm.model — unified multi-pool release model for crosslinked gelatin spheres.

Drug in the particle is split into pools. Each pool i has a mass fraction f_i (sum f_i + f_irr = 1) and a
*liberation law* L_i(s): the fraction of that pool that has become mobile by time s (L_i(0)=0, L_i(inf)=1).
Once mobile, drug leaves the particle through an *exit kernel* K(t): the fraction of a uniformly distributed,
mobile amount that has left a time t after it became mobile.

    F(t) = sum_i f_i * int_0^t K(t - s) dL_i(s)                                   (1)

Pools used in this project
    free   (f_free):  L = 1 for s >= 0 (mobile from the start)
    weak   (f_weak):  L = 1 - exp(-k_weak s)          reversible / ionic desorption, first order
    bound  (f_bound): L from network degradation:
                         first-order enzymatic loss  L = 1 - exp(-mu s)                (Cheng 2010, Eq. 2.9)
                         measured mass loss g(s)     L = (1 - g(s)) / (1 - g(inf))
    irr    (f_irr):   never released in the experiment window (plateau < 100 %)

Exit kernels
    "fick":   K(t) = Phi(D t / R^2), Crank series for a sphere with uniform load and perfect sink.
              Eq. (1) is then the exact solution of
              dC/dt = (1/r^2) d/dr(D r^2 dC/dr) + C0 * sum_i f_i dL_i/dt,  C(R,t) = 0     (2)
              because Eq. (2) is linear and the source is uniform in r (Duhamel superposition).
              Verified against a finite-volume solution of Eq. (2) in validation/v0_verification.py.
    "first_order": K(t) = 1 - exp(-t / tau_exit). Used when the mobile species leaves through a moving
              front rather than by diffusion (large proteins in enzymatically eroded spheres, Mladenovska 2002).

All times in seconds, lengths in cm, D in cm^2/s.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Callable, Optional, Sequence
import numpy as np
from .fick import release_analytical, SphereFVM

# --------------------------------------------------------------------------------------------- liberation laws
@dataclass
class Liberation:
    """Cumulative liberation L(s) in [0, 1]. kind: 'immediate' | 'first_order' | 'tabulated'."""
    kind: str = "immediate"
    rate: float = 0.0                      # 1/s for first_order
    t_tab: Optional[np.ndarray] = None     # s, for tabulated
    L_tab: Optional[np.ndarray] = None     # liberated fraction (0..1), for tabulated

    def __call__(self, s):
        s = np.asarray(s, float)
        if self.kind == "immediate":
            return np.where(s >= 0, 1.0, 0.0)
        if self.kind == "first_order":
            return np.where(s > 0, -np.expm1(-self.rate * np.clip(s, 0, None)), 0.0)
        if self.kind == "tabulated":
            L = np.interp(s, self.t_tab, self.L_tab, left=0.0, right=float(self.L_tab[-1]))
            return np.maximum.accumulate(np.clip(L, 0, 1)) if L.ndim == 1 else np.clip(L, 0, 1)
        raise ValueError(self.kind)

    @staticmethod
    def from_mass_remaining(t_s, g, normalise=True):
        """Bound drug freed in proportion to network mass lost: L = (1 - g)/(1 - g_end)."""
        t_s = np.asarray(t_s, float); g = np.clip(np.asarray(g, float), 0, 1)
        lost = 1 - g
        if normalise and lost[-1] > 0: lost = lost / lost[-1]
        return Liberation("tabulated", t_tab=t_s, L_tab=np.maximum.accumulate(lost))


@dataclass
class Pool:
    f: float
    lib: Liberation = field(default_factory=Liberation)
    name: str = ""


@dataclass
class Particle:
    """One formulation. Either Fick exit (R_cm, D_cm2s) or first-order exit (tau_exit_s)."""
    pools: Sequence[Pool]
    R_cm: float = 0.0
    D_cm2s: float = 0.0
    exit: str = "fick"
    tau_exit_s: float = 0.0
    f_irr: float = 0.0

    def check(self):
        tot = sum(p.f for p in self.pools) + self.f_irr
        if not np.isclose(tot, 1.0, atol=1e-6):
            raise ValueError(f"pool fractions sum to {tot}, expected 1")
        if self.exit == "fick" and (self.R_cm <= 0 or self.D_cm2s <= 0):
            raise ValueError("Fick exit needs R_cm > 0 and D_cm2s > 0")
        return self

    # exit kernel
    def K(self, t):
        t = np.clip(np.asarray(t, float), 0, None)
        if self.exit == "fick":
            return release_analytical(self.D_cm2s * t / self.R_cm ** 2)
        if self.exit == "first_order":
            return -np.expm1(-t / self.tau_exit_s)
        raise ValueError(self.exit)

    @property
    def tau_D(self):
        """characteristic diffusion time R^2/(pi^2 D) [s]."""
        return self.R_cm ** 2 / (np.pi ** 2 * self.D_cm2s) if self.exit == "fick" else self.tau_exit_s


def _pool_release(part: Particle, pool: Pool, t, nq=1600):
    t = np.atleast_1d(np.asarray(t, float)); out = np.zeros_like(t)
    if pool.lib.kind == "immediate":
        return part.K(t)
    for j, tj in enumerate(t):
        if tj <= 0: continue
        # Stieltjes sum of K(t - s) dL(s); nodes clustered at s = 0 and s = t (cosine spacing)
        s = tj * 0.5 * (1 - np.cos(np.linspace(0, np.pi, nq)))
        L = pool.lib(s); dL = np.diff(L)
        sm = 0.5 * (s[1:] + s[:-1])
        out[j] = np.sum(part.K(tj - sm) * dL)
    return out


def release(t, part: Particle, by_pool=False, nq=1600):
    """Cumulative fraction released F(t) (0..1) at times t [s]. Eq. (1)."""
    part.check()
    parts = {p.name or f"pool{i}": p.f * _pool_release(part, p, t, nq) for i, p in enumerate(part.pools)}
    F = sum(parts.values())
    return (F, parts) if by_pool else F


# --------------------------------------------------------------------------------------------- PDE reference (Eq. 2)
def release_pde(t_eval, part: Particle, N=160, refine=2.0, dtau=2e-5):
    """Finite-volume solution of Eq. (2) (Fick exit only), backward Euler in dimensionless time,
    surface-graded shells. Independent check of the superposition formula Eq. (1)."""
    assert part.exit == "fick"
    m = SphereFVM(N, refine); G = m.conductance(1.0); mn, up, lo = m.operator_bands(G)
    from scipy.linalg import solve_banded
    k = part.D_cm2s / part.R_cm ** 2
    t_eval = np.asarray(t_eval, float); taus = k * t_eval; T = taus.max()
    f_init = sum(p.f for p in part.pools if p.lib.kind == "immediate")
    srcp = [p for p in part.pools if p.lib.kind != "immediate"]
    c = np.full(N, f_init); out = []; tau = 0.0; i = 0
    # adaptive step: fine at the start (discontinuous data), coarser later
    ab = None
    while i < len(taus) and taus[i] <= 0: out.append(0.0); i += 1
    while tau < T - 1e-15:
        dt = min(dtau * max(1.0, (tau / (50 * dtau)) ** 0.5), T / 2000 + dtau)
        if i < len(taus) and tau + dt > taus[i]: dt = taus[i] - tau
        t0, t1 = tau / k, (tau + dt) / k
        src = sum(p.f * (p.lib(np.array([t1]))[0] - p.lib(np.array([t0]))[0]) for p in srcp)   # liberated in this step
        ab = np.zeros((3, N)); ab[0, 1:] = dt * up; ab[1] = m.V + dt * mn; ab[2, :-1] = dt * lo
        c = solve_banded((1, 1), ab, m.V * (c + src))
        tau += dt
        while i < len(taus) and abs(tau - taus[i]) < 1e-14:
            remaining = m.mass(c) / m.Vtot                                   # mobile drug still inside
            not_yet = sum(p.f * (1 - p.lib(np.array([tau / k]))[0]) for p in srcp)
            out.append(1 - part.f_irr - remaining - not_yet); i += 1
    return np.array(out)

````


# FILE: code/validation/common.py

````python
import os, sys, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import numpy as np, pandas as pd, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 9.5, "axes.spines.top": False, "axes.spines.right": False,
                     "axes.grid": True, "grid.color": "#e3e6ee", "legend.frameon": False})
NAVY, BLUE, ORG, GRN, GREY, PUR, RED = "#0E1B4D", "#2F5CF0", "#EB6834", "#1BAF7A", "#8A8F99", "#8A3FD1", "#C62828"
H, DAY = 3600.0, 86400.0
DATA = os.path.join(ROOT, "data"); RES = os.path.join(ROOT, "results"); FIG = os.path.join(ROOT, "figures")
os.makedirs(RES, exist_ok=True); os.makedirs(FIG, exist_ok=True)

def save(name, obj):
    with open(os.path.join(RES, name + ".json"), "w") as f:
        json.dump(obj, f, indent=1, default=lambda x: float(x) if np.isscalar(x) else list(x))
    return obj

def r(x, n=2):
    return float(np.round(float(x), n))

````


# FILE: code/validation/run_all.py

````python
"""Run every verification/validation script, then write results/summary.json and results/VALIDATION.md.
Usage:  python validation/run_all.py      (about 1 minute)"""
import subprocess, sys, os, json, time
HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPTS = ["v0_verification.py", "v1_cheng2010.py", "v2_hu2024_from_chang2023.py", "v3_mladenovska2002.py",
           "v4_saravanan2011_negative_control.py", "w1_parameter_weights.py", "w2_all_parameters.py"]
for s in SCRIPTS:
    t0 = time.time(); r = subprocess.run([sys.executable, os.path.join(HERE, s)], cwd=HERE, capture_output=True, text=True)
    print(f"{s:45s} {'ok' if r.returncode == 0 else 'FAILED'}  {time.time() - t0:5.1f} s")
    if r.returncode: print(r.stderr[-3000:]); sys.exit(1)
from common import RES, DAY
import numpy as np
J = {s[:-3]: json.load(open(os.path.join(RES, s[:-3] + ".json"))) for s in SCRIPTS}
v0, v1, v2, v3, v4, w1, w2 = (J[s[:-3]] for s in SCRIPTS)
rows = []
rows.append(("V0", "code verification", "FVM vs Crank series; Eq. (1) vs PDE", "none (mathematics)",
             f"FVM error {v0['mesh'][3]['err_max'] * 100:.3f} %-pts at N = 80 (2nd order); Eq. (1) vs PDE ≤ {max(x['max_abs_diff_pct'] for x in v0['superposition_vs_pde'].values()):.3f} %-pts", "PASS"))
t = v1["test"]
rows.append(("V1", "Cheng 2010, GA 0.25 % & 0.625 %", "GA level never used for any parameter", "f_free from PBS curves; D(GA), μ(GA) published",
             f"RMSE {t['GA 0.25']['rmse_pct']:.2f} and {t['GA 0.625']['rmse_pct']:.2f} %-pts; {t['GA 0.25']['within_errbar'] + t['GA 0.625']['within_errbar']} of {t['GA 0.25']['points_with_errbar'] + t['GA 0.625']['points_with_errbar']} points inside error bars", "PASS (prediction)"))
rows.append(("V1b", "Cheng 2010, GA 0.125/0.375/0.875 %", "same curves Cheng used for μ(GA)", "as above",
             f"RMSE {t['GA 0.125']['rmse_pct']:.2f} / {t['GA 0.375']['rmse_pct']:.2f} / {t['GA 0.875']['rmse_pct']:.2f} %-pts", "PASS (consistency only)"))
a, b = v2["hu_pred_with_1.0dM-G"], v2["hu_pred_B_weak_rate_from_chang"]
rows.append(("V2", "Hu 2024 from Chang 2023", "different paper, same chemistry, no tuning on Hu", "f_free and desorption rate from Chang; Hu's own mass loss",
             f"RMSE after day 1: {a['rmse_after_1d']:.1f}; first 8 h: {a['rmse_first_8h']:.1f} (free pool instant) → {b['rmse_first_8h']:.1f} (Chang desorption rate)", "PARTIAL"))
rows.append(("V3", "Mladenovska 2002, six sizes", "sizes B–F predicted from size A", "measured mass loss; τ_exit from size A, ∝ diameter",
             f"RMSE {min(v3['rmse_predicted_sizes']):.1f}–{max(v3['rmse_predicted_sizes']):.1f} %-pts (release = mass loss without exit step: 22–31)", "PASS (prediction)"))
c4 = v4["cases"]
rows.append(("V4", "Saravanan 2011 (negative control)", "Fick with independent D", "Wilke–Chang × Mackie–Meares",
             f"t50 predicted < 0.1 s vs observed {c4['GM3']['t50_obs_day']:.1f}–{c4['GM1']['t50_obs_day']:.1f} d (ratio ≥ {min(min(v['ratio_obs_over_fick']) for v in c4.values()):.1e})", "FAILS AS EXPECTED"))
lam_cheng = float(v1["test"]["GA 0.375"]["mu_per_day"] / DAY * (50e-4) ** 2 / (np.pi ** 2 * v1["calibration"]["GA 0.375"]["D_cm2s"]))
summary = dict(version="1.0.0", rows=[dict(zip(["id", "case", "type", "inputs", "result", "verdict"], x)) for x in rows],
               Lambda_cheng_0p375=lam_cheng, Lambda_hu=float(v2["hu_data"]["tau_D_s"] / (30 * DAY)))
json.dump(summary, open(os.path.join(RES, "summary.json"), "w"), indent=1, ensure_ascii=False)
md = ["# Validation summary (auto-generated by validation/run_all.py — do not edit by hand)", "",
      "| ID | Case | Type of test | Inputs (none fitted to the test curve) | Result | Verdict |", "|---|---|---|---|---|---|"]
md += ["| " + " | ".join(x) + " |" for x in rows]
md += ["", f"Regime number Λ = μ·R²/(π²D): Cheng GA 0.375 % → {lam_cheng:.2f} (mixed); Hu 2024 → ~{summary['Lambda_hu']:.0e} (diffusion is never limiting).",
       "", "Elasticities of t50 (Cheng, GA 0.375 %): " + ", ".join(f"{k} {v['t50']:+.2f}" for k, v in w1["cheng_GA0.375"]["E"].items())]
md += ["", "Global weights (total Sobol index of log t50, W2): " + "; ".join(
    k + ": " + ", ".join(f"{n} {v['ST']:.2f}" for n, v in sorted(((n, v) for n, v in w2["regimes"][k]["sobol"]["log10 t50"].items() if not n.startswith("_")), key=lambda x: -x[1]["ST"])[:3])
    for k in w2["regimes"])]
open(os.path.join(RES, "VALIDATION.md"), "w").write("\n".join(md) + "\n")
print("\n".join(md))

````


# FILE: code/validation/v0_verification.py

````python
"""V0 — code verification (is the mathematics solved correctly?). No experimental data.
  a) finite-volume solver vs Crank analytical series: mesh and time-step convergence, mass balance
  b) multi-pool superposition formula (Eq. 1 in grm/model.py) vs the PDE with source term (Eq. 2)"""
from common import *
from grm import *
from grm.model import release_pde
out = {}
# a) mesh convergence on the base Fick problem (dimensionless), surface-graded shells (p = 2), Crank-Nicolson
taus = np.array([0.001, 0.005, 0.0305, 0.1, 0.3]); ex = release_analytical(taus)
mesh = []
for N in (10, 20, 40, 80, 160, 320):
    m = SphereFVM(N, 2.0); res = m.solve(taus, 1e-5, theta=0.5)
    mesh.append(dict(N=N, err_max=float(np.abs(res["F_inv"] - ex).max()), mass_closure=float(np.abs(res["F_inv"] - res["F_flux"]).max()),
                     F=res["F_inv"].tolist()))
for a, b in zip(mesh[:-1], mesh[1:]): a["order"] = float(np.log2(a["err_max"] / b["err_max"]))
out["mesh"] = mesh
step = []
m = SphereFVM(80, 2.0)
for dt in (2e-3, 1e-3, 5e-4, 2.5e-4, 1.25e-4):
    res = m.solve(taus, dt, theta=0.5); step.append(dict(dtau=dt, err_max=float(np.abs(res["F_inv"] - ex).max())))
out["time_step"] = step
# b) superposition vs PDE for three pool structures
cases = {
 "free + enzymatic bound (Cheng-type)": Particle([Pool(0.47, name="free"), Pool(0.53, Liberation("first_order", rate=mu_cheng(0.375)), "bound")],
                                                 50e-4, D_cheng(0.375)),
 "free + weak + measured-mass-loss bound": Particle([Pool(0.5, name="free"), Pool(0.2, Liberation("first_order", rate=1 / (5 * H)), "weak"),
                                                    Pool(0.3, Liberation.from_mass_remaining(np.array([0, 1, 2, 5, 10, 20, 30]) * DAY,
                                                                                             np.array([1, .95, .9, .7, .4, .1, 0])), "bound")], 8e-4, 3e-11),
 "slow diffusion only, f_irr = 0.1": Particle([Pool(0.9, name="free")], 20e-4, 1e-12, f_irr=0.1),
}
sup = {}
fig, axs = plt.subplots(1, 3, figsize=(14, 4))
for ax, (nm, p) in zip(axs, cases.items()):
    tmax = 18 * DAY if "Cheng" in nm else 30 * DAY
    t = np.linspace(0, tmax, 61)[1:]
    a = release(t, p); b = release_pde(t, p, N=160)
    sup[nm] = dict(max_abs_diff_pct=float(100 * np.abs(a - b).max()))
    ax.plot(t / DAY, 100 * a, color=NAVY, lw=2, label="superposition, Eq. (1)"); ax.plot(t[::3] / DAY, 100 * b[::3], "o", color=ORG, ms=4, mfc="white", label="finite-volume PDE, Eq. (2)")
    ax.set_title(f"{nm}\nmax |diff| = {100 * np.abs(a - b).max():.3f} %-points", loc="left", fontsize=8.8); ax.set_xlabel("time (day)"); ax.set_ylabel("released (%)")
axs[0].legend(fontsize=8)
fig.tight_layout(); fig.savefig(os.path.join(FIG, "V0_superposition_vs_pde.png"), dpi=170); plt.close(fig)
out["superposition_vs_pde"] = sup
fig, a = plt.subplots(figsize=(5.4, 4))
a.loglog([x["N"] for x in mesh], [x["err_max"] for x in mesh], "o-", color=NAVY, label="max |F − F_exact|")
a.loglog([10, 320], [7e-3, 7e-3 / 32 ** 2], color=GREY, lw=1, label="slope −2"); a.set_xlabel("radial cells N (surface-graded)"); a.set_ylabel("error (fraction)")
a.legend(); a.set_title("V0: finite-volume solver vs Crank series", loc="left", fontsize=9.5); fig.tight_layout(); fig.savefig(os.path.join(FIG, "V0_mesh.png"), dpi=170); plt.close(fig)
save("v0_verification", out)
print(json.dumps({k: v for k, v in out.items() if k != "mesh"}, indent=1)); print([(x["N"], x["err_max"]) for x in mesh])

````


# FILE: code/validation/v1_cheng2010.py

````python
"""V1 — Cheng (2010) dissertation Ch. 2: GA-crosslinked basic gelatin spheres (R = 50 um swollen), acidic dye,
PBS with/without collagenase 373 ng/ml, five GA levels 0.125-0.875 % v/v. Data: vector extraction (tools/digitize_cheng2010.py).

Information flow (what is calibrated on what):
  D(GA)  : Cheng's published power law (Cheng fitted it to the first 3 days in PBS)                -> taken as given
  mu(GA) : Cheng's Eq. 2.12 with coefficient 10 (Cheng fitted it to the enzyme curves 0.125/0.375/0.875 %) -> taken as given
  f_free : OUR calibration, one number per GA level, from the PBS curves (Fig. 2.6A) only
  Test   : enzyme curves (Figs 2.7, 2.8). GA 0.25 % and 0.625 % were never used by Cheng or by us for any parameter
           -> genuine predictions (f_free interpolated in GA, mu and D from the relations)."""
from common import *
from grm import *
R = 50e-4
d = pd.read_csv(os.path.join(DATA, "cheng2010_release_vector.csv"))
d["ga"] = d.series.str.extract(r"GA ([0-9.]+)").astype(float)
d = d[d.t_day > 0.5]                                   # drop the origin markers
pbs = d[d.figure == "2.6A"]; enz = d[d.figure != "2.6A"]
out = dict(R_um=50, calibration={}, test={})
# ---- calibration: f_free from PBS, closed-form least squares  y = f * Phi(D t / R^2)
fm = {}
for ga, s in pbs.groupby("ga"):
    ph = release_analytical(D_cheng(ga) * s.t_day.values * DAY / R ** 2); y = s.release_pct.values / 100
    f = float(np.dot(ph, y) / np.dot(ph, ph)); fm[ga] = f
    out["calibration"][f"GA {ga}"] = dict(f_free=r(f, 4), D_cm2s=float(D_cheng(ga)), rmse_pct=r(100 * rmse(f * ph, y)), n=len(y))
gas = np.array(sorted(fm)); fms = np.array([fm[g] for g in gas])
f_of = lambda ga: float(np.interp(ga, gas, fms))
def particle(ga, f=None, coeff=10.0):
    f = f_of(ga) if f is None else f
    return Particle([Pool(f, name="free"), Pool(1 - f, Liberation("first_order", rate=float(mu_cheng(ga, coeff))), "bound")], R, float(D_cheng(ga)))
rows = []
for ga, s in enz.groupby("ga"):
    t = s.t_day.values * DAY; y = s.release_pct.values; eb = s.errbar_half_pct.values
    p = particle(ga); pred = 100 * release(t, p)
    held = ga in (0.25, 0.625)
    band = [100 * release(t, particle(ga, f)) for f in (fms.min(), fms.max())]
    within = np.isfinite(eb) & (np.abs(pred - y) <= eb)
    res = dict(role="prediction (held out)" if held else "consistency (mu fitted by Cheng on this curve)", f_free=r(f_of(ga), 4),
               mu_per_day=r(mu_cheng(ga) * DAY, 4), rmse_pct=r(rmse(pred, y)), max_abs_err_pct=r(np.abs(pred - y).max()),
               r2=r(r2(pred, y), 4), points=int(len(y)), points_with_errbar=int(np.isfinite(eb).sum()), within_errbar=int(within.sum()),
               rmse_band_pct=[r(rmse(b, y)) for b in band], t_day=s.t_day.round(2).tolist(), data=s.release_pct.round(2).tolist(),
               pred=np.round(pred, 2).tolist())
    if ga == 0.125:
        res["rmse_with_printed_coeff_0p1"] = r(rmse(100 * release(t, particle(ga, coeff=0.1)), y))
    out["test"][f"GA {ga}"] = res; rows.append((ga, held, res["rmse_pct"]))
out["summary"] = dict(rmse_heldout=[r(x[2]) for x in rows if x[1]], rmse_consistency=[r(x[2]) for x in rows if not x[1]],
                      pooled_rmse_all_enzyme=r(rmse(np.concatenate([v["pred"] for v in out["test"].values()]),
                                                    np.concatenate([v["data"] for v in out["test"].values()]))))
save("v1_cheng2010", out)
# ---- figure
col = {0.125: NAVY, 0.25: GRN, 0.375: ORG, 0.625: PUR, 0.875: BLUE}
fig, axs = plt.subplots(1, 3, figsize=(15, 4.4)); tt = np.linspace(0.01, 20, 220) * DAY
for ga, s in pbs.groupby("ga"):
    t3 = tt[tt <= 3.05 * DAY]
    axs[0].plot(t3 / DAY, 100 * fm[ga] * release_analytical(D_cheng(ga) * t3 / R ** 2), color=col[ga], lw=2, label=f"GA {ga} %: f_free = {fm[ga]:.3f}")
    axs[0].plot(s.t_day, s.release_pct, "s", color=col[ga], mfc="white", mew=1.5, ms=6)
for ga, s in enz.groupby("ga"):
    ax = axs[2] if ga in (0.25, 0.625) else axs[1]; o = out["test"][f"GA {ga}"]
    ax.plot(tt / DAY, 100 * release(tt, particle(ga)), color=col[ga], lw=2, label=f"GA {ga} %  RMSE {o['rmse_pct']:.1f}")
    if ga in (0.25, 0.625):
        lo = 100 * release(tt, particle(ga, fms.min())); hi = 100 * release(tt, particle(ga, fms.max()))
        ax.fill_between(tt / DAY, lo, hi, color=col[ga], alpha=.15, lw=0)
    ax.errorbar(s.t_day, s.release_pct, yerr=s.errbar_half_pct.fillna(0), fmt="o", color=col[ga], mfc="white", mew=1.5, ms=5.5, capsize=2.5, lw=1)
axs[0].set_title("(a) calibration: PBS, no enzyme (Fig. 2.6A)\nfree pool by Fick, one number per GA level", loc="left", fontsize=9.5)
axs[1].set_title("(b) collagenase: GA levels whose μ Cheng fitted\n(consistency check)", loc="left", fontsize=9.5)
axs[2].set_title("(c) collagenase: GA levels never used for any parameter\n(prediction; band = range of f_free)", loc="left", fontsize=9.5)
axs[0].set_xlim(0, 3.1); axs[0].set_ylim(0, 50)
for a in axs[1:]: a.set_xlim(0, 20); a.set_ylim(0, 108)
for a in axs: a.set_xlabel("time (day)"); a.set_ylabel("cumulative release (%)"); a.legend(fontsize=8, loc="lower right")
fig.tight_layout(); fig.savefig(os.path.join(FIG, "V1_cheng2010.png"), dpi=170); plt.close(fig)
print(json.dumps(out["calibration"], indent=1)); print({k: (v["role"][:10], v["rmse_pct"], v["within_errbar"], v["points_with_errbar"], v["rmse_band_pct"]) for k, v in out["test"].items()})
print(out["summary"], out["test"]["GA 0.125"]["rmse_with_printed_coeff_0p1"])

````


# FILE: code/validation/v2_hu2024_from_chang2023.py

````python
"""V2 — transfer test between two papers: Chang 2023 (Polymers 15:1504) -> Hu 2024 (Materials 17:3578).
Both: gentamicin (cationic), type-B gelatin, GA-crosslinked microspheres, drug loaded by soaking formed spheres.
Nothing is tuned on Hu:
  f_free : from Chang (plateau of the first release phase / final value), 1.0dM-G (0.83) and 2.5dM-G (0.54) as two bounds
  bound  : liberated in proportion to Hu's OWN measured mass loss of drug-free spheres (Fig. 3)
  D      : Wilke-Chang (gentamicin, 37 C) x Mackie-Meares (phi = 0.1); R = 8.05 um (Hu SEM)
Data: Hu Fig. 5 net release (drug-loaded minus drug-free background), normalised to the 8-24 d plateau.
A DIAGNOSTIC fit (f_weak, k_weak on Hu's first 24 h) is reported separately and is NOT part of the validation."""
from common import *
from grm import *
from scipy.optimize import least_squares
out = {}
d = pd.read_csv(os.path.join(DATA, "release_dataset_audited.csv"))
ch = d[d.case_id == "C5_Chang2023_gentamicin"]; hu = d[(d.case_id == "C6_Hu2024_gentamicin") & d.formulation.str.startswith("m-EmG net")]
# ---- Chang: free fraction = mean of 8-192 h plateau / day-32 value
ff = {}
for form, s in ch.groupby("formulation"):
    if form.startswith("0.5"): continue          # 0.5dM-G: early points missing in the figure
    y = s.set_index("time_h").y_value; ff[form] = float(y.loc[[8, 24, 48, 96, 192]].mean() / y.loc[768])
    out[f"chang_{form}"] = dict(f_free=r(ff[form], 3), early_fraction_of_plateau_1h=r(y.loc[1] / y.loc[[8, 24, 48, 96, 192]].mean(), 3),
                               early_fraction_of_plateau_2h=r(y.loc[2] / y.loc[[8, 24, 48, 96, 192]].mean(), 3))
# ---- Hu inputs
g = pd.read_csv(os.path.join(DATA, "hu2024_mass_remaining.csv"))
lib = Liberation.from_mass_remaining(g.t_day.values * DAY, g.mass_remaining_pct.values / 100)
Dw = float(wilke_chang(DRUGS["gentamicin"]["V"])); D = Dw * mackie_meares(0.1); R = 8.05e-4
t_h = hu.time_h.values; y_raw = hu.y_value.values; plateau = y_raw[(t_h >= 192) & (t_h <= 576)].mean(); y = 100 * y_raw / plateau
def part(f): return Particle([Pool(f, name="free"), Pool(1 - f, lib, "bound")], R, D)
for form, f in ff.items():
    pred = 100 * release(t_h * H, part(f))
    out[f"hu_pred_with_{form}"] = dict(f_free=r(f, 3), rmse_all=r(rmse(pred, y)), rmse_after_1d=r(rmse(pred[t_h >= 24], y[t_h >= 24])),
                                       rmse_first_8h=r(rmse(pred[t_h <= 8], y[t_h <= 8])), pred=np.round(pred, 1).tolist())
# ---- prediction B: the whole first-phase pool desorbs first order with the rate seen in Chang's PBS data at 1 h
k_ch = -np.log(1 - out["chang_1.0dM-G"]["early_fraction_of_plateau_1h"]) / H
def part_w(f): return Particle([Pool(f, Liberation("first_order", rate=k_ch), "weak"), Pool(1 - f, lib, "bound")], R, D)
predB = 100 * release(t_h * H, part_w(ff["1.0dM-G"]))
out["hu_pred_B_weak_rate_from_chang"] = dict(k_weak_per_h=r(k_ch * H, 3), half_life_h=r(np.log(2) / k_ch / H, 2), rmse_all=r(rmse(predB, y)),
                                             rmse_after_1d=r(rmse(predB[t_h >= 24], y[t_h >= 24])), rmse_first_8h=r(rmse(predB[t_h <= 8], y[t_h <= 8])),
                                             pred=np.round(predB, 1).tolist())
out["hu_data"] = dict(t_h=t_h.tolist(), y_pct_of_plateau=np.round(y, 1).tolist(), D_cm2s=D, tau_D_s=R ** 2 / (np.pi ** 2 * D))
# ---- diagnostic: what desorption law would the first 24 h need?  (fitted -> NOT validation)
fbest = ff["1.0dM-G"]
def model_w(p, t):
    fw, kw = p
    pp = Particle([Pool(max(fbest - fw, 0), name="free"), Pool(fw, Liberation("first_order", rate=kw), "weak"), Pool(1 - max(fbest - fw, 0) - fw, lib, "bound")], R, D)
    return 100 * release(t * H, pp)
m24 = t_h <= 24
fit = least_squares(lambda p: model_w(p, t_h[m24]) - y[m24], x0=[0.5, 1 / (3 * H)], bounds=([0, 1e-7], [fbest, 1e-2]), x_scale=[0.1, 1e-4])
pw = model_w(fit.x, t_h)
out["diagnostic_weak_pool_fit_on_hu_first_24h"] = dict(f_weak=r(fit.x[0], 3), k_weak_per_h=r(fit.x[1] * H, 4), half_life_h=r(np.log(2) / fit.x[1] / H, 2),
                                                        rmse_first_24h=r(rmse(pw[m24], y[m24])), rmse_after_1d=r(rmse(pw[t_h >= 24], y[t_h >= 24])),
                                                        note="fitted on Hu; shows the size of the missing mechanism, not a validation")
save("v2_hu2024_from_chang2023", out)
tt = np.concatenate([np.geomspace(0.05, 24, 80), np.linspace(24, 780, 120)[1:]])
fig, axs = plt.subplots(1, 2, figsize=(13, 4.3))
for ax, log in zip(axs, (True, False)):
    for form, ls in zip(ff, ("-", "--")):
        ax.plot(tt, 100 * release(tt * H, part(ff[form])), color=GRN, lw=2.2 if ls == "-" else 1.3, ls=ls, label=f"prediction, f_free = {ff[form]:.2f} (Chang {form})")
    ax.plot(tt, 100 * release(tt * H, part_w(ff["1.0dM-G"])), color=BLUE, lw=1.6, label=f"prediction B: first phase desorbs at Chang's PBS rate (t½ = {np.log(2) / k_ch / H:.2f} h)")
    ax.plot(tt, model_w(fit.x, tt), color=ORG, lw=1.3, ls=":", label=f"diagnostic only: + weak pool fitted on Hu ≤ 24 h (t½ = {np.log(2) / fit.x[1] / H:.1f} h)")
    ax.plot(t_h, y, "ko", ms=5, label="Hu 2024, net release (% of plateau)")
    ax.plot(g.t_day * 24, 100 - g.mass_remaining_pct, color=GREY, ls=":", lw=1.2, label="measured mass loss, drug-free spheres (%)")
    ax.set_ylim(0, 112); ax.set_ylabel("cumulative release (%)")
    if log: ax.set_xscale("log"); ax.set_xlim(0.5, 800); ax.set_xlabel("time (h, log)")
    else: ax.set_xlim(0, 800); ax.set_xlabel("time (h)")
axs[0].set_title("(a) Hu 2024 predicted with nothing tuned on Hu (log time)", loc="left", fontsize=9.5)
axs[1].set_title("(b) linear time", loc="left", fontsize=9.5); axs[1].legend(fontsize=7.6, loc="lower right")
fig.tight_layout(); fig.savefig(os.path.join(FIG, "V2_hu2024_from_chang2023.png"), dpi=170); plt.close(fig)
print(json.dumps({k: {kk: vv for kk, vv in v.items() if kk not in ("pred", "t_h", "y_pct_of_plateau")} for k, v in out.items()}, indent=1))

````


# FILE: code/validation/v3_mladenovska2002.py

````python
"""V3 — size effect in an enzymatic medium: Mladenovska et al. 2002 (Int J Pharm 242:247).
BSA in GA-crosslinked gelatin microspheres, six sizes (mean diameter 1.99-7.03 um), collagenase, 37 C.
The paper measured BOTH the release (Fig. 2) and the mass remaining of drug-free spheres of the same six series (Fig. 1).
Model: all BSA is network-bound (a 66 kDa protein cannot diffuse out of an intact GA network: f_free = 0); it is
liberated in proportion to the measured mass loss and leaves through a first-order exit step with time tau_exit.
Fick exit with any plausible D for BSA empties a 3.5 um sphere in seconds (shown below), so the exit is front-controlled.
Calibration: tau_exit on the LARGEST size (A) only. Test: sizes B-F with tau_exit = tau_A * d / d_A (front speed constant).
The scaling exponent 1 is a hypothesis (surface/front control); the free exponent fitted per size is reported as a check."""
from common import *
from grm import *
from scipy.optimize import minimize_scalar
m = pd.read_csv(os.path.join(DATA, "mladenovska2002_digitized.csv"))
diam = m.groupby("series").mean_diameter_um.first().to_dict()
def series(k):
    s = m[m.series == k]; rel = s[s.quantity == "BSA_cumulative_release"]; ms = s[s.quantity == "blank_sphere_mass_remaining"]
    return rel.t_h.values, rel.value_pct.values, ms.t_h.values, ms.value_pct.values / 100
def particle(k, tau_h):
    _, _, tm, g = series(k)
    return Particle([Pool(1.0, Liberation.from_mass_remaining(tm * H, g, normalise=False), "bound")], exit="first_order", tau_exit_s=tau_h * H)
def err(k, tau_h):
    tr, y, _, _ = series(k); p = 100 * release(tr[1:] * H, particle(k, tau_h)); return rmse(p, y[1:])
out = dict(fick_check={}, per_size={})
for k in diam:   # Fick exit, BSA D_w ~ 8e-7 cm2/s even reduced 100x
    R = diam[k] / 2 * 1e-4; out["fick_check"][k] = {"tau_D_s_at_D_8e-9_cm2s": r(R ** 2 / (np.pi ** 2 * 8e-9), 2)}
tauA = minimize_scalar(lambda x: err("A", x), bounds=(0.05, 30), method="bounded").x
free = {}
for k in diam:
    free[k] = minimize_scalar(lambda x: err(k, x), bounds=(0.05, 30), method="bounded").x
    tk = tauA * diam[k] / diam["A"]
    out["per_size"][k] = dict(diameter_um=diam[k], role="calibration" if k == "A" else "prediction", tau_exit_h=r(tk, 3),
                              rmse_pct=r(err(k, tk)), rmse_release_equals_massloss_pct=r(err(k, 1e-4)), tau_free_fit_h=r(free[k], 3))
D = np.array(list(diam.values())); T = np.array([free[k] for k in diam])
out["tau_vs_diameter_exponent_free_fit"] = r(np.polyfit(np.log(D), np.log(T), 1)[0], 3)
out["front_speed_um_per_h"] = r(diam["A"] / 2 / tauA, 3)
out["rmse_predicted_sizes"] = [out["per_size"][k]["rmse_pct"] for k in diam if k != "A"]
save("v3_mladenovska2002", out)
cols = dict(A="#0000FF", B="#008000", C="#FF0000", D="#00BFBF", E="#BF00BF", F="#BFBF00")
fig, axs = plt.subplots(1, 2, figsize=(12.5, 4.3)); tt = np.linspace(0.02, 24, 300)
for k in diam:
    tr, y, tm, g = series(k); o = out["per_size"][k]
    axs[0].plot(tm, 100 * (1 - g), "s--", color=cols[k], ms=3.5, lw=1, label=f"{k}: d = {diam[k]} µm")
    axs[1].plot(tt, 100 * release(tt * H, particle(k, o["tau_exit_h"])), color=cols[k], lw=1.6 if k != "A" else 2.6,
                label=f"{k} ({o['role'][:5]}.) RMSE {o['rmse_pct']:.1f}")
    axs[1].plot(tr, y, "o", color=cols[k], ms=4.5, mfc="white", mew=1.3)
axs[0].set_xlim(0, 72); axs[0].set_ylim(0, 100); axs[0].set_xlabel("time (h)"); axs[0].set_ylabel("mass lost, drug-free spheres (%)")
axs[0].set_title("(a) measured input: degradation of blank spheres (Fig. 1)", loc="left", fontsize=9.5); axs[0].legend(fontsize=8)
axs[1].set_xlim(0, 24); axs[1].set_ylim(0, 100); axs[1].set_xlabel("time (h)"); axs[1].set_ylabel("BSA released (%)"); axs[1].legend(fontsize=7.8, loc="lower right")
axs[1].set_title("(b) release: τ_exit from size A only, scaled with diameter for B–F", loc="left", fontsize=9.5)
fig.tight_layout(); fig.savefig(os.path.join(FIG, "V3_mladenovska2002.png"), dpi=170); plt.close(fig)
print(json.dumps(out, indent=1)[:2500])

````


# FILE: code/validation/v4_saravanan2011_negative_control.py

````python
"""V4 — negative control: Saravanan et al. 2011 (J Drug Target 19:96). Diclofenac sodium (anionic) in GA-crosslinked
type-B gelatin microspheres, three loadings (9.8 / 18.3 / 26.7 % w/w), R = 18.9 / 20.3 / 22.7 um, PBS 37 C, 30 days.
Question: can diffusion of free drug with an INDEPENDENT D explain the data? (It cannot: the model must not pass.)
The full multi-pool model is NOT testable on this paper: no mass-loss, swelling or binding data were reported, so the
liberation law of the retained drug is unknown. A fitted apparent D is reported as a diagnostic only."""
from common import *
from grm import *
from scipy.optimize import minimize_scalar
d = pd.read_csv(os.path.join(DATA, "saravanan2011_fig6_vector.csv")); d = d[d.time_day_raw > 0.5]
Rum = {"GM1": 18.945, "GM2": 20.31, "GM3": 22.705}
Dw = float(wilke_chang(DRUGS["diclofenac"]["V"])); tau50 = 0.030546524298
out = dict(Dw_cm2s=Dw, V_LeBas=DRUGS["diclofenac"]["V"], cases={})
for form, s in d.groupby("formulation", sort=False):
    k = form.split()[0]; R = Rum[k] * 1e-4; t = s.time_day_raw.values * DAY; y = s.release_pct.values
    t50_obs = float(np.interp(50, y, s.time_day_raw.values))
    pred = {f"phi={phi}": tau50 * R ** 2 / (Dw * mackie_meares(phi)) for phi in (0.05, 0.1, 0.3)}
    obj = lambda lD: rmse(100 * release_analytical(10 ** lD * t / R ** 2), y)
    fit = minimize_scalar(obj, bounds=(-18, -8), method="bounded")
    out["cases"][k] = dict(R_um=Rum[k], t50_obs_day=r(t50_obs, 2), t50_fick_s={kk: r(v, 4) for kk, v in pred.items()},
                           ratio_obs_over_fick=[float(f"{t50_obs * DAY / v:.3g}") for v in pred.values()],
                           diagnostic_apparent_D_cm2s=float(f"{10 ** fit.x:.3g}"), diagnostic_rmse_pct=r(fit.fun),
                           D_w_over_apparent_D=float(f"{Dw / 10 ** fit.x:.3g}"))
save("v4_saravanan2011_negative_control", out)
fig, a = plt.subplots(figsize=(6.6, 4.3))
for (form, s), c in zip(d.groupby("formulation", sort=False), (BLUE, ORG, GRN)):
    k = form.split()[0]; R = Rum[k] * 1e-4; tt = np.linspace(0.01, 30, 300) * DAY
    a.errorbar(s.time_day_raw, s.release_pct, yerr=s.SE_pct_from_caps, fmt="o", color=c, mfc="white", ms=5, capsize=2, label=f"{form} data")
    a.plot(tt / DAY, 100 * release_analytical(out["cases"][k]["diagnostic_apparent_D_cm2s"] * tt / R ** 2), color=c, lw=1.2, ls="--")
a.axhline(100, color=RED, lw=2); a.text(0.6, 93, "Fick with independent D (Wilke–Chang × Mackie–Meares): 100 % within 1 s", color=RED, fontsize=8)
a.set_xlabel("time (day)"); a.set_ylabel("cumulative release (%)"); a.set_ylim(0, 105); a.legend(fontsize=8, loc="center right")
a.set_title("V4 negative control: Saravanan 2011 (dashed: fitted apparent D, diagnostic only)", loc="left", fontsize=9)
fig.tight_layout(); fig.savefig(os.path.join(FIG, "V4_saravanan2011.png"), dpi=170); plt.close(fig)
print(json.dumps(out, indent=1))

````


# FILE: code/validation/w1_parameter_weights.py

````python
"""W1 — parameter weights.
  a) local elasticities  E = d ln(output) / d ln(parameter)  in the two validated regimes (Cheng, Hu)
  b) regime map: elasticity of t50 vs the dimensionless number  Lambda = mu * tau_D  (liberation rate x diffusion time)
  c) time-resolved weight of diffusion vs liberation (degree of rate control, Campbell 2001)"""
from common import *
from grm import *
out = {}
F = lambda p: (lambda t: release(t, Particle([Pool(p["f_free"], name="free"), Pool(1 - p["f_free"], Liberation("first_order", rate=p["mu"]), "bound")], p["R"], p["D"]), nq=900))
def T(level, hi): return lambda f: t_at(f, level, 1.0, hi)
# ---- a1) Cheng regime (GA 0.375 %), GA itself acts through D(GA) and mu(GA)
cal = json.load(open(os.path.join(RES, "v1_cheng2010.json")))["calibration"]
for ga in (0.125, 0.375, 0.875):
    p0 = dict(R=50e-4, D=float(D_cheng(ga)), f_free=cal[f"GA {ga}"]["f_free"], mu=float(mu_cheng(ga)))
    outs = {"F(1 d)": lambda f: f(np.array([DAY]))[0], "t50": T(0.5, 60 * DAY), "t90": T(0.9, 120 * DAY)}
    base, E = elasticities(F, p0, ["R", "D", "f_free", "mu"], outs)
    G = lambda x: dict(p0, D=float(D_cheng(x)), mu=float(mu_cheng(x)))
    E["GA"] = {o: float((np.log(g(F(G(ga * 1.1)))) - np.log(g(F(G(ga / 1.1))))) / (2 * np.log(1.1))) for o, g in outs.items()}
    out[f"cheng_GA{ga}"] = dict(base={k: (v / DAY if k.startswith("t") else v) for k, v in base.items()}, E=E)
# ---- a2) Hu regime: weak pool at Chang's PBS rate, bound pool via measured mass loss (time-scale factor s_deg)
v2 = json.load(open(os.path.join(RES, "v2_hu2024_from_chang2023.json")))
g = pd.read_csv(os.path.join(DATA, "hu2024_mass_remaining.csv")); tg = g.t_day.values * DAY; gv = g.mass_remaining_pct.values / 100
kw = v2["hu_pred_B_weak_rate_from_chang"]["k_weak_per_h"] / H; Dh = v2["hu_data"]["D_cm2s"]
def F2(p):
    lib = Liberation.from_mass_remaining(tg / p["s_deg"], gv)
    return lambda t: release(t, Particle([Pool(p["f_free"], Liberation("first_order", rate=p["k_weak"]), "weak"), Pool(1 - p["f_free"], lib, "bound")], p["R"], p["D"]), nq=900)
p2 = dict(R=8.05e-4, D=Dh, f_free=0.828, k_weak=kw, s_deg=1.0)
base, E = elasticities(F2, p2, ["R", "D", "f_free", "k_weak", "s_deg"],
                       {"F(1 h)": lambda f: f(np.array([H]))[0], "F(1 d)": lambda f: f(np.array([DAY]))[0], "t95": T(0.95, 60 * DAY)})
out["hu_regime"] = dict(base={k: (v / DAY if k.startswith("t") else v) for k, v in base.items()}, E=E)
# ---- b) regime map
lams = np.geomspace(1e-3, 1e3, 25); R0, mu0 = 50e-4, 0.4 / DAY; regime = []
for lam in lams:
    D = R0 ** 2 * mu0 / (np.pi ** 2 * lam)
    p0 = dict(R=R0, D=D, f_free=0.3, mu=mu0)
    tmax = 200 * max(1 / mu0, R0 ** 2 / D)
    _, E = elasticities(F, p0, ["R", "D", "f_free", "mu"], {"t50": T(0.5, tmax)})
    regime.append(dict(Lambda=float(lam), **{k: E[k]["t50"] for k in E}))
out["regime_map"] = regime
# ---- c) time-resolved weights, Cheng GA 0.375 %
p0 = dict(R=50e-4, D=float(D_cheng(0.375)), f_free=cal["GA 0.375"]["f_free"], mu=float(mu_cheng(0.375)))
tw = np.linspace(0.05, 15, 80) * DAY; w = rate_control_weights(F, p0, {"diffusion": "D", "liberation (degradation)": "mu"}, tw)
out["time_weights_cheng_0p375"] = {f"{d} d": r(np.interp(d * DAY, tw, np.nan_to_num(w["diffusion"])), 3) for d in (0.25, 1, 2, 3, 6, 10)}
save("w1_parameter_weights", out)
# ---- figures
fig, axs = plt.subplots(1, 3, figsize=(16, 4.3))
E1 = out["cheng_GA0.375"]["E"]; keys = ["R", "D", "f_free", "mu", "GA"]; x = np.arange(len(keys))
for j, (o, c) in enumerate(zip(("F(1 d)", "t50", "t90"), (BLUE, NAVY, ORG))): axs[0].bar(x + (j - 1) * .26, [E1[k][o] for k in keys], .26, color=c, label=o)
axs[0].set_xticks(x); axs[0].set_xticklabels(["radius\nR", "diffusivity\nD", "free\nfraction", "degradation\nμ", "GA %\n(via D, μ)"], fontsize=8)
axs[0].axhline(0, color="k", lw=.8); axs[0].legend(fontsize=8); axs[0].set_ylabel("elasticity ∂lnY/∂lnX"); axs[0].set_title("(a) Cheng regime, GA 0.375 %, 100 µm sphere", loc="left", fontsize=9.5)
E2 = out["hu_regime"]["E"]; keys2 = ["R", "D", "f_free", "k_weak", "s_deg"]; x = np.arange(len(keys2))
for j, (o, c) in enumerate(zip(("F(1 h)", "F(1 d)", "t95"), (BLUE, NAVY, ORG))): axs[1].bar(x + (j - 1) * .26, [E2[k][o] for k in keys2], .26, color=c, label=o)
axs[1].set_xticks(x); axs[1].set_xticklabels(["radius\nR", "diffusivity\nD", "first-phase\nfraction", "desorption\nrate", "degradation\nrate"], fontsize=8)
axs[1].axhline(0, color="k", lw=.8); axs[1].legend(fontsize=8); axs[1].set_title("(b) Hu regime, 16 µm sphere, gentamicin", loc="left", fontsize=9.5)
a = axs[2]; L = [x["Lambda"] for x in regime]
for k, c, lab in (("R", NAVY, "radius R"), ("D", BLUE, "diffusivity D"), ("mu", ORG, "degradation rate μ"), ("f_free", GRN, "free fraction")):
    a.semilogx(L, [x[k] for x in regime], "-", color=c, lw=2, label=lab)
a.axvline(1, color=GREY, ls=":"); a.axhline(0, color="k", lw=.6)
a.set_xlabel("Λ = μ · R²/(π² D)   (diffusion time / degradation time)"); a.set_ylabel("elasticity of t50")
a.set_title("(c) which parameter matters: regime map (f_free = 0.3)", loc="left", fontsize=9.5); a.legend(fontsize=8)
a.text(1.3e-3, -0.9, "degradation-limited", fontsize=8, color=GREY); a.text(30, -0.9, "diffusion-limited", fontsize=8, color=GREY)
fig.tight_layout(); fig.savefig(os.path.join(FIG, "W1_parameter_weights.png"), dpi=170); plt.close(fig)
fig, a = plt.subplots(figsize=(6.4, 4))
a.stackplot(tw / DAY, 100 * np.nan_to_num(w["diffusion"]), 100 * np.nan_to_num(w["liberation (degradation)"]), colors=[BLUE, ORG], alpha=.9, labels=["diffusion", "liberation by degradation"])
a.plot(tw / DAY, 100 * F(p0)(tw), color="k", lw=1.6, label="cumulative release (%)"); a.set_ylim(0, 100); a.set_xlabel("time (day)"); a.set_ylabel("weight (%)")
a.legend(fontsize=8, loc="center right"); a.set_title("W1: time-resolved rate control, Cheng GA 0.375 %", loc="left", fontsize=9.5)
fig.tight_layout(); fig.savefig(os.path.join(FIG, "W1_time_weights.png"), dpi=170); plt.close(fig)
print(json.dumps({k: v for k, v in out.items() if k != "regime_map"}, indent=1)[:3500])
print([(round(x["Lambda"], 3), round(x["R"], 2), round(x["D"], 2), round(x["mu"], 2), round(x["f_free"], 2)) for x in regime[::4]])

````


# FILE: code/validation/w2_all_parameters.py

````python
"""W2 — which parameters control release, and how much? All stages: Fick -> swelling -> crosslinking/binding -> degradation -> other.

Three complementary measures
  (1) global variance-based sensitivity (Sobol first-order S1 and total ST, Saltelli/Jansen estimators, scrambled Sobol
      sampling, bootstrap 95 % intervals) over the parameter ranges of three regimes -> "weight" of each parameter
  (2) local elasticities d ln Y / d ln X at the validated reference points (Cheng, Hu)
  (3) time-resolved weight of each MECHANISM (degree of rate control: hydration, diffusion, desorption, degradation)
Model: grm.fast (closed form of Eq. 1 with hydration gating), verified against grm.release / the PDE in tests/test_fast.py.
Ranges are stated in REGIMES below with their basis; they are design ranges, not fitted values."""
from common import *
from grm import D_cheng, mu_cheng
from grm.fast import release_fast, derived, D_water_from_MW
from scipy.stats import qmc
TG = np.geomspace(30, 400 * DAY, 110)
STAGE = {"R_dry": "Fick", "MW": "Fick", "Q": "swelling", "D_coop": "swelling", "K_b": "crosslink / binding", "f_free": "crosslink / binding",
         "w_weak": "crosslink / binding", "t_weak_h": "crosslink / binding", "t_deg_d": "degradation", "f_irr": "other",
         "GA": "crosslink / binding", "enzyme": "degradation"}
SCOL = {"Fick": BLUE, "swelling": PUR, "crosslink / binding": GRN, "degradation": ORG, "other": GREY}
LABEL = {"R_dry": "dry radius R_dry", "MW": "drug size (MW)", "Q": "swelling ratio Q", "D_coop": "gel network diffusivity D_coop (hydration time)",
         "K_b": "fast binding K_b (1+K_b)", "f_free": "free fraction f_free", "w_weak": "share of weakly bound drug", "t_weak_h": "desorption half-life",
         "t_deg_d": "degradation half-life", "f_irr": "non-releasable fraction", "GA": "GA concentration", "enzyme": "enzyme level"}
# (name, lo, hi, log-uniform?)
REGIMES = {
 "A": dict(title="A: GA microspheres 5–50 µm, small drug, buffer (Saravanan, Chang, Hu, Liu type)",
           p=[("R_dry", 2.5e-4, 25e-4, True), ("MW", 200, 1500, True), ("Q", 1.5, 8, False), ("D_coop", 1e-8, 1e-6, True),
              ("K_b", 1, 1e3, True), ("f_free", 0.05, 0.9, False), ("w_weak", 0, 1, False), ("t_weak_h", 0.05, 24, True),
              ("t_deg_d", 2, 60, True), ("f_irr", 0, 0.2, False)]),
 "B": dict(title="B: large swollen spheres with strongly hindered diffusion + enzyme (Cheng type)",
           p=[("R_dry", 15e-4, 40e-4, True), ("MW", 300, 1500, True), ("Q", 3, 10, False), ("D_coop", 1e-8, 1e-6, True),
              ("K_b", 1e3, 1e7, True), ("f_free", 0.3, 0.7, False), ("w_weak", 0, 0.5, False), ("t_weak_h", 0.1, 24, True),
              ("t_deg_d", 0.5, 5, True), ("f_irr", 0, 0.05, False)]),
 "C": dict(title="C: Cheng system, design variables only (GA %, radius, enzyme level, free fraction)",
           p=[("GA", 0.125, 0.875, False), ("R_dry", 25e-4, 75e-4, True), ("enzyme", 0.25, 4, True), ("f_free", 0.3, 0.7, False)]),
}
def model(names, X):
    """X: (M, k) physical values -> F on TG grid (M, T)."""
    v = dict(zip(names, X.T))
    if "GA" in v:     # regime C: Cheng relations; R_dry here is the swollen radius; mu proportional to enzyme level (Cheng, Sec. 2.4)
        return release_fast(TG, v["R_dry"], D_cheng(v["GA"]), v["f_free"], 0.0, 1.0, mu_cheng(v["GA"]) * v["enzyme"], 0.0, 0.0)
    f_irr = v["f_irr"]; f_free = v["f_free"] * (1 - f_irr); f_weak = v["w_weak"] * (1 - f_irr - f_free)
    R, D, tau = derived(dict(R_dry=v["R_dry"], Q=v["Q"], MW=v["MW"], K_b=v["K_b"], D_coop=v["D_coop"]))
    return release_fast(TG, R, D, f_free, f_weak, np.log(2) / (v["t_weak_h"] * H), np.log(2) / (v["t_deg_d"] * DAY), f_irr, tau)
def outputs(F):
    lt = np.log10(TG); o = {}
    for lev, nm in ((0.5, "log10 t50"), (0.9, "log10 t90")):
        idx = (F >= lev).argmax(1); ok = F[:, -1] >= lev; i0 = np.clip(idx - 1, 0, len(TG) - 1)
        f0, f1 = F[np.arange(len(F)), i0], F[np.arange(len(F)), idx]
        frac = np.where(f1 > f0, (lev - f0) / np.where(f1 > f0, f1 - f0, 1), 0)
        o[nm] = np.where(ok, lt[i0] + frac * (lt[idx] - lt[i0]), lt[-1])            # not reached in 400 d -> capped
    for tq, nm in ((H, "F(1 h)"), (DAY, "F(1 d)"), (7 * DAY, "F(7 d)")):
        o[nm] = np.array([np.interp(np.log10(tq), lt, f) for f in F])
    return o
def scale(names, U, spec):
    X = np.empty_like(U)
    for j, (n, lo, hi, lg) in enumerate(spec):
        X[:, j] = 10 ** (np.log10(lo) + U[:, j] * (np.log10(hi) - np.log10(lo))) if lg else lo + U[:, j] * (hi - lo)
    return X
def sobol(spec, N=int(os.environ.get("GRM_SOBOL_N", 1024)), seed=1):
    names = [s[0] for s in spec]; k = len(names)
    U = qmc.Sobol(2 * k, scramble=True, seed=seed).random(N); A, B = U[:, :k], U[:, k:]
    mats = [A, B] + [np.where(np.arange(k) == i, B, A) for i in range(k)]
    Y = outputs(model(names, scale(names, np.vstack(mats), spec)))
    res = {}
    rng = np.random.default_rng(0)
    for o, y in Y.items():
        fA, fB = y[:N], y[N:2 * N]; fAB = [y[(2 + i) * N:(3 + i) * N] for i in range(k)]
        def est(ix):
            V = np.var(np.concatenate([fA[ix], fB[ix]]))
            return np.array([[np.mean(fB[ix] * (fAB[i][ix] - fA[ix])) / V, 0.5 * np.mean((fA[ix] - fAB[i][ix]) ** 2) / V] for i in range(k)])
        base = est(np.arange(N)); bs = np.array([est(rng.integers(0, N, N)) for _ in range(200)])
        lo, hi = np.percentile(bs, 2.5, 0), np.percentile(bs, 97.5, 0)
        res[o] = {n: dict(S1=float(base[i, 0]), ST=float(base[i, 1]), S1_ci=[float(lo[i, 0]), float(hi[i, 0])], ST_ci=[float(lo[i, 1]), float(hi[i, 1])])
                  for i, n in enumerate(names)}
        res[o]["_variance"] = float(np.var(np.concatenate([fA, fB]))); res[o]["_mean"] = float(np.mean(np.concatenate([fA, fB])))
    return res
out = dict(regimes={}, note="Sobol indices: share of output variance explained by each parameter alone (S1) and with all its interactions (ST).")
for key, Rg in REGIMES.items():
    out["regimes"][key] = dict(title=Rg["title"], ranges={s[0]: [s[1], s[2], "log" if s[3] else "lin"] for s in Rg["p"]}, sobol=sobol(Rg["p"]))
    print(key, {o: {n: round(v["ST"], 2) for n, v in d.items() if not n.startswith("_")} for o, d in out["regimes"][key]["sobol"].items()})
# ---------------- (2) local elasticities at the validated reference points, primitive parameters
cal = json.load(open(os.path.join(RES, "v1_cheng2010.json")))["calibration"]
Dw_tb = float(D_water_from_MW(872.9))
Qc = 6.0                                    # Cheng: swelling ratio ~500 % by weight -> Q ~ 6 (assumption: densities ~1)
Kb_c = float(Dw_tb * ((1 - 1 / Qc) / (1 + 1 / Qc)) ** 2 / D_cheng(0.375) - 1)      # binding that reproduces Cheng's fitted D
REF = {
 "cheng_GA0.375": dict(R_dry=50e-4 / Qc ** (1 / 3), MW=872.9, Q=Qc, D_coop=1e-7, K_b=Kb_c, f_free=cal["GA 0.375"]["f_free"], w_weak=0.0, t_weak_h=1.0,
                       t_deg_d=np.log(2) / (mu_cheng(0.375) * DAY), f_irr=0.0),
 "hu_like": dict(R_dry=8.05e-4, MW=477.6, Q=3.0, D_coop=1e-7, K_b=1.0, f_free=1e-3, w_weak=0.828 / (1 - 1e-3), t_weak_h=0.72, t_deg_d=11.0, f_irr=0.0),
}
names = list(REF["cheng_GA0.375"]); out["reference_points"] = {}
for nm, p0 in REF.items():
    X0 = np.array([[p0[n] for n in names]]); h = 1.1; E = {}
    base = {k: float(v[0]) for k, v in outputs(model(names, X0)).items()}
    for j, n in enumerate(names):
        if p0[n] == 0: continue
        up, dn = X0.copy(), X0.copy(); up[0, j] *= h; dn[0, j] /= h
        if n == "w_weak": up[0, j] = min(up[0, j], 1.0)
        ou, od = outputs(model(names, up)), outputs(model(names, dn))
        E[n] = {k: float((ou[k][0] - od[k][0]) / np.log(h ** 2) / np.log(10) * np.log(10) if k.startswith("log10") else
                         (np.log(max(ou[k][0], 1e-12)) - np.log(max(od[k][0], 1e-12))) / (2 * np.log(h))) for k in ou}
        for k in ("log10 t50", "log10 t90"): E[n][k] = float((ou[k][0] - od[k][0]) / (2 * np.log10(h)))      # = d ln t / d ln X
    out["reference_points"][nm] = dict(values={k: float(v) for k, v in p0.items()}, base=base, elasticity=E,
                                       assumed=["Q", "D_coop"] + (["t_deg_d (first-order equivalent of Hu's mass loss)"] if nm == "hu_like" else []))
# ---------------- (3) time-resolved mechanism weights (degree of rate control on the four rates)
def mech_weights(p0, t):
    R, D, tau = (np.atleast_1d(x) for x in derived(dict(R_dry=p0["R_dry"], Q=p0["Q"], MW=p0["MW"], K_b=p0["K_b"], D_coop=p0["D_coop"])))
    f_free = p0["f_free"] * (1 - p0["f_irr"]); f_weak = p0["w_weak"] * (1 - p0["f_irr"] - f_free)
    rates = dict(hydration=1 / tau[0], diffusion=D[0], desorption=np.log(2) / (p0["t_weak_h"] * H), degradation=np.log(2) / (p0["t_deg_d"] * DAY))
    def F(r): return release_fast(t, R, r["diffusion"], f_free, f_weak, r["desorption"], r["degradation"], p0["f_irr"], 1 / r["hydration"])[0]
    X = {}
    for m in rates:
        if m == "desorption" and f_weak <= 0: continue
        u, d = dict(rates), dict(rates); u[m] *= 1.1; d[m] /= 1.1; X[m] = np.abs(F(u) - F(d)) / (2 * np.log(1.1))
    tot = sum(X.values()); tot = np.where(tot < 1e-9, np.nan, tot)
    return {m: v / tot for m, v in X.items()}, F(rates)
tw = {"cheng_GA0.375": np.geomspace(60, 20 * DAY, 160), "hu_like": np.geomspace(1, 30 * DAY, 160)}
out["mechanism_weights"] = {}
MCOL = dict(hydration=PUR, diffusion=BLUE, desorption=GRN, degradation=ORG)
for nm in REF:
    w, Fm = mech_weights(REF[nm], tw[nm])
    out["mechanism_weights"][nm] = {m: {f"{tq:g} h": float(np.interp(tq * H, tw[nm], np.nan_to_num(v))) for tq in (0.01, 0.1, 1, 8, 24, 72, 240)} for m, v in w.items()}
    out["mechanism_weights"][nm]["_F"] = {f"{tq:g} h": float(np.interp(tq * H, tw[nm], Fm)) for tq in (0.01, 0.1, 1, 8, 24, 72, 240)}
    REF[nm]["_w"], REF[nm]["_F"] = w, Fm
save("w2_all_parameters", out)
# ---------------- figures
fig, axs = plt.subplots(1, 3, figsize=(17, 5.2), gridspec_kw=dict(width_ratios=[1, 1, 0.62]))
for ax, key in zip(axs, ("A", "B", "C")):
    S = out["regimes"][key]["sobol"]; nms = [n for n in S["log10 t50"] if not n.startswith("_")]
    order = sorted(nms, key=lambda n: -S["log10 t50"][n]["ST"]); y = np.arange(len(order))[::-1]
    for j, (o, off, hatch) in enumerate((("log10 t50", 0.2, None), ("F(1 d)", -0.2, "///"))):
        st = [S[o][n]["ST"] for n in order]; ci = np.array([S[o][n]["ST_ci"] for n in order])
        ax.barh(y + off, st, 0.38, color=[SCOL[STAGE[n]] for n in order], hatch=hatch, edgecolor="white" if hatch is None else "k", lw=0.3,
                xerr=[np.clip(st - ci[:, 0], 0, None), np.clip(ci[:, 1] - st, 0, None)], error_kw=dict(lw=0.7, capsize=1.5))
    ax.set_yticks(y); ax.set_yticklabels([LABEL[n] for n in order], fontsize=8); ax.set_xlim(0, 1.0); ax.set_xlabel("total Sobol index ST (share of variance)")
    ax.set_title({"A": "A: GA microspheres 5–50 µm,\nsmall drug, buffer", "B": "B: large swollen spheres, strongly\nhindered diffusion, enzyme (Cheng type)", "C": "C: Cheng system,\ndesign variables only"}[key], loc="left", fontsize=9)
from matplotlib.patches import Patch
axs[0].legend(handles=[Patch(color=c, label=s) for s, c in SCOL.items()] + [Patch(facecolor="white", edgecolor="k", label="solid: t50,  hatched: release at 1 day")],
              fontsize=7.5, loc="lower right")
fig.tight_layout(); fig.savefig(os.path.join(FIG, "W2_global_weights.png"), dpi=170); plt.close(fig)
fig, axs = plt.subplots(1, 2, figsize=(13, 4.2))
for ax, nm, unit, ul in zip(axs, REF, (DAY, H), ("day", "h")):
    w = REF[nm]["_w"]; t = tw[nm]; ms = list(w)
    ax.stackplot(t / unit, *[100 * np.nan_to_num(w[m]) for m in ms], colors=[MCOL[m] for m in ms], labels=ms, alpha=.9)
    ax.plot(t / unit, 100 * REF[nm]["_F"], "k", lw=1.6, label="cumulative release (%)"); ax.set_xscale("log"); ax.set_ylim(0, 100)
    ax.set_xlabel(f"time ({ul}, log)"); ax.set_ylabel("weight of mechanism (%)")
    ax.set_title({"cheng_GA0.375": "(a) Cheng, GA 0.375 %: diffusion then degradation", "hu_like": "(b) Hu-type: hydration → desorption → degradation"}[nm], loc="left", fontsize=9.5)
axs[0].legend(fontsize=8, loc="center left")
fig.tight_layout(); fig.savefig(os.path.join(FIG, "W2_mechanism_weights_time.png"), dpi=170); plt.close(fig)
print(json.dumps(out["reference_points"], indent=1)[:3000]); print(json.dumps(out["mechanism_weights"], indent=1)[:2500])

````


# FILE: code/tests/test_fast.py

````python
import os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0, ROOT)
import numpy as np
from grm import Particle, Pool, Liberation, release, DAY
from grm.model import release_pde
from grm.fast import release_fast, derived
H = 3600.0

def test_fast_equals_superposition_without_hydration():
    t = np.array([0.01, 0.3, 1, 3, 8, 20]) * DAY
    for R, D, ff, fw, kw, mu, fi in [(50e-4, 9.4e-12, 0.47, 0, 1e-4, 4.4e-6, 0), (8e-4, 3e-6, 0.3, 0.4, 1 / (2 * H), 1 / (10 * DAY), 0.05)]:
        p = Particle([Pool(ff), Pool(fw, Liberation("first_order", rate=kw)), Pool(1 - ff - fw - fi, Liberation("first_order", rate=mu))], R, D, f_irr=fi)
        assert np.abs(release(t, p) - release_fast(t, R, D, ff, fw, kw, mu, fi)[0]).max() < 1e-5

def test_fast_with_hydration_equals_pde():
    R, D, a, b, kw = 20e-4, 1e-11, 1 / (3 * H), 1 / DAY, 1 / (4 * H)
    s = np.linspace(0, 40 * DAY, 40001); hyp = lambda r: 1 - (r * np.exp(-a * s) - a * np.exp(-r * s)) / (r - a)
    p = Particle([Pool(0.4, Liberation("tabulated", t_tab=s, L_tab=1 - np.exp(-a * s))), Pool(0.2, Liberation("tabulated", t_tab=s, L_tab=hyp(kw))),
                  Pool(0.4, Liberation("tabulated", t_tab=s, L_tab=hyp(b)))], R, D)
    t = np.array([0.05, 0.5, 2, 8, 15]) * DAY
    assert np.abs(release_pde(t, p, N=100) - release_fast(t, R, D, 0.4, 0.2, kw, b, 0, 3 * H)[0]).max() < 3e-4

def test_swelling_cancellation():
    # t50 ~ R^2/D with R = R_dry Q^(1/3), D ~ MM(1/Q): elasticity 2/3 - 4Q/(Q^2-1), zero at Q = 3 + sqrt(10)
    Q0 = 3 + np.sqrt(10); r = lambda Q: (Q ** (2 / 3)) / (((Q - 1) / (Q + 1)) ** 2)
    e = (np.log(r(Q0 * 1.01)) - np.log(r(Q0 / 1.01))) / (2 * np.log(1.01))
    assert abs(e) < 1e-3

````


# FILE: code/tests/test_model.py

````python
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

````


# FILE: code/ml/build_training_table.py

````python
"""Build the two tables a machine-learning layer will train on.

ml/formulations.csv : one row per formulation = design descriptors (inputs X) + identified physical parameters
                      of the mechanistic model (targets Y) + where each target came from.
ml/curves_long.csv  : one row per measured release point (for end-to-end checks of model + ML).

Design principle (see README, "Extending with machine learning"): ML predicts the PHYSICAL PARAMETERS
(f_free, f_weak, k_weak, mu or mass-loss time scale, D, tau_exit, f_irr) from formulation descriptors; the validated
mechanistic model (grm.release) turns them into a curve. ML never predicts raw curves directly.
Unknown values are left empty (NaN) on purpose — never fill them with guesses."""
import os, sys, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0, ROOT)
import numpy as np, pandas as pd
from grm import D_cheng, mu_cheng, DAY
RES, DATA = os.path.join(ROOT, "results"), os.path.join(ROOT, "data")
v1 = json.load(open(os.path.join(RES, "v1_cheng2010.json"))); v2 = json.load(open(os.path.join(RES, "v2_hu2024_from_chang2023.json")))
v3 = json.load(open(os.path.join(RES, "v3_mladenovska2002.json")))
NA = np.nan
base = dict(paper="", doi_or_source="", split_group="", crosslinker="", crosslinker_conc=NA, crosslinker_conc_unit="", crosslink_time_h=NA,
            crosslink_temp_C=NA, crosslink_mode="", crosslink_degree_pct=NA, gelatin_type="", gelatin_IEP=NA, gelatin_bloom=NA, gelatin_conc_pct_w_v=NA,
            particle_fabrication="", R_um=NA, R_basis="", drug="", drug_MW=NA, drug_charge=NA, loading_method="", drug_loading_pct_w_w=NA,
            medium="", enzyme="", enzyme_conc="", ionic_medium="", temperature_C=37.0,
            # ---- targets (physical parameters of grm) and provenance
            f_free=NA, f_weak=NA, k_weak_per_h=NA, mu_per_day=NA, liberation_law="", D_cm2s=NA, tau_exit_h=NA, f_irr=NA,
            target_source="", validation_role="")
rows = []
for ga in (0.125, 0.25, 0.375, 0.625, 0.875):
    t = v1["test"][f"GA {ga}"]
    rows.append(dict(base, paper="Cheng 2010 (PhD, UIUC, Ch. 2)", doi_or_source="dissertation; Figs 2.6A, 2.7, 2.8", split_group="cheng2010",
                     crosslinker="glutaraldehyde", crosslinker_conc=ga, crosslinker_conc_unit="% v/v", crosslink_time_h=24, crosslink_temp_C=4,
                     crosslink_mode="post-crosslinking of dry spheres, pH 5, glycine quench", gelatin_type="basic gelatin (IEP 9.0, Mw 100 kDa, Nitta)",
                     gelatin_IEP=9.0, gelatin_conc_pct_w_v=5, particle_fabrication="electric-field precision particle fabrication (monodisperse)",
                     R_um=50, R_basis="swollen mean diameter 100 um", drug="trypan blue (acidic dye)", drug_MW=872.9, drug_charge=-4,
                     loading_method="absorption of 0.1 % w/v drug solution into dry spheres (5 ul/mg)", medium="PBS pH 7.4",
                     enzyme="collagenase 1A", enzyme_conc="373 ng/ml", ionic_medium="PBS",
                     f_free=t["f_free"], f_weak=0.0, mu_per_day=t["mu_per_day"], liberation_law="first-order enzymatic", D_cm2s=float(D_cheng(ga)), f_irr=0.0,
                     target_source="f_free: calibrated on PBS curve (interpolated in GA for 0.25/0.625); D, mu: published relations (Cheng)",
                     validation_role="held-out prediction" if ga in (0.25, 0.625) else "calibration/consistency"))
kw = v2["hu_pred_B_weak_rate_from_chang"]["k_weak_per_h"]
for form, deg, R in (("1.0dM-G", 55, 21.09 / 2), ("2.5dM-G", 51, 17.36 / 2)):
    rows.append(dict(base, paper="Chang 2023", doi_or_source="10.3390/polym15061504", split_group="chang2023_hu2024", crosslinker="glutaraldehyde",
                     crosslink_mode="post-crosslinking, DAP-modified", crosslink_degree_pct=deg, gelatin_type="type B", R_um=R, R_basis="SEM diameter / 2 (hollow interior)",
                     drug="gentamicin", drug_MW=477.6, drug_charge=5, loading_method="soaking of formed spheres, 24 h", medium="PBS", ionic_medium="PBS",
                     f_free=v2[f"chang_{form}"]["f_free"], k_weak_per_h=kw if form == "1.0dM-G" else NA,
                     liberation_law="measured mass loss (linear regression, Sec. 3.4)", target_source="f_free = first plateau / final value; k_weak from the 1 h point",
                     validation_role="source of transferred parameters"))
rows.append(dict(base, paper="Hu 2024", doi_or_source="10.3390/ma17143578", split_group="chang2023_hu2024", crosslinker="glutaraldehyde", crosslink_time_h=0.5,
                 crosslink_temp_C=5, crosslink_degree_pct=86, gelatin_type="type B", R_um=8.05, R_basis="SEM 16.1 +/- 4.8 um", drug="gentamicin", drug_MW=477.6,
                 drug_charge=5, loading_method="immersion in 10 mg/ml gentamicin, 24 h", medium="deionised water", ionic_medium="none (water)",
                 f_free=0.828, k_weak_per_h=kw, liberation_law="measured mass loss of drug-free spheres (Fig. 3)",
                 target_source="transferred from Chang 2023 (no tuning on Hu)", validation_role="cross-paper prediction"))
for k, o in v3["per_size"].items():
    rows.append(dict(base, paper="Mladenovska 2002", doi_or_source="Int J Pharm 242 (2002) 247", split_group="mladenovska2002", crosslinker="glutaraldehyde",
                     crosslinker_conc=0.05, crosslinker_conc_unit="mg GA / mg gelatin (saturated toluene)", crosslink_time_h=4, crosslink_temp_C=0,
                     R_um=o["diameter_um"] / 2, R_basis=f"series {k}, mean diameter", drug="BSA", drug_MW=66500, drug_charge=NA,
                     loading_method="incorporated before crosslinking", medium="buffer + collagenase", enzyme="collagenase",
                     f_free=0.0, liberation_law="measured mass loss of blank spheres (Fig. 1)", tau_exit_h=o["tau_exit_h"],
                     target_source="tau_exit from size A, scaled with diameter", validation_role=o["role"]))
F = pd.DataFrame(rows); F.to_csv(os.path.join(os.path.dirname(__file__), "formulations.csv"), index=False)
# long table of measured points
L = []
c = pd.read_csv(os.path.join(DATA, "cheng2010_release_vector.csv"))
for _, x in c[c.t_day > 0.5].iterrows():
    L.append(dict(split_group="cheng2010", paper="Cheng 2010", formulation=x.series + (" PBS" if x.figure == "2.6A" else " collagenase"), t_h=x.t_day * 24,
                  release_pct=x.release_pct, err_pct=x.errbar_half_pct, normalisation="% of loaded drug", evidence="VECTOR_EXTRACTED"))
a = pd.read_csv(os.path.join(DATA, "release_dataset_audited.csv"))
for _, x in a[a.include_in_fit == True].iterrows():
    L.append(dict(split_group=x.case_id, paper=x.case_id.split("_")[1], formulation=x.formulation, t_h=x.time_h, release_pct=x.y_value,
                  err_pct=x.y_reported_error, normalisation=x.y_unit, evidence=x.evidence))
m = pd.read_csv(os.path.join(DATA, "mladenovska2002_digitized.csv"))
for _, x in m[(m.quantity == "BSA_cumulative_release") & (m.t_h > 0)].iterrows():
    L.append(dict(split_group="mladenovska2002", paper="Mladenovska 2002", formulation=f"series {x.series}", t_h=x.t_h, release_pct=x.value_pct,
                  err_pct=NA, normalisation="% of loaded BSA", evidence="DIGITIZED_RASTER"))
pd.DataFrame(L).to_csv(os.path.join(os.path.dirname(__file__), "curves_long.csv"), index=False)
print(F[["paper", "crosslinker_conc", "R_um", "drug", "f_free", "k_weak_per_h", "mu_per_day", "tau_exit_h", "validation_role"]].to_string())
print(len(L), "measured points")

````


# FILE: code/simulator/build_simulator.py

````python
"""Builds simulator/grm_simulator.html (single self-contained file, works offline) from the template and the
project data/results. Run after validation/run_all.py:   python simulator/build_simulator.py"""
import os, json, numpy as np, pandas as pd
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
D, R = os.path.join(ROOT, "data"), os.path.join(ROOT, "results")
v1 = json.load(open(os.path.join(R, "v1_cheng2010.json"))); v2 = json.load(open(os.path.join(R, "v2_hu2024_from_chang2023.json")))
v3 = json.load(open(os.path.join(R, "v3_mladenovska2002.json"))); v4 = json.load(open(os.path.join(R, "v4_saravanan2011_negative_control.json")))
c = pd.read_csv(os.path.join(D, "cheng2010_release_vector.csv")); c = c[c.t_day > 0.5]; c["ga"] = c.series.str.extract(r"GA ([0-9.]+)")
cheng = dict(R_um=50, cal={k.split()[1]: v["f_free"] for k, v in v1["calibration"].items()},
             pbs={g: s[["t_day", "release_pct"]].round(3).values.tolist() for g, s in c[c.figure == "2.6A"].groupby("ga")},
             enz={g: s[["t_day", "release_pct", "errbar_half_pct"]].fillna(0).round(3).values.tolist() for g, s in c[c.figure != "2.6A"].groupby("ga")})
g = pd.read_csv(os.path.join(D, "hu2024_mass_remaining.csv"))
hu = dict(t_h=v2["hu_data"]["t_h"], y=v2["hu_data"]["y_pct_of_plateau"], mass_t_day=g.t_day.tolist(), mass_rem=g.mass_remaining_pct.tolist(),
          R_um=8.05, D=v2["hu_data"]["D_cm2s"], f_first=v2["chang_1.0dM-G"]["f_free"], k_weak_h=v2["hu_pred_B_weak_rate_from_chang"]["k_weak_per_h"])
m = pd.read_csv(os.path.join(D, "mladenovska2002_digitized.csv")); ser = {}
for k, s in m.groupby("series"):
    a = s[s.quantity == "BSA_cumulative_release"]; b = s[s.quantity == "blank_sphere_mass_remaining"]
    ser[k] = dict(d=float(s.mean_diameter_um.iloc[0]), t_h=a.t_h.tolist(), y=a.value_pct.tolist(), mt_h=b.t_h.tolist(), rem=b.value_pct.tolist())
mlad = dict(series=ser, tauA_h=v3["per_size"]["A"]["tau_exit_h"], dA=v3["per_size"]["A"]["diameter_um"])
s = pd.read_csv(os.path.join(D, "saravanan2011_fig6_vector.csv")); s = s[s.time_day_raw > 0.5]
sar = dict(Dw=v4["Dw_cm2s"], R={k: v["R_um"] for k, v in v4["cases"].items()},
           pts={f.split()[0]: x[["time_day_raw", "release_pct", "SE_pct_from_caps"]].round(3).values.tolist() for f, x in s.groupby("formulation", sort=False)})
w2 = json.load(open(os.path.join(R, "w2_all_parameters.json")))
LAB = {"A": "A: میکروسفر ۵ تا ۵۰ میکرون، داروی کوچک، بافر", "B": "B: کره متورم بزرگ، نفوذ بسیار کند، آنزیم (نوع Cheng)", "C": "C: سامانه Cheng، فقط متغیرهای طراحی"}
glob = dict(N=int(os.environ.get("GRM_SOBOL_N", 1024)), regimes={k: dict(label=LAB[k], title=LAB[k], ranges=v["ranges"],
            sobol={o: {n: dict(S1=round(x["S1"], 4), ST=round(x["ST"], 4)) for n, x in d.items() if not n.startswith("_")} for o, d in v["sobol"].items()})
            for k, v in w2["regimes"].items()})
data = dict(cheng=cheng, hu=hu, mlad=mlad, sar=sar, global_=None, version="1.1.0")
data["global"] = glob; del data["global_"]
html = open(os.path.join(HERE, "template.html"), encoding="utf-8").read().replace("/*__DATA__*/null", json.dumps(data, separators=(",", ":")))
open(os.path.join(HERE, "grm_simulator.html"), "w", encoding="utf-8").write(html)
print("wrote grm_simulator.html", len(html) // 1024, "kB")

````


# FILE: code/tools/digitize_cheng2010.py

````python
"""Vector extraction of Cheng (2010) dissertation Figs 2.6A, 2.7, 2.8 (release data) from the PDF drawing commands.
Usage: python digitize_cheng2010.py <Cheng_Felice.pdf> <out.csv>
Axis calibration from the tick marks of each plot frame (positions printed by pdfplumber, PDF points)."""
import sys, csv, pdfplumber, numpy as np
PDF, OUT = sys.argv[1], sys.argv[2]
COL = {(0.0, 0.0, 0.0): "black", (1.0, 0.0, 0.0): "red", (0.0, 0.0, 1.0): "blue", (0.0, 0.0, 0.5): "blue"}
# figure: page index, frame (x0, x1, y_top, y_bottom) in PDF pts, data values at those edges, colour -> series label
FIGS = [
 dict(fig="2.6A", page=41, frame=(228.24, 424.44, 97.08, 238.44), xr=(0, 3), yr=(45, 0), medium="PBS, no enzyme",
      series={"black": "GA 0.125 %", "red": "GA 0.375 %", "blue": "GA 0.875 %"}),
 dict(fig="2.7", page=42, frame=(201.72, 411.12, 94.68, 263.64), xr=(0, 20), yr=(110, 0), medium="PBS + collagenase 373 ng/ml",
      series={"black": "GA 0.125 %", "red": "GA 0.375 %", "blue": "GA 0.875 %"}),
 dict(fig="2.8", page=43, frame=(210.6, 420.12, 103.56, 272.52), xr=(0, 20), yr=(110, 0), medium="PBS + collagenase 373 ng/ml",
      series={"black": "GA 0.25 %", "blue": "GA 0.625 %"}),
]
def key(c):
    if c is None: return None
    c = tuple(round(float(v), 1) for v in (c if isinstance(c, (list, tuple)) else [c]))
    return COL.get(c)
pdf = pdfplumber.open(PDF); rows = []
for F in FIGS:
    p = pdf.pages[F["page"]]; x0, x1, yt, yb = F["frame"]
    X = lambda x: F["xr"][0] + (x - x0) / (x1 - x0) * (F["xr"][1] - F["xr"][0])
    Y = lambda y: F["yr"][0] + (y - yt) / (yb - yt) * (F["yr"][1] - F["yr"][0])
    # legend region: words "Exp"/"Model" mark legend rows; markers left of them on the same row are legend glyphs
    leg = [w for w in p.extract_words() if w["text"].startswith("0.") and w["text"].endswith("%") and x0 < w["x0"] < x1 and yt < w["top"] < yb]
    def in_legend(cx, cy):   # legend glyph: just left of a legend label ("0.125%") on the same text row
        return any(abs(cy - (w["top"] + w["bottom"]) / 2) < 5 and 0 < w["x0"] - cx < 30 for w in leg)
    marks = []
    for o in list(p.rects) + list(p.curves):
        if not (4.9 < o["width"] < 11 and 4.5 < o["height"] < 11): continue
        col = key(o.get("non_stroking_color")) or key(o.get("stroking_color"))
        if col not in F["series"]: continue
        cx, cy = (o["x0"] + o["x1"]) / 2, (o["top"] + o["bottom"]) / 2
        if not (x0 - 4 <= cx <= x1 + 4 and yt - 4 <= cy <= yb + 4) or in_legend(cx, cy): continue
        shape = "square" if o in p.rects else ("circle" if abs(o["width"] - o["height"]) < 0.3 else "triangle")
        # triangle centroid lies 1/3 of the height above the base, not at the box centre
        if shape == "triangle": cy = o["top"] + 2 * o["height"] / 3
        marks.append((col, shape, cx, cy))
    # error bars: thin vertical lines whose x is within 0.8 pt of a marker centre
    vl = [l for l in p.lines if abs(l["x1"] - l["x0"]) < 0.05 and 1.0 < (l["bottom"] - l["top"]) < 0.5 * (yb - yt)
          and yt <= l["top"] and l["bottom"] <= yb + 1 and min(abs(l["x0"] - x0), abs(l["x0"] - x1)) > 0.3]
    seen = set()
    for col, shape, cx, cy in sorted(marks, key=lambda m: (m[0], m[2])):
        k = (col, round(cx, 0), round(cy, 0))
        if k in seen: continue          # filled marker drawn twice (fill + outline)
        seen.add(k)
        bars = [l for l in vl if abs(l["x0"] - cx) < 0.8 and (key(l.get("stroking_color")) in (col, "black"))]
        lo = hi = None
        if bars:
            top = min(l["top"] for l in bars); bot = max(l["bottom"] for l in bars)
            if top < cy - 0.5: hi = Y(top)
            if bot > cy + 0.5: lo = Y(bot)
        sd = None
        if hi is not None and lo is not None: sd = (hi - lo) / 2
        elif hi is not None: sd = hi - Y(cy)
        elif lo is not None: sd = Y(cy) - lo
        rows.append(dict(figure=F["fig"], medium=F["medium"], series=F["series"][col], marker=shape, t_day=round(X(cx), 4), release_pct=round(Y(cy), 3),
                         errbar_half_pct=None if sd is None else round(sd, 3), x_pt=round(cx, 2), y_pt=round(cy, 2)))
with open(OUT, "w", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
for r in rows: print(r)

````


# FILE: code/requirements.txt

````text
numpy>=1.26
scipy>=1.11
pandas>=2.0
matplotlib>=3.8
pytest>=7
# optional, only for tools/digitize_cheng2010.py
pdfplumber>=0.10

````


# FILE: data/data/chang2023_mass_loss_regressions.csv

````csv
formulation,slope_pct_per_day,intercept_pct,R_um,crosslink_degree,source
1.0dM-G,3.1905,13.844,10.545,0.55,Chang 2023 Sec. 3.4 text: y = 3.1905 t + 13.844 (% weight loss vs day); R from SEM 21.09 um diameter
2.5dM-G,2.9257,3.8528,8.68,0.51,Chang 2023 Sec. 3.4 text: y = 2.9257 t + 3.8528; R from SEM 17.36 um diameter

````


# FILE: data/data/cheng2010_release_vector.csv

````csv
figure,medium,series,marker,t_day,release_pct,errbar_half_pct,x_pt,y_pt
2.6A,"PBS, no enzyme",GA 0.125 %,square,-0.0009,-0.0,,228.18,238.44
2.6A,"PBS, no enzyme",GA 0.125 %,square,0.9991,28.975,,293.58,147.42
2.6A,"PBS, no enzyme",GA 0.125 %,square,1.9991,37.322,,358.98,121.2
2.6A,"PBS, no enzyme",GA 0.125 %,square,2.9991,42.918,,424.38,103.62
2.6A,"PBS, no enzyme",GA 0.875 %,circle,-0.0018,-0.0,,228.12,238.44
2.6A,"PBS, no enzyme",GA 0.875 %,circle,0.9982,26.568,,293.52,154.98
2.6A,"PBS, no enzyme",GA 0.875 %,circle,2.0,33.922,,359.04,131.88
2.6A,"PBS, no enzyme",GA 0.875 %,circle,3.0,39.404,,424.44,114.66
2.6A,"PBS, no enzyme",GA 0.375 %,triangle,-0.0009,-0.025,,228.18,238.52
2.6A,"PBS, no enzyme",GA 0.375 %,triangle,0.9991,24.385,,293.58,161.84
2.6A,"PBS, no enzyme",GA 0.375 %,triangle,2.0,31.07,,359.04,140.84
2.6A,"PBS, no enzyme",GA 0.375 %,triangle,3.0,35.463,,424.44,127.04
2.7,PBS + collagenase 373 ng/ml,GA 0.125 %,square,-0.0057,0.039,,201.66,263.58
2.7,PBS + collagenase 373 ng/ml,GA 0.125 %,square,0.9914,39.922,2.227,212.1,202.32
2.7,PBS + collagenase 373 ng/ml,GA 0.125 %,square,1.9885,53.398,2.227,222.54,181.62
2.7,PBS + collagenase 373 ng/ml,GA 0.125 %,square,2.9857,69.18,,232.98,157.38
2.7,PBS + collagenase 373 ng/ml,GA 0.125 %,square,6.0,93.867,2.266,264.54,119.46
2.7,PBS + collagenase 373 ng/ml,GA 0.125 %,square,8.9914,98.633,2.266,295.86,112.14
2.7,PBS + collagenase 373 ng/ml,GA 0.125 %,square,11.9943,100.039,2.227,327.3,109.98
2.7,PBS + collagenase 373 ng/ml,GA 0.125 %,square,14.9971,100.352,2.227,358.74,109.5
2.7,PBS + collagenase 373 ng/ml,GA 0.125 %,square,18.0,100.586,2.266,390.18,109.14
2.7,PBS + collagenase 373 ng/ml,GA 0.875 %,circle,-0.0057,0.039,,201.66,263.58
2.7,PBS + collagenase 373 ng/ml,GA 0.875 %,circle,0.9914,38.086,3.789,212.1,205.14
2.7,PBS + collagenase 373 ng/ml,GA 0.875 %,circle,1.9885,50.508,4.57,222.54,186.06
2.7,PBS + collagenase 373 ng/ml,GA 0.875 %,circle,2.9857,58.633,5.469,232.98,173.58
2.7,PBS + collagenase 373 ng/ml,GA 0.875 %,circle,6.0,74.023,14.375,264.54,149.94
2.7,PBS + collagenase 373 ng/ml,GA 0.875 %,circle,8.9914,87.07,10.469,295.86,129.9
2.7,PBS + collagenase 373 ng/ml,GA 0.875 %,circle,11.9943,94.961,7.539,327.3,117.78
2.7,PBS + collagenase 373 ng/ml,GA 0.875 %,circle,14.9971,98.242,7.852,358.74,112.74
2.7,PBS + collagenase 373 ng/ml,GA 0.875 %,circle,18.0,99.805,7.891,390.18,110.34
2.7,PBS + collagenase 373 ng/ml,GA 0.375 %,triangle,-0.0115,0.026,,201.6,263.6
2.7,PBS + collagenase 373 ng/ml,GA 0.375 %,triangle,0.9914,33.88,8.229,212.1,211.6
2.7,PBS + collagenase 373 ng/ml,GA 0.375 %,triangle,1.9885,45.573,6.719,222.54,193.64
2.7,PBS + collagenase 373 ng/ml,GA 0.375 %,triangle,2.9914,57.37,3.398,233.04,175.52
2.7,PBS + collagenase 373 ng/ml,GA 0.375 %,triangle,5.9943,73.88,12.773,264.48,150.16
2.7,PBS + collagenase 373 ng/ml,GA 0.375 %,triangle,8.9971,89.089,7.578,295.92,126.8
2.7,PBS + collagenase 373 ng/ml,GA 0.375 %,triangle,11.9943,96.042,4.805,327.3,116.12
2.7,PBS + collagenase 373 ng/ml,GA 0.375 %,triangle,15.0029,98.385,3.789,358.8,112.52
2.7,PBS + collagenase 373 ng/ml,GA 0.375 %,triangle,18.0,99.271,3.437,390.18,111.16
2.8,PBS + collagenase 373 ng/ml,GA 0.25 %,square,-0.0,0.039,,210.6,272.46
2.8,PBS + collagenase 373 ng/ml,GA 0.25 %,square,1.0023,35.508,,221.1,217.98
2.8,PBS + collagenase 373 ng/ml,GA 0.25 %,square,1.9989,50.703,,231.54,194.64
2.8,PBS + collagenase 373 ng/ml,GA 0.25 %,square,2.9954,65.039,,241.98,172.62
2.8,PBS + collagenase 373 ng/ml,GA 0.25 %,square,6.0023,89.961,3.086,273.48,134.34
2.8,PBS + collagenase 373 ng/ml,GA 0.25 %,square,8.9977,97.695,3.281,304.86,122.46
2.8,PBS + collagenase 373 ng/ml,GA 0.25 %,square,11.9989,99.961,3.359,336.3,118.98
2.8,PBS + collagenase 373 ng/ml,GA 0.25 %,square,15.0,100.352,3.555,367.74,118.38
2.8,PBS + collagenase 373 ng/ml,GA 0.25 %,square,18.0011,100.664,3.672,399.18,117.9
2.8,PBS + collagenase 373 ng/ml,GA 0.625 %,triangle,0.0,-0.026,,210.6,272.56
2.8,PBS + collagenase 373 ng/ml,GA 0.625 %,triangle,0.9966,37.76,3.359,221.04,214.52
2.8,PBS + collagenase 373 ng/ml,GA 0.625 %,triangle,1.9989,50.651,,231.54,194.72
2.8,PBS + collagenase 373 ng/ml,GA 0.625 %,triangle,2.9954,60.026,,241.98,180.32
2.8,PBS + collagenase 373 ng/ml,GA 0.625 %,triangle,6.0023,77.604,10.052,273.48,153.32
2.8,PBS + collagenase 373 ng/ml,GA 0.625 %,triangle,8.9977,91.458,9.479,304.86,132.04
2.8,PBS + collagenase 373 ng/ml,GA 0.625 %,triangle,11.9931,98.62,4.414,336.24,121.04
2.8,PBS + collagenase 373 ng/ml,GA 0.625 %,triangle,15.0,99.948,4.258,367.74,119.0
2.8,PBS + collagenase 373 ng/ml,GA 0.625 %,triangle,17.9954,99.948,4.375,399.12,119.0

````


# FILE: data/data/hu2024_mass_remaining.csv

````csv
t_day,mass_remaining_pct,source
0,100,"Hu 2024 Fig. 3, drug-free m-Em in water (raster digitization; +/-2 %)"
1,100,"Hu 2024 Fig. 3, drug-free m-Em in water (raster digitization; +/-2 %)"
2,99,"Hu 2024 Fig. 3, drug-free m-Em in water (raster digitization; +/-2 %)"
3,86,"Hu 2024 Fig. 3, drug-free m-Em in water (raster digitization; +/-2 %)"
4,77,"Hu 2024 Fig. 3, drug-free m-Em in water (raster digitization; +/-2 %)"
5,69,"Hu 2024 Fig. 3, drug-free m-Em in water (raster digitization; +/-2 %)"
6,66,"Hu 2024 Fig. 3, drug-free m-Em in water (raster digitization; +/-2 %)"
7,62,"Hu 2024 Fig. 3, drug-free m-Em in water (raster digitization; +/-2 %)"
8,58,"Hu 2024 Fig. 3, drug-free m-Em in water (raster digitization; +/-2 %)"
9,54,"Hu 2024 Fig. 3, drug-free m-Em in water (raster digitization; +/-2 %)"
10,51,"Hu 2024 Fig. 3, drug-free m-Em in water (raster digitization; +/-2 %)"
11,49,"Hu 2024 Fig. 3, drug-free m-Em in water (raster digitization; +/-2 %)"
12,46,"Hu 2024 Fig. 3, drug-free m-Em in water (raster digitization; +/-2 %)"
13,38,"Hu 2024 Fig. 3, drug-free m-Em in water (raster digitization; +/-2 %)"
15,33,"Hu 2024 Fig. 3, drug-free m-Em in water (raster digitization; +/-2 %)"
16,28,"Hu 2024 Fig. 3, drug-free m-Em in water (raster digitization; +/-2 %)"
17,26,"Hu 2024 Fig. 3, drug-free m-Em in water (raster digitization; +/-2 %)"
19,22,"Hu 2024 Fig. 3, drug-free m-Em in water (raster digitization; +/-2 %)"
20,20,"Hu 2024 Fig. 3, drug-free m-Em in water (raster digitization; +/-2 %)"
22,15,"Hu 2024 Fig. 3, drug-free m-Em in water (raster digitization; +/-2 %)"
23,12,"Hu 2024 Fig. 3, drug-free m-Em in water (raster digitization; +/-2 %)"
25,7,"Hu 2024 Fig. 3, drug-free m-Em in water (raster digitization; +/-2 %)"
26,5,"Hu 2024 Fig. 3, drug-free m-Em in water (raster digitization; +/-2 %)"
27,3,"Hu 2024 Fig. 3, drug-free m-Em in water (raster digitization; +/-2 %)"
28,1,"Hu 2024 Fig. 3, drug-free m-Em in water (raster digitization; +/-2 %)"
29,0.5,"Hu 2024 Fig. 3, drug-free m-Em in water (raster digitization; +/-2 %)"
30,0,"Hu 2024 Fig. 3, drug-free m-Em in water (raster digitization; +/-2 %)"
31,0,"Hu 2024 Fig. 3, drug-free m-Em in water (raster digitization; +/-2 %)"

````


# FILE: data/data/mladenovska2002_digitized.csv

````csv
series,mean_diameter_um,quantity,t_h,value_pct,source
A,7.03,BSA_cumulative_release,0,0,"Fig. 2 (raster digitization, 400 dpi)"
A,7.03,BSA_cumulative_release,1,5.5,"Fig. 2 (raster digitization, 400 dpi)"
A,7.03,BSA_cumulative_release,3,19.5,"Fig. 2 (raster digitization, 400 dpi)"
A,7.03,BSA_cumulative_release,5,29.5,"Fig. 2 (raster digitization, 400 dpi)"
A,7.03,BSA_cumulative_release,7,33,"Fig. 2 (raster digitization, 400 dpi)"
A,7.03,BSA_cumulative_release,10,57.5,"Fig. 2 (raster digitization, 400 dpi)"
A,7.03,BSA_cumulative_release,13,71,"Fig. 2 (raster digitization, 400 dpi)"
A,7.03,BSA_cumulative_release,24.0,80.5,"Fig. 2 (raster digitization, 400 dpi)"
A,7.03,blank_sphere_mass_remaining,0,100,"Fig. 1 (raster digitization, 400 dpi)"
A,7.03,blank_sphere_mass_remaining,1,45,"Fig. 1 (raster digitization, 400 dpi)"
A,7.03,blank_sphere_mass_remaining,3,41,"Fig. 1 (raster digitization, 400 dpi)"
A,7.03,blank_sphere_mass_remaining,5,33,"Fig. 1 (raster digitization, 400 dpi)"
A,7.03,blank_sphere_mass_remaining,7,31.7,"Fig. 1 (raster digitization, 400 dpi)"
A,7.03,blank_sphere_mass_remaining,13,28.8,"Fig. 1 (raster digitization, 400 dpi)"
A,7.03,blank_sphere_mass_remaining,24,23,"Fig. 1 (raster digitization, 400 dpi)"
A,7.03,blank_sphere_mass_remaining,48,22.3,"Fig. 1 (raster digitization, 400 dpi)"
A,7.03,blank_sphere_mass_remaining,72.0,19,"Fig. 1 (raster digitization, 400 dpi)"
B,5.89,BSA_cumulative_release,0,0,"Fig. 2 (raster digitization, 400 dpi)"
B,5.89,BSA_cumulative_release,1,6.5,"Fig. 2 (raster digitization, 400 dpi)"
B,5.89,BSA_cumulative_release,3,21.5,"Fig. 2 (raster digitization, 400 dpi)"
B,5.89,BSA_cumulative_release,5,32.5,"Fig. 2 (raster digitization, 400 dpi)"
B,5.89,BSA_cumulative_release,7,54,"Fig. 2 (raster digitization, 400 dpi)"
B,5.89,BSA_cumulative_release,10,65.5,"Fig. 2 (raster digitization, 400 dpi)"
B,5.89,BSA_cumulative_release,13,75.5,"Fig. 2 (raster digitization, 400 dpi)"
B,5.89,BSA_cumulative_release,24.0,85,"Fig. 2 (raster digitization, 400 dpi)"
B,5.89,blank_sphere_mass_remaining,0,100,"Fig. 1 (raster digitization, 400 dpi)"
B,5.89,blank_sphere_mass_remaining,1,40.5,"Fig. 1 (raster digitization, 400 dpi)"
B,5.89,blank_sphere_mass_remaining,3,34,"Fig. 1 (raster digitization, 400 dpi)"
B,5.89,blank_sphere_mass_remaining,5,28.5,"Fig. 1 (raster digitization, 400 dpi)"
B,5.89,blank_sphere_mass_remaining,7,28,"Fig. 1 (raster digitization, 400 dpi)"
B,5.89,blank_sphere_mass_remaining,13,23.5,"Fig. 1 (raster digitization, 400 dpi)"
B,5.89,blank_sphere_mass_remaining,24,21.5,"Fig. 1 (raster digitization, 400 dpi)"
B,5.89,blank_sphere_mass_remaining,48,18,"Fig. 1 (raster digitization, 400 dpi)"
B,5.89,blank_sphere_mass_remaining,72.0,16,"Fig. 1 (raster digitization, 400 dpi)"
C,4.63,BSA_cumulative_release,0,0,"Fig. 2 (raster digitization, 400 dpi)"
C,4.63,BSA_cumulative_release,1,7.5,"Fig. 2 (raster digitization, 400 dpi)"
C,4.63,BSA_cumulative_release,3,32.5,"Fig. 2 (raster digitization, 400 dpi)"
C,4.63,BSA_cumulative_release,5,48.5,"Fig. 2 (raster digitization, 400 dpi)"
C,4.63,BSA_cumulative_release,7,66.5,"Fig. 2 (raster digitization, 400 dpi)"
C,4.63,BSA_cumulative_release,10,70,"Fig. 2 (raster digitization, 400 dpi)"
C,4.63,BSA_cumulative_release,13,77.5,"Fig. 2 (raster digitization, 400 dpi)"
C,4.63,BSA_cumulative_release,24.0,86,"Fig. 2 (raster digitization, 400 dpi)"
C,4.63,blank_sphere_mass_remaining,0,100,"Fig. 1 (raster digitization, 400 dpi)"
C,4.63,blank_sphere_mass_remaining,1,40.5,"Fig. 1 (raster digitization, 400 dpi)"
C,4.63,blank_sphere_mass_remaining,3,34,"Fig. 1 (raster digitization, 400 dpi)"
C,4.63,blank_sphere_mass_remaining,5,28.5,"Fig. 1 (raster digitization, 400 dpi)"
C,4.63,blank_sphere_mass_remaining,7,27.5,"Fig. 1 (raster digitization, 400 dpi)"
C,4.63,blank_sphere_mass_remaining,13,22.5,"Fig. 1 (raster digitization, 400 dpi)"
C,4.63,blank_sphere_mass_remaining,24,21,"Fig. 1 (raster digitization, 400 dpi)"
C,4.63,blank_sphere_mass_remaining,48,18,"Fig. 1 (raster digitization, 400 dpi)"
C,4.63,blank_sphere_mass_remaining,72.0,16,"Fig. 1 (raster digitization, 400 dpi)"
D,3.2,BSA_cumulative_release,0,0,"Fig. 2 (raster digitization, 400 dpi)"
D,3.2,BSA_cumulative_release,1,8.5,"Fig. 2 (raster digitization, 400 dpi)"
D,3.2,BSA_cumulative_release,3,43,"Fig. 2 (raster digitization, 400 dpi)"
D,3.2,BSA_cumulative_release,5,52.5,"Fig. 2 (raster digitization, 400 dpi)"
D,3.2,BSA_cumulative_release,7,70,"Fig. 2 (raster digitization, 400 dpi)"
D,3.2,BSA_cumulative_release,10,76,"Fig. 2 (raster digitization, 400 dpi)"
D,3.2,BSA_cumulative_release,13,80,"Fig. 2 (raster digitization, 400 dpi)"
D,3.2,BSA_cumulative_release,24.0,88.5,"Fig. 2 (raster digitization, 400 dpi)"
D,3.2,blank_sphere_mass_remaining,0,100,"Fig. 1 (raster digitization, 400 dpi)"
D,3.2,blank_sphere_mass_remaining,1,37,"Fig. 1 (raster digitization, 400 dpi)"
D,3.2,blank_sphere_mass_remaining,3,29,"Fig. 1 (raster digitization, 400 dpi)"
D,3.2,blank_sphere_mass_remaining,5,25,"Fig. 1 (raster digitization, 400 dpi)"
D,3.2,blank_sphere_mass_remaining,7,23.5,"Fig. 1 (raster digitization, 400 dpi)"
D,3.2,blank_sphere_mass_remaining,13,20.5,"Fig. 1 (raster digitization, 400 dpi)"
D,3.2,blank_sphere_mass_remaining,24,16.5,"Fig. 1 (raster digitization, 400 dpi)"
D,3.2,blank_sphere_mass_remaining,48,15,"Fig. 1 (raster digitization, 400 dpi)"
D,3.2,blank_sphere_mass_remaining,72.0,14.5,"Fig. 1 (raster digitization, 400 dpi)"
E,2.29,BSA_cumulative_release,0,0,"Fig. 2 (raster digitization, 400 dpi)"
E,2.29,BSA_cumulative_release,1,9.5,"Fig. 2 (raster digitization, 400 dpi)"
E,2.29,BSA_cumulative_release,3,48.5,"Fig. 2 (raster digitization, 400 dpi)"
E,2.29,BSA_cumulative_release,5,57.5,"Fig. 2 (raster digitization, 400 dpi)"
E,2.29,BSA_cumulative_release,7,74,"Fig. 2 (raster digitization, 400 dpi)"
E,2.29,BSA_cumulative_release,10,78.5,"Fig. 2 (raster digitization, 400 dpi)"
E,2.29,BSA_cumulative_release,13,83.5,"Fig. 2 (raster digitization, 400 dpi)"
E,2.29,BSA_cumulative_release,24.0,89.5,"Fig. 2 (raster digitization, 400 dpi)"
E,2.29,blank_sphere_mass_remaining,0,100,"Fig. 1 (raster digitization, 400 dpi)"
E,2.29,blank_sphere_mass_remaining,1,34,"Fig. 1 (raster digitization, 400 dpi)"
E,2.29,blank_sphere_mass_remaining,3,28,"Fig. 1 (raster digitization, 400 dpi)"
E,2.29,blank_sphere_mass_remaining,5,25,"Fig. 1 (raster digitization, 400 dpi)"
E,2.29,blank_sphere_mass_remaining,7,22.5,"Fig. 1 (raster digitization, 400 dpi)"
E,2.29,blank_sphere_mass_remaining,13,19,"Fig. 1 (raster digitization, 400 dpi)"
E,2.29,blank_sphere_mass_remaining,24,16,"Fig. 1 (raster digitization, 400 dpi)"
E,2.29,blank_sphere_mass_remaining,48,15,"Fig. 1 (raster digitization, 400 dpi)"
E,2.29,blank_sphere_mass_remaining,72.0,12.5,"Fig. 1 (raster digitization, 400 dpi)"
F,1.99,BSA_cumulative_release,0,0,"Fig. 2 (raster digitization, 400 dpi)"
F,1.99,BSA_cumulative_release,1,12.5,"Fig. 2 (raster digitization, 400 dpi)"
F,1.99,BSA_cumulative_release,3,54,"Fig. 2 (raster digitization, 400 dpi)"
F,1.99,BSA_cumulative_release,5,74,"Fig. 2 (raster digitization, 400 dpi)"
F,1.99,BSA_cumulative_release,7,80.5,"Fig. 2 (raster digitization, 400 dpi)"
F,1.99,BSA_cumulative_release,10,84.5,"Fig. 2 (raster digitization, 400 dpi)"
F,1.99,BSA_cumulative_release,13,87,"Fig. 2 (raster digitization, 400 dpi)"
F,1.99,BSA_cumulative_release,24.0,92.5,"Fig. 2 (raster digitization, 400 dpi)"
F,1.99,blank_sphere_mass_remaining,0,100,"Fig. 1 (raster digitization, 400 dpi)"
F,1.99,blank_sphere_mass_remaining,1,33.5,"Fig. 1 (raster digitization, 400 dpi)"
F,1.99,blank_sphere_mass_remaining,3,25.5,"Fig. 1 (raster digitization, 400 dpi)"
F,1.99,blank_sphere_mass_remaining,5,25,"Fig. 1 (raster digitization, 400 dpi)"
F,1.99,blank_sphere_mass_remaining,7,22,"Fig. 1 (raster digitization, 400 dpi)"
F,1.99,blank_sphere_mass_remaining,13,18,"Fig. 1 (raster digitization, 400 dpi)"
F,1.99,blank_sphere_mass_remaining,24,16,"Fig. 1 (raster digitization, 400 dpi)"
F,1.99,blank_sphere_mass_remaining,48,12.5,"Fig. 1 (raster digitization, 400 dpi)"
F,1.99,blank_sphere_mass_remaining,72.0,12,"Fig. 1 (raster digitization, 400 dpi)"

````


# FILE: data/data/release_dataset_audited.csv

````csv
case_id,formulation,time_value,time_unit,time_h,y_value,y_unit,evidence,y_uncertainty_digitization,y_reported_error,include_in_fit,exclusion_reason,note
C1_Jin2023_morphine,MGM (optimised),5,min,0.0833,0.0,% cumulative (paper: Mt/Minf),DIRECT_FIGURE_DATA_LABEL,0.05,,True,,"Fig.2 data row, p.7"
C1_Jin2023_morphine,MGM (optimised),10,min,0.1667,5.0,% cumulative (paper: Mt/Minf),DIRECT_FIGURE_DATA_LABEL,0.05,,True,,"Fig.2 data row, p.7"
C1_Jin2023_morphine,MGM (optimised),30,min,0.5,12.0,% cumulative (paper: Mt/Minf),DIRECT_FIGURE_DATA_LABEL,0.05,,True,,"Fig.2 data row, p.7"
C1_Jin2023_morphine,MGM (optimised),45,min,0.75,21.5,% cumulative (paper: Mt/Minf),DIRECT_FIGURE_DATA_LABEL,0.05,,True,,"Fig.2 data row, p.7"
C1_Jin2023_morphine,MGM (optimised),60,min,1.0,25.8,% cumulative (paper: Mt/Minf),DIRECT_FIGURE_DATA_LABEL,0.05,,True,,"Fig.2 data row, p.7"
C1_Jin2023_morphine,MGM (optimised),90,min,1.5,37.2,% cumulative (paper: Mt/Minf),DIRECT_FIGURE_DATA_LABEL,0.05,,True,,"Fig.2 data row, p.7"
C1_Jin2023_morphine,MGM (optimised),120,min,2.0,40.0,% cumulative (paper: Mt/Minf),DIRECT_FIGURE_DATA_LABEL,0.05,,True,,"Fig.2 data row, p.7"
C1_Jin2023_morphine,MGM (optimised),240,min,4.0,47.0,% cumulative (paper: Mt/Minf),DIRECT_FIGURE_DATA_LABEL,0.05,,True,,"Fig.2 data row, p.7"
C1_Jin2023_morphine,MGM (optimised),480,min,8.0,55.0,% cumulative (paper: Mt/Minf),DIRECT_FIGURE_DATA_LABEL,0.05,,True,,"Fig.2 data row, p.7"
C1_Jin2023_morphine,MGM (optimised),720,min,12.0,56.0,% cumulative (paper: Mt/Minf),DIRECT_FIGURE_DATA_LABEL,0.05,,True,,"Fig.2 data row, p.7"
C1_Jin2023_morphine,MGM (optimised),1440,min,24.0,57.1,% cumulative (paper: Mt/Minf),DIRECT_FIGURE_DATA_LABEL,0.05,,True,,"Fig.2 data row, p.7"
C1_Jin2023_morphine,MGM (optimised),2160,min,36.0,57.5,% cumulative (paper: Mt/Minf),DIRECT_FIGURE_DATA_LABEL,0.05,,True,,"Fig.2 data row, p.7"
C1_Jin2023_morphine,MGM (optimised),2880,min,48.0,58.1,% cumulative (paper: Mt/Minf),DIRECT_FIGURE_DATA_LABEL,0.05,,True,,"Fig.2 data row, p.7"
C1_Jin2023_morphine,MGM (optimised),3600,min,60.0,58.5,% cumulative (paper: Mt/Minf),DIRECT_FIGURE_DATA_LABEL,0.05,,True,,"Fig.2 data row, p.7"
C1_Jin2023_morphine,MGM (optimised),4320,min,72.0,59.2,% cumulative (paper: Mt/Minf),DIRECT_FIGURE_DATA_LABEL,0.05,,True,,"Fig.2 data row, p.7"
C2_Saravanan2011_diclofenac,GM1,1,day,24,9.981,% of loaded drug,VECTOR_EXTRACTED,0.05,1.813,True,,Fig.6 p.102; raw x=1.009 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM1,2,day,48,15.039,% of loaded drug,VECTOR_EXTRACTED,0.05,2.104,True,,Fig.6 p.102; raw x=1.992 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM1,3,day,72,20.021,% of loaded drug,VECTOR_EXTRACTED,0.05,1.988,True,,Fig.6 p.102; raw x=2.999 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM1,6,day,144,25.004,% of loaded drug,VECTOR_EXTRACTED,0.05,1.922,True,,Fig.6 p.102; raw x=5.998 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM1,9,day,216,30.993,% of loaded drug,VECTOR_EXTRACTED,0.05,2.096,True,,Fig.6 p.102; raw x=8.995 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM1,12,day,288,35.976,% of loaded drug,VECTOR_EXTRACTED,0.05,2.03,True,,Fig.6 p.102; raw x=11.992 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM1,15,day,360,41.033,% of loaded drug,VECTOR_EXTRACTED,0.05,2.487,True,,Fig.6 p.102; raw x=15.012 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM1,18,day,432,45.017,% of loaded drug,VECTOR_EXTRACTED,0.05,3.094,True,,Fig.6 p.102; raw x=18.009 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM1,21,day,504,48.012,% of loaded drug,VECTOR_EXTRACTED,0.05,3.71,True,,Fig.6 p.102; raw x=21.008 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM1,24,day,576,51.007,% of loaded drug,VECTOR_EXTRACTED,0.05,4.126,True,,Fig.6 p.102; raw x=24.005 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM1,27,day,648,53.993,% of loaded drug,VECTOR_EXTRACTED,0.05,4.201,True,,Fig.6 p.102; raw x=27.001 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM1,30,day,720,55.989,% of loaded drug,VECTOR_EXTRACTED,0.05,3.202,True,,Fig.6 p.102; raw x=30.001 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM2,1,day,24,16.045,% of loaded drug,VECTOR_EXTRACTED,0.05,1.996,True,,Fig.6 p.102; raw x=1.006 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM2,2,day,48,26.011,% of loaded drug,VECTOR_EXTRACTED,0.05,1.922,True,,Fig.6 p.102; raw x=1.989 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM2,3,day,72,32.0,% of loaded drug,VECTOR_EXTRACTED,0.05,2.096,True,,Fig.6 p.102; raw x=2.996 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM2,6,day,144,38.047,% of loaded drug,VECTOR_EXTRACTED,0.05,2.529,True,,Fig.6 p.102; raw x=5.995 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM2,9,day,216,45.026,% of loaded drug,VECTOR_EXTRACTED,0.05,3.094,True,,Fig.6 p.102; raw x=8.992 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM2,12,day,288,51.015,% of loaded drug,VECTOR_EXTRACTED,0.05,2.096,True,,Fig.6 p.102; raw x=11.989 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM2,15,day,360,56.996,% of loaded drug,VECTOR_EXTRACTED,0.05,1.822,True,,Fig.6 p.102; raw x=15.009 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM2,18,day,432,63.052,% of loaded drug,VECTOR_EXTRACTED,0.05,1.53,True,,Fig.6 p.102; raw x=18.006 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM2,21,day,504,68.034,% of loaded drug,VECTOR_EXTRACTED,0.05,1.389,True,,Fig.6 p.102; raw x=21.005 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM2,24,day,576,72.027,% of loaded drug,VECTOR_EXTRACTED,0.05,1.714,True,,Fig.6 p.102; raw x=24.002 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM2,27,day,648,76.012,% of loaded drug,VECTOR_EXTRACTED,0.05,1.921,True,,Fig.6 p.102; raw x=26.999 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM2,30,day,720,80.004,% of loaded drug,VECTOR_EXTRACTED,0.05,2.387,True,,Fig.6 p.102; raw x=29.998 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM3,1,day,24,25.004,% of loaded drug,VECTOR_EXTRACTED,0.05,2.063,True,,Fig.6 p.102; raw x=1.009 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM3,2,day,48,35.976,% of loaded drug,VECTOR_EXTRACTED,0.05,1.672,True,,Fig.6 p.102; raw x=1.992 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM3,3,day,72,44.02,% of loaded drug,VECTOR_EXTRACTED,0.05,1.597,True,,Fig.6 p.102; raw x=2.999 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM3,6,day,144,52.005,% of loaded drug,VECTOR_EXTRACTED,0.05,1.098,True,,Fig.6 p.102; raw x=5.998 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM3,9,day,216,58.984,% of loaded drug,VECTOR_EXTRACTED,0.05,1.389,True,,Fig.6 p.102; raw x=8.995 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM3,12,day,288,66.03,% of loaded drug,VECTOR_EXTRACTED,0.05,1.888,True,,Fig.6 p.102; raw x=11.992 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM3,15,day,360,73.017,% of loaded drug,VECTOR_EXTRACTED,0.05,2.105,True,,Fig.6 p.102; raw x=15.012 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM3,18,day,432,78.0,% of loaded drug,VECTOR_EXTRACTED,0.05,1.78,True,,Fig.6 p.102; raw x=18.009 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM3,21,day,504,81.984,% of loaded drug,VECTOR_EXTRACTED,0.05,2.105,True,,Fig.6 p.102; raw x=21.008 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM3,24,day,576,84.979,% of loaded drug,VECTOR_EXTRACTED,0.05,1.813,True,,Fig.6 p.102; raw x=24.005 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM3,27,day,648,88.04,% of loaded drug,VECTOR_EXTRACTED,0.05,1.389,True,,Fig.6 p.102; raw x=27.001 d; bars = SE (n=6)
C2_Saravanan2011_diclofenac,GM3,30,day,720,91.034,% of loaded drug,VECTOR_EXTRACTED,0.05,2.496,True,,Fig.6 p.102; raw x=30.001 d; bars = SE (n=6)
C3_Kodra2026_ketoprofen,MS/K-1,0.5,h,0.5,12.9,% of encapsulated drug (Kr/Ke),DIGITIZED_VISUAL,2.0,,True,,Fig.7c p.17; overlapping markers
C3_Kodra2026_ketoprofen,MS/K-1,1,h,1,17.4,% of encapsulated drug (Kr/Ke),DIGITIZED_VISUAL,1.5,,True,,Fig.7c p.17; overlapping markers
C3_Kodra2026_ketoprofen,MS/K-1,3,h,3,33.9944,% of encapsulated drug (Kr/Ke),DIGITIZED_AUTO,0.5,,True,,Fig.7c p.17
C3_Kodra2026_ketoprofen,MS/K-1,5,h,5,35.5644,% of encapsulated drug (Kr/Ke),DIGITIZED_AUTO,0.5,,True,,Fig.7c p.17
C3_Kodra2026_ketoprofen,MS/K-1,24,h,24,62.254,% of encapsulated drug (Kr/Ke),DIGITIZED_AUTO,0.5,,True,,Fig.7c p.17
C3_Kodra2026_ketoprofen,MS/K-2,0.5,h,0.5,10.6,% of encapsulated drug (Kr/Ke),DIGITIZED_VISUAL,2.0,,True,,Fig.7c p.17; overlapping markers
C3_Kodra2026_ketoprofen,MS/K-2,1,h,1,22.2826,% of encapsulated drug (Kr/Ke),DIGITIZED_AUTO,0.5,,True,,Fig.7c p.17
C3_Kodra2026_ketoprofen,MS/K-2,3,h,3,41.8822,% of encapsulated drug (Kr/Ke),DIGITIZED_AUTO,0.5,,True,,Fig.7c p.17
C3_Kodra2026_ketoprofen,MS/K-2,5,h,5,84.8392,% of encapsulated drug (Kr/Ke),DIGITIZED_AUTO,0.5,,True,,Fig.7c p.17
C3_Kodra2026_ketoprofen,MS/K-2,24,h,24,100.0,% of encapsulated drug (Kr/Ke),DIGITIZED_AUTO,0.5,,True,,Fig.7c p.17
C3_Kodra2026_ketoprofen,MS/K-3,0.5,h,0.5,9.0,% of encapsulated drug (Kr/Ke),DIGITIZED_VISUAL,2.0,,True,,Fig.7c p.17; overlapping markers
C3_Kodra2026_ketoprofen,MS/K-3,1,h,1,37.0724,% of encapsulated drug (Kr/Ke),DIGITIZED_AUTO,0.5,,True,,Fig.7c p.17
C3_Kodra2026_ketoprofen,MS/K-3,3,h,3,99.597,% of encapsulated drug (Kr/Ke),DIGITIZED_AUTO,0.5,,True,,Fig.7c p.17
C3_Kodra2026_ketoprofen,MS/K-3,5,h,5,99.7659,% of encapsulated drug (Kr/Ke),DIGITIZED_AUTO,0.5,,True,,Fig.7c p.17
C3_Kodra2026_ketoprofen,MS/K-3,24,h,24,100.0,% of encapsulated drug (Kr/Ke),DIGITIZED_VISUAL,2.0,,True,,marker hidden under MS/K-2 marker; line ends at 100%
C4_Zhang2023_vancomycin,pH 7.4,0.25,day,6.0,nan,% of loaded drug (M0),DIGITIZED_AUTO,,,False,marker occluded by the other series,Fig.8B p.4362
C4_Zhang2023_vancomycin,pH 7.4,0.5,day,12.0,25.4095,% of loaded drug (M0),DIGITIZED_AUTO,0.4,,True,,Fig.8B; detected x=0.495 d
C4_Zhang2023_vancomycin,pH 7.4,1,day,24,37.2386,% of loaded drug (M0),DIGITIZED_AUTO,0.4,,True,,Fig.8B; detected x=0.998 d
C4_Zhang2023_vancomycin,pH 7.4,2,day,48,45.8944,% of loaded drug (M0),DIGITIZED_AUTO,0.4,,True,,Fig.8B; detected x=2.004 d
C4_Zhang2023_vancomycin,pH 7.4,3,day,72,52.33,% of loaded drug (M0),DIGITIZED_AUTO,0.4,,True,,Fig.8B; detected x=3.003 d
C4_Zhang2023_vancomycin,pH 7.4,4,day,96,56.1609,% of loaded drug (M0),DIGITIZED_AUTO,0.4,,True,,Fig.8B; detected x=3.998 d
C4_Zhang2023_vancomycin,pH 7.4,6,day,144,59.6192,% of loaded drug (M0),DIGITIZED_AUTO,0.4,,True,,Fig.8B; detected x=6.001 d
C4_Zhang2023_vancomycin,pH 7.4,8,day,192,62.1759,% of loaded drug (M0),DIGITIZED_AUTO,0.4,,True,,Fig.8B; detected x=7.997 d
C4_Zhang2023_vancomycin,pH 7.4,10,day,240,63.9188,% of loaded drug (M0),DIGITIZED_AUTO,0.4,,True,,Fig.8B; detected x=9.999 d
C4_Zhang2023_vancomycin,pH 7.4,12,day,288,65.1082,% of loaded drug (M0),DIGITIZED_AUTO,0.4,,True,,Fig.8B; detected x=11.986 d
C4_Zhang2023_vancomycin,pH 7.4,14,day,336,66.5222,% of loaded drug (M0),DIGITIZED_AUTO,0.4,,True,,Fig.8B; detected x=13.988 d
C4_Zhang2023_vancomycin,pH 6.0,0.25,day,6.0,21.458,% of loaded drug (M0),DIGITIZED_AUTO,0.4,,True,,Fig.8B; detected x=0.254 d
C4_Zhang2023_vancomycin,pH 6.0,0.5,day,12.0,29.6291,% of loaded drug (M0),DIGITIZED_AUTO,0.4,,True,,Fig.8B; detected x=0.505 d
C4_Zhang2023_vancomycin,pH 6.0,1,day,24,40.9712,% of loaded drug (M0),DIGITIZED_AUTO,0.4,,True,,Fig.8B; detected x=1.000 d
C4_Zhang2023_vancomycin,pH 6.0,2,day,48,52.3715,% of loaded drug (M0),DIGITIZED_AUTO,0.4,,True,,Fig.8B; detected x=2.004 d
C4_Zhang2023_vancomycin,pH 6.0,3,day,72,60.0654,% of loaded drug (M0),DIGITIZED_AUTO,0.4,,True,,Fig.8B; detected x=3.005 d
C4_Zhang2023_vancomycin,pH 6.0,4,day,96,65.989,% of loaded drug (M0),DIGITIZED_AUTO,0.4,,True,,Fig.8B; detected x=4.002 d
C4_Zhang2023_vancomycin,pH 6.0,6,day,144,70.6131,% of loaded drug (M0),DIGITIZED_AUTO,0.4,,True,,Fig.8B; detected x=5.997 d
C4_Zhang2023_vancomycin,pH 6.0,8,day,192,74.1012,% of loaded drug (M0),DIGITIZED_AUTO,0.4,,True,,Fig.8B; detected x=7.998 d
C4_Zhang2023_vancomycin,pH 6.0,10,day,240,75.9665,% of loaded drug (M0),DIGITIZED_AUTO,0.4,,True,,Fig.8B; detected x=9.999 d
C4_Zhang2023_vancomycin,pH 6.0,12,day,288,77.1731,% of loaded drug (M0),DIGITIZED_AUTO,0.4,,True,,Fig.8B; detected x=11.991 d
C4_Zhang2023_vancomycin,pH 6.0,14,day,336,78.008,% of loaded drug (M0),DIGITIZED_AUTO,0.4,,True,,Fig.8B; detected x=13.990 d
C4_Zhang2023_vancomycin,pH 6.0,0.0833,day,1.9992,1.6,% of loaded drug (M0),DIGITIZED_AUTO,1.0,,False,cluster of 0.5-2 h markers at the axis; times not resolvable,shows near-zero release in the first hours (lag)
C5_Chang2023_gentamicin,0.5dM-G,1,h,1,nan,mg/mL (cumulative concentration),DIGITIZED_AUTO,,,False,marker occluded by darker series,Fig.5 p.14
C5_Chang2023_gentamicin,0.5dM-G,2,h,2,nan,mg/mL (cumulative concentration),DIGITIZED_AUTO,,,False,marker occluded by darker series,Fig.5 p.14
C5_Chang2023_gentamicin,0.5dM-G,4,h,4,nan,mg/mL (cumulative concentration),DIGITIZED_AUTO,,,False,marker occluded by darker series,Fig.5 p.14
C5_Chang2023_gentamicin,0.5dM-G,8,h,8,4.3196,mg/mL (cumulative concentration),DIGITIZED_AUTO,,,False,marker occluded by darker series,Fig.5 p.14
C5_Chang2023_gentamicin,0.5dM-G,1,day,24,4.3945,mg/mL (cumulative concentration),DIGITIZED_AUTO,0.15,,True,,Fig.5 p.14
C5_Chang2023_gentamicin,0.5dM-G,2,day,48,4.3986,mg/mL (cumulative concentration),DIGITIZED_AUTO,0.15,,True,,Fig.5 p.14
C5_Chang2023_gentamicin,0.5dM-G,4,day,96,4.4089,mg/mL (cumulative concentration),DIGITIZED_AUTO,0.15,,True,,Fig.5 p.14
C5_Chang2023_gentamicin,0.5dM-G,8,day,192,4.4204,mg/mL (cumulative concentration),DIGITIZED_AUTO,0.15,,True,,Fig.5 p.14
C5_Chang2023_gentamicin,0.5dM-G,16,day,384,4.3313,mg/mL (cumulative concentration),DIGITIZED_AUTO,0.15,,True,,Fig.5 p.14
C5_Chang2023_gentamicin,0.5dM-G,32,day,768,5.0288,mg/mL (cumulative concentration),DIGITIZED_AUTO,0.15,,True,,Fig.5 p.14
C5_Chang2023_gentamicin,1.0dM-G,1,h,1,2.4597,mg/mL (cumulative concentration),DIGITIZED_AUTO,0.15,,True,,Fig.5 p.14
C5_Chang2023_gentamicin,1.0dM-G,2,h,2,3.8241,mg/mL (cumulative concentration),DIGITIZED_AUTO,0.06,,True,,Fig.5 p.14
C5_Chang2023_gentamicin,1.0dM-G,4,h,4,3.9366,mg/mL (cumulative concentration),DIGITIZED_AUTO,0.06,,True,,Fig.5 p.14
C5_Chang2023_gentamicin,1.0dM-G,8,h,8,3.9642,mg/mL (cumulative concentration),DIGITIZED_AUTO,0.06,,True,,Fig.5 p.14
C5_Chang2023_gentamicin,1.0dM-G,1,day,24,3.9905,mg/mL (cumulative concentration),DIGITIZED_AUTO,0.06,,True,,Fig.5 p.14
C5_Chang2023_gentamicin,1.0dM-G,2,day,48,3.9667,mg/mL (cumulative concentration),DIGITIZED_AUTO,0.06,,True,,Fig.5 p.14
C5_Chang2023_gentamicin,1.0dM-G,4,day,96,3.9625,mg/mL (cumulative concentration),DIGITIZED_AUTO,0.06,,True,,Fig.5 p.14
C5_Chang2023_gentamicin,1.0dM-G,8,day,192,3.9511,mg/mL (cumulative concentration),DIGITIZED_AUTO,0.06,,True,,Fig.5 p.14
C5_Chang2023_gentamicin,1.0dM-G,16,day,384,4.0334,mg/mL (cumulative concentration),DIGITIZED_AUTO,0.06,,True,,Fig.5 p.14
C5_Chang2023_gentamicin,1.0dM-G,32,day,768,4.7933,mg/mL (cumulative concentration),DIGITIZED_AUTO,0.06,,True,,Fig.5 p.14
C5_Chang2023_gentamicin,2.5dM-G,1,h,1,2.6501,mg/mL (cumulative concentration),DIGITIZED_AUTO,0.06,,True,,Fig.5 p.14
C5_Chang2023_gentamicin,2.5dM-G,2,h,2,4.0114,mg/mL (cumulative concentration),DIGITIZED_AUTO,0.06,,True,,Fig.5 p.14
C5_Chang2023_gentamicin,2.5dM-G,4,h,4,4.1066,mg/mL (cumulative concentration),DIGITIZED_AUTO,0.06,,True,,Fig.5 p.14
C5_Chang2023_gentamicin,2.5dM-G,8,h,8,4.1286,mg/mL (cumulative concentration),DIGITIZED_AUTO,0.06,,True,,Fig.5 p.14
C5_Chang2023_gentamicin,2.5dM-G,1,day,24,4.1596,mg/mL (cumulative concentration),DIGITIZED_AUTO,0.06,,True,,Fig.5 p.14
C5_Chang2023_gentamicin,2.5dM-G,2,day,48,4.1577,mg/mL (cumulative concentration),DIGITIZED_AUTO,0.06,,True,,Fig.5 p.14
C5_Chang2023_gentamicin,2.5dM-G,4,day,96,4.1585,mg/mL (cumulative concentration),DIGITIZED_AUTO,0.06,,True,,Fig.5 p.14
C5_Chang2023_gentamicin,2.5dM-G,8,day,192,4.1596,mg/mL (cumulative concentration),DIGITIZED_AUTO,0.06,,True,,Fig.5 p.14
C5_Chang2023_gentamicin,2.5dM-G,16,day,384,4.5284,mg/mL (cumulative concentration),DIGITIZED_AUTO,0.06,,True,,Fig.5 p.14
C5_Chang2023_gentamicin,2.5dM-G,32,day,768,7.7186,mg/mL (cumulative concentration),DIGITIZED_AUTO,0.06,,True,,Fig.5 p.14
C6_Hu2024_gentamicin,m-EmG raw,1,h,1,0.1364,mg (cumulative mass),DIGITIZED_AUTO,0.002,,False,raw signal; fit uses background-corrected series,Fig.5 p.10
C6_Hu2024_gentamicin,m-Em background,1,h,1,0.0299,mg (cumulative mass),DIGITIZED_AUTO,0.002,,False,drug-free background,Fig.5 p.10
C6_Hu2024_gentamicin,m-EmG net (raw - background),1,h,1,0.1065,mg (cumulative mass),DIGITIZED_AUTO,0.003,,True,,"net = m-EmG - m-Em, as instructed in the paper's text"
C6_Hu2024_gentamicin,m-EmG raw,2,h,2,0.2211,mg (cumulative mass),DIGITIZED_AUTO,0.002,,False,raw signal; fit uses background-corrected series,Fig.5 p.10
C6_Hu2024_gentamicin,m-Em background,2,h,2,0.0491,mg (cumulative mass),DIGITIZED_AUTO,0.002,,False,drug-free background,Fig.5 p.10
C6_Hu2024_gentamicin,m-EmG net (raw - background),2,h,2,0.172,mg (cumulative mass),DIGITIZED_AUTO,0.003,,True,,"net = m-EmG - m-Em, as instructed in the paper's text"
C6_Hu2024_gentamicin,m-EmG raw,4,h,4,0.3004,mg (cumulative mass),DIGITIZED_AUTO,0.002,,False,raw signal; fit uses background-corrected series,Fig.5 p.10
C6_Hu2024_gentamicin,m-Em background,4,h,4,0.0675,mg (cumulative mass),DIGITIZED_AUTO,0.002,,False,drug-free background,Fig.5 p.10
C6_Hu2024_gentamicin,m-EmG net (raw - background),4,h,4,0.2329,mg (cumulative mass),DIGITIZED_AUTO,0.003,,True,,"net = m-EmG - m-Em, as instructed in the paper's text"
C6_Hu2024_gentamicin,m-EmG raw,8,h,8,0.3717,mg (cumulative mass),DIGITIZED_AUTO,0.002,,False,raw signal; fit uses background-corrected series,Fig.5 p.10
C6_Hu2024_gentamicin,m-Em background,8,h,8,0.0872,mg (cumulative mass),DIGITIZED_AUTO,0.002,,False,drug-free background,Fig.5 p.10
C6_Hu2024_gentamicin,m-EmG net (raw - background),8,h,8,0.2845,mg (cumulative mass),DIGITIZED_AUTO,0.003,,True,,"net = m-EmG - m-Em, as instructed in the paper's text"
C6_Hu2024_gentamicin,m-EmG raw,1,day,24,0.4392,mg (cumulative mass),DIGITIZED_AUTO,0.002,,False,raw signal; fit uses background-corrected series,Fig.5 p.10
C6_Hu2024_gentamicin,m-Em background,1,day,24,0.1418,mg (cumulative mass),DIGITIZED_AUTO,0.002,,False,drug-free background,Fig.5 p.10
C6_Hu2024_gentamicin,m-EmG net (raw - background),1,day,24,0.2974,mg (cumulative mass),DIGITIZED_AUTO,0.003,,True,,"net = m-EmG - m-Em, as instructed in the paper's text"
C6_Hu2024_gentamicin,m-EmG raw,2,day,48,0.503,mg (cumulative mass),DIGITIZED_AUTO,0.002,,False,raw signal; fit uses background-corrected series,Fig.5 p.10
C6_Hu2024_gentamicin,m-Em background,2,day,48,0.1887,mg (cumulative mass),DIGITIZED_AUTO,0.002,,False,drug-free background,Fig.5 p.10
C6_Hu2024_gentamicin,m-EmG net (raw - background),2,day,48,0.3143,mg (cumulative mass),DIGITIZED_AUTO,0.003,,True,,"net = m-EmG - m-Em, as instructed in the paper's text"
C6_Hu2024_gentamicin,m-EmG raw,4,day,96,0.5663,mg (cumulative mass),DIGITIZED_AUTO,0.002,,False,raw signal; fit uses background-corrected series,Fig.5 p.10
C6_Hu2024_gentamicin,m-Em background,4,day,96,0.2284,mg (cumulative mass),DIGITIZED_AUTO,0.002,,False,drug-free background,Fig.5 p.10
C6_Hu2024_gentamicin,m-EmG net (raw - background),4,day,96,0.3379,mg (cumulative mass),DIGITIZED_AUTO,0.003,,True,,"net = m-EmG - m-Em, as instructed in the paper's text"
C6_Hu2024_gentamicin,m-EmG raw,8,day,192,0.5914,mg (cumulative mass),DIGITIZED_AUTO,0.002,,False,raw signal; fit uses background-corrected series,Fig.5 p.10
C6_Hu2024_gentamicin,m-Em background,8,day,192,0.2336,mg (cumulative mass),DIGITIZED_AUTO,0.002,,False,drug-free background,Fig.5 p.10
C6_Hu2024_gentamicin,m-EmG net (raw - background),8,day,192,0.3578,mg (cumulative mass),DIGITIZED_AUTO,0.003,,True,,"net = m-EmG - m-Em, as instructed in the paper's text"
C6_Hu2024_gentamicin,m-EmG raw,12,day,288,0.5967,mg (cumulative mass),DIGITIZED_AUTO,0.002,,False,raw signal; fit uses background-corrected series,Fig.5 p.10
C6_Hu2024_gentamicin,m-Em background,12,day,288,0.247,mg (cumulative mass),DIGITIZED_AUTO,0.002,,False,drug-free background,Fig.5 p.10
C6_Hu2024_gentamicin,m-EmG net (raw - background),12,day,288,0.3497,mg (cumulative mass),DIGITIZED_AUTO,0.003,,True,,"net = m-EmG - m-Em, as instructed in the paper's text"
C6_Hu2024_gentamicin,m-EmG raw,16,day,384,0.5967,mg (cumulative mass),DIGITIZED_AUTO,0.002,,False,raw signal; fit uses background-corrected series,Fig.5 p.10
C6_Hu2024_gentamicin,m-Em background,16,day,384,0.2466,mg (cumulative mass),DIGITIZED_AUTO,0.002,,False,drug-free background,Fig.5 p.10
C6_Hu2024_gentamicin,m-EmG net (raw - background),16,day,384,0.3501,mg (cumulative mass),DIGITIZED_AUTO,0.003,,True,,"net = m-EmG - m-Em, as instructed in the paper's text"
C6_Hu2024_gentamicin,m-EmG raw,20,day,480,0.6059,mg (cumulative mass),DIGITIZED_AUTO,0.002,,False,raw signal; fit uses background-corrected series,Fig.5 p.10
C6_Hu2024_gentamicin,m-Em background,20,day,480,0.2441,mg (cumulative mass),DIGITIZED_AUTO,0.002,,False,drug-free background,Fig.5 p.10
C6_Hu2024_gentamicin,m-EmG net (raw - background),20,day,480,0.3619,mg (cumulative mass),DIGITIZED_AUTO,0.003,,True,,"net = m-EmG - m-Em, as instructed in the paper's text"
C6_Hu2024_gentamicin,m-EmG raw,24,day,576,0.6271,mg (cumulative mass),DIGITIZED_AUTO,0.002,,False,raw signal; fit uses background-corrected series,Fig.5 p.10
C6_Hu2024_gentamicin,m-Em background,24,day,576,0.2558,mg (cumulative mass),DIGITIZED_AUTO,0.002,,False,drug-free background,Fig.5 p.10
C6_Hu2024_gentamicin,m-EmG net (raw - background),24,day,576,0.3713,mg (cumulative mass),DIGITIZED_AUTO,0.003,,True,,"net = m-EmG - m-Em, as instructed in the paper's text"
C6_Hu2024_gentamicin,m-EmG raw,28,day,672,0.6014,mg (cumulative mass),DIGITIZED_AUTO,0.002,,False,raw signal; fit uses background-corrected series,Fig.5 p.10
C6_Hu2024_gentamicin,m-Em background,28,day,672,0.3159,mg (cumulative mass),DIGITIZED_AUTO,0.002,,False,drug-free background,Fig.5 p.10
C6_Hu2024_gentamicin,m-EmG net (raw - background),28,day,672,0.2855,mg (cumulative mass),DIGITIZED_AUTO,0.003,,True,,"net = m-EmG - m-Em, as instructed in the paper's text"
C6_Hu2024_gentamicin,m-EmG raw,32,day,768,0.6276,mg (cumulative mass),DIGITIZED_AUTO,0.002,,False,raw signal; fit uses background-corrected series,Fig.5 p.10
C6_Hu2024_gentamicin,m-Em background,32,day,768,0.3222,mg (cumulative mass),DIGITIZED_AUTO,0.002,,False,drug-free background,Fig.5 p.10
C6_Hu2024_gentamicin,m-EmG net (raw - background),32,day,768,0.3054,mg (cumulative mass),DIGITIZED_AUTO,0.003,,True,,"net = m-EmG - m-Em, as instructed in the paper's text"
C7_Lan2017_bFGF,B normal GMS,0.42,day,10.08,3.3612,% of encapsulated (fluorescence),DIGITIZED_AUTO,0.3,,True,,Fig.3 p.9; filled squares
C7_Lan2017_bFGF,B normal GMS,0.98,day,23.52,6.8763,% of encapsulated (fluorescence),DIGITIZED_AUTO,0.3,,True,,Fig.3 p.9; filled squares
C7_Lan2017_bFGF,B normal GMS,2.0,day,48.0,30.6041,% of encapsulated (fluorescence),DIGITIZED_AUTO,0.3,,True,,Fig.3 p.9; filled squares
C7_Lan2017_bFGF,B normal GMS,3.0,day,72.0,45.1039,% of encapsulated (fluorescence),DIGITIZED_AUTO,0.3,,True,,Fig.3 p.9; filled squares
C7_Lan2017_bFGF,B normal GMS,4.99,day,119.76,64.7954,% of encapsulated (fluorescence),DIGITIZED_AUTO,0.3,,True,,Fig.3 p.9; filled squares
C7_Lan2017_bFGF,B normal GMS,7.0,day,168.0,82.3809,% of encapsulated (fluorescence),DIGITIZED_AUTO,0.3,,True,,Fig.3 p.9; filled squares
C7_Lan2017_bFGF,B normal GMS,9.0,day,216.0,91.4336,% of encapsulated (fluorescence),DIGITIZED_AUTO,0.3,,True,,Fig.3 p.9; filled squares
C7_Lan2017_bFGF,B normal GMS,12.0,day,288.0,94.6994,% of encapsulated (fluorescence),DIGITIZED_AUTO,0.3,,True,,Fig.3 p.9; filled squares
C7_Lan2017_bFGF,B normal GMS,15.0,day,360.0,95.3015,% of encapsulated (fluorescence),DIGITIZED_AUTO,0.3,,True,,Fig.3 p.9; filled squares
C7_Lan2017_bFGF,B normal GMS,19.99,day,479.76,96.2238,% of encapsulated (fluorescence),DIGITIZED_AUTO,0.3,,True,,Fig.3 p.9; filled squares
C7_Lan2017_bFGF,B normal GMS,29.0,day,696.0,97.067,% of encapsulated (fluorescence),DIGITIZED_AUTO,0.3,,True,,Fig.3 p.9; filled squares
C7_Lan2017_bFGF,A porous GMS,4.99,day,119.76,15.6528,% of encapsulated (fluorescence),DIGITIZED_AUTO,0.3,,True,,Fig.3; hollow-circle centre
C7_Lan2017_bFGF,A porous GMS,6.98,day,167.52,28.8579,% of encapsulated (fluorescence),DIGITIZED_AUTO,0.3,,True,,Fig.3; hollow-circle centre
C7_Lan2017_bFGF,A porous GMS,8.98,day,215.52,40.9647,% of encapsulated (fluorescence),DIGITIZED_AUTO,0.3,,True,,Fig.3; hollow-circle centre
C7_Lan2017_bFGF,A porous GMS,12.0,day,288.0,51.207,% of encapsulated (fluorescence),DIGITIZED_AUTO,0.3,,True,,Fig.3; hollow-circle centre
C7_Lan2017_bFGF,A porous GMS,14.99,day,359.76,55.3612,% of encapsulated (fluorescence),DIGITIZED_AUTO,0.3,,True,,Fig.3; hollow-circle centre
C7_Lan2017_bFGF,A porous GMS,0.42,day,10.08,1.0,% of encapsulated (fluorescence),DIGITIZED_VISUAL,1.0,,True,,Fig.3; error bar crosses hollow marker
C7_Lan2017_bFGF,A porous GMS,1.0,day,24.0,2.8,% of encapsulated (fluorescence),DIGITIZED_VISUAL,1.0,,True,,Fig.3; error bar crosses hollow marker
C7_Lan2017_bFGF,A porous GMS,2.0,day,48.0,5.1,% of encapsulated (fluorescence),DIGITIZED_VISUAL,1.0,,True,,Fig.3; error bar crosses hollow marker
C7_Lan2017_bFGF,A porous GMS,3.0,day,72.0,8.0,% of encapsulated (fluorescence),DIGITIZED_VISUAL,1.0,,True,,Fig.3; error bar crosses hollow marker
C7_Lan2017_bFGF,A porous GMS,20.0,day,480.0,62.1,% of encapsulated (fluorescence),DIGITIZED_VISUAL,1.0,,True,,Fig.3; error bar crosses hollow marker
C7_Lan2017_bFGF,A porous GMS,29.0,day,696.0,65.7,% of encapsulated (fluorescence),DIGITIZED_VISUAL,1.0,,True,,Fig.3; error bar crosses hollow marker
C8_Liu2022_icariin,GM-1 0.25 mM,1,day,24,19.3378,% of loaded drug,DIGITIZED_AUTO,0.6,,True,,Fig.1A p.4
C8_Liu2022_icariin,GM-1 0.25 mM,3,day,72,36.0477,% of loaded drug,DIGITIZED_AUTO,0.6,,True,,Fig.1A p.4
C8_Liu2022_icariin,GM-1 0.25 mM,7,day,168,55.481,% of loaded drug,DIGITIZED_AUTO,0.6,,True,,Fig.1A p.4
C8_Liu2022_icariin,GM-1 0.25 mM,10,day,240,65.8264,% of loaded drug,DIGITIZED_AUTO,0.6,,True,,Fig.1A p.4
C8_Liu2022_icariin,GM-1 0.25 mM,14,day,336,69.9282,% of loaded drug,DIGITIZED_AUTO,0.6,,True,,Fig.1A p.4
C8_Liu2022_icariin,GM-1 0.25 mM,21,day,504,74.9013,% of loaded drug,DIGITIZED_AUTO,0.6,,True,,Fig.1A p.4
C8_Liu2022_icariin,GM-2 0.5 mM,1,day,24,32.0993,% of loaded drug,DIGITIZED_AUTO,0.6,,True,,Fig.1A p.4
C8_Liu2022_icariin,GM-2 0.5 mM,3,day,72,57.1653,% of loaded drug,DIGITIZED_AUTO,0.6,,True,,Fig.1A p.4
C8_Liu2022_icariin,GM-2 0.5 mM,7,day,168,69.7732,% of loaded drug,DIGITIZED_AUTO,0.6,,True,,Fig.1A p.4
C8_Liu2022_icariin,GM-2 0.5 mM,10,day,240,79.9402,% of loaded drug,DIGITIZED_AUTO,0.6,,True,,Fig.1A p.4
C8_Liu2022_icariin,GM-2 0.5 mM,14,day,336,88.2304,% of loaded drug,DIGITIZED_AUTO,0.6,,True,,Fig.1A p.4
C8_Liu2022_icariin,GM-2 0.5 mM,21,day,504,94.7218,% of loaded drug,DIGITIZED_AUTO,0.6,,True,,Fig.1A p.4
C8_Liu2022_icariin,GM-3 1 mM,1,day,24,nan,% of loaded drug,DIGITIZED_AUTO,,,False,markers occluded by GM-1/GM-2 markers; not digitized to avoid guessing,Fig.1A
C8_Liu2022_icariin,GM-3 1 mM,3,day,72,nan,% of loaded drug,DIGITIZED_AUTO,,,False,markers occluded by GM-1/GM-2 markers; not digitized to avoid guessing,Fig.1A
C8_Liu2022_icariin,GM-3 1 mM,7,day,168,nan,% of loaded drug,DIGITIZED_AUTO,,,False,markers occluded by GM-1/GM-2 markers; not digitized to avoid guessing,Fig.1A
C8_Liu2022_icariin,GM-3 1 mM,10,day,240,nan,% of loaded drug,DIGITIZED_AUTO,,,False,markers occluded by GM-1/GM-2 markers; not digitized to avoid guessing,Fig.1A
C8_Liu2022_icariin,GM-3 1 mM,14,day,336,nan,% of loaded drug,DIGITIZED_AUTO,,,False,markers occluded by GM-1/GM-2 markers; not digitized to avoid guessing,Fig.1A
C8_Liu2022_icariin,GM-3 1 mM,21,day,504,nan,% of loaded drug,DIGITIZED_AUTO,,,False,markers occluded by GM-1/GM-2 markers; not digitized to avoid guessing,Fig.1A
C8_Liu2022_icariin,GM-4 2 mM,1,day,24,nan,% of loaded drug,DIGITIZED_AUTO,,,False,markers occluded by GM-1/GM-2 markers; not digitized to avoid guessing,Fig.1A
C8_Liu2022_icariin,GM-4 2 mM,3,day,72,nan,% of loaded drug,DIGITIZED_AUTO,,,False,markers occluded by GM-1/GM-2 markers; not digitized to avoid guessing,Fig.1A
C8_Liu2022_icariin,GM-4 2 mM,7,day,168,nan,% of loaded drug,DIGITIZED_AUTO,,,False,markers occluded by GM-1/GM-2 markers; not digitized to avoid guessing,Fig.1A
C8_Liu2022_icariin,GM-4 2 mM,10,day,240,nan,% of loaded drug,DIGITIZED_AUTO,,,False,markers occluded by GM-1/GM-2 markers; not digitized to avoid guessing,Fig.1A
C8_Liu2022_icariin,GM-4 2 mM,14,day,336,nan,% of loaded drug,DIGITIZED_AUTO,,,False,markers occluded by GM-1/GM-2 markers; not digitized to avoid guessing,Fig.1A
C8_Liu2022_icariin,GM-4 2 mM,21,day,504,nan,% of loaded drug,DIGITIZED_AUTO,,,False,markers occluded by GM-1/GM-2 markers; not digitized to avoid guessing,Fig.1A

````


# FILE: data/data/saravanan2011_fig6_vector.csv

````csv
formulation,marker,time_day_raw,release_pct,SE_pct_from_caps
GM1 (9.8% w/w),diamond,0.002,0.008,
GM1 (9.8% w/w),diamond,1.009,9.981,1.813
GM1 (9.8% w/w),diamond,1.992,15.039,2.104
GM1 (9.8% w/w),diamond,2.999,20.021,1.988
GM1 (9.8% w/w),diamond,5.998,25.004,1.922
GM1 (9.8% w/w),diamond,8.995,30.993,2.096
GM1 (9.8% w/w),diamond,11.992,35.976,2.03
GM1 (9.8% w/w),diamond,15.012,41.033,2.487
GM1 (9.8% w/w),diamond,18.009,45.017,3.094
GM1 (9.8% w/w),diamond,21.008,48.012,3.71
GM1 (9.8% w/w),diamond,24.005,51.007,4.126
GM1 (9.8% w/w),diamond,27.001,53.993,4.201
GM1 (9.8% w/w),diamond,30.001,55.989,3.202
GM2 (18.3% w/w),square,-0.001,0.016,
GM2 (18.3% w/w),square,1.006,16.045,1.996
GM2 (18.3% w/w),square,1.989,26.011,1.922
GM2 (18.3% w/w),square,2.996,32.0,2.096
GM2 (18.3% w/w),square,5.995,38.047,2.529
GM2 (18.3% w/w),square,8.992,45.026,3.094
GM2 (18.3% w/w),square,11.989,51.015,2.096
GM2 (18.3% w/w),square,15.009,56.996,1.822
GM2 (18.3% w/w),square,18.006,63.052,1.53
GM2 (18.3% w/w),square,21.005,68.034,1.389
GM2 (18.3% w/w),square,24.002,72.027,1.714
GM2 (18.3% w/w),square,26.999,76.012,1.921
GM2 (18.3% w/w),square,29.998,80.004,2.387
GM3 (26.7% w/w),triangle,0.002,0.008,
GM3 (26.7% w/w),triangle,1.009,25.004,2.063
GM3 (26.7% w/w),triangle,1.992,35.976,1.672
GM3 (26.7% w/w),triangle,2.999,44.02,1.597
GM3 (26.7% w/w),triangle,5.998,52.005,1.098
GM3 (26.7% w/w),triangle,8.995,58.984,1.389
GM3 (26.7% w/w),triangle,11.992,66.03,1.888
GM3 (26.7% w/w),triangle,15.012,73.017,2.105
GM3 (26.7% w/w),triangle,18.009,78.0,1.78
GM3 (26.7% w/w),triangle,21.008,81.984,2.105
GM3 (26.7% w/w),triangle,24.005,84.979,1.813
GM3 (26.7% w/w),triangle,27.001,88.04,1.389
GM3 (26.7% w/w),triangle,30.001,91.034,2.496

````


# FILE: data/ml/formulations.csv

````csv
paper,doi_or_source,split_group,crosslinker,crosslinker_conc,crosslinker_conc_unit,crosslink_time_h,crosslink_temp_C,crosslink_mode,crosslink_degree_pct,gelatin_type,gelatin_IEP,gelatin_bloom,gelatin_conc_pct_w_v,particle_fabrication,R_um,R_basis,drug,drug_MW,drug_charge,loading_method,drug_loading_pct_w_w,medium,enzyme,enzyme_conc,ionic_medium,temperature_C,f_free,f_weak,k_weak_per_h,mu_per_day,liberation_law,D_cm2s,tau_exit_h,f_irr,target_source,validation_role
"Cheng 2010 (PhD, UIUC, Ch. 2)","dissertation; Figs 2.6A, 2.7, 2.8",cheng2010,glutaraldehyde,0.125,% v/v,24.0,4.0,"post-crosslinking of dry spheres, pH 5, glycine quench",,"basic gelatin (IEP 9.0, Mw 100 kDa, Nitta)",9.0,,5.0,electric-field precision particle fabrication (monodisperse),50.0,swollen mean diameter 100 um,trypan blue (acidic dye),872.9,-4.0,absorption of 0.1 % w/v drug solution into dry spheres (5 ul/mg),,PBS pH 7.4,collagenase 1A,373 ng/ml,PBS,37.0,0.5168,0.0,,0.9633,first-order enzymatic,1.2073127188083611e-11,,0.0,"f_free: calibrated on PBS curve (interpolated in GA for 0.25/0.625); D, mu: published relations (Cheng)",calibration/consistency
"Cheng 2010 (PhD, UIUC, Ch. 2)","dissertation; Figs 2.6A, 2.7, 2.8",cheng2010,glutaraldehyde,0.25,% v/v,24.0,4.0,"post-crosslinking of dry spheres, pH 5, glycine quench",,"basic gelatin (IEP 9.0, Mw 100 kDa, Nitta)",9.0,,5.0,electric-field precision particle fabrication (monodisperse),50.0,swollen mean diameter 100 um,trypan blue (acidic dye),872.9,-4.0,absorption of 0.1 % w/v drug solution into dry spheres (5 ul/mg),,PBS pH 7.4,collagenase 1A,373 ng/ml,PBS,37.0,0.4918,0.0,,0.4611,first-order enzymatic,1.0307535372614134e-11,,0.0,"f_free: calibrated on PBS curve (interpolated in GA for 0.25/0.625); D, mu: published relations (Cheng)",held-out prediction
"Cheng 2010 (PhD, UIUC, Ch. 2)","dissertation; Figs 2.6A, 2.7, 2.8",cheng2010,glutaraldehyde,0.375,% v/v,24.0,4.0,"post-crosslinking of dry spheres, pH 5, glycine quench",,"basic gelatin (IEP 9.0, Mw 100 kDa, Nitta)",9.0,,5.0,electric-field precision particle fabrication (monodisperse),50.0,swollen mean diameter 100 um,trypan blue (acidic dye),872.9,-4.0,absorption of 0.1 % w/v drug solution into dry spheres (5 ul/mg),,PBS pH 7.4,collagenase 1A,373 ng/ml,PBS,37.0,0.4668,0.0,,0.3769,first-order enzymatic,9.396982491226852e-12,,0.0,"f_free: calibrated on PBS curve (interpolated in GA for 0.25/0.625); D, mu: published relations (Cheng)",calibration/consistency
"Cheng 2010 (PhD, UIUC, Ch. 2)","dissertation; Figs 2.6A, 2.7, 2.8",cheng2010,glutaraldehyde,0.625,% v/v,24.0,4.0,"post-crosslinking of dry spheres, pH 5, glycine quench",,"basic gelatin (IEP 9.0, Mw 100 kDa, Nitta)",9.0,,5.0,electric-field precision particle fabrication (monodisperse),50.0,swollen mean diameter 100 um,trypan blue (acidic dye),872.9,-4.0,absorption of 0.1 % w/v drug solution into dry spheres (5 ul/mg),,PBS pH 7.4,collagenase 1A,373 ng/ml,PBS,37.0,0.5083,0.0,,0.3605,first-order enzymatic,8.363435614831263e-12,,0.0,"f_free: calibrated on PBS curve (interpolated in GA for 0.25/0.625); D, mu: published relations (Cheng)",held-out prediction
"Cheng 2010 (PhD, UIUC, Ch. 2)","dissertation; Figs 2.6A, 2.7, 2.8",cheng2010,glutaraldehyde,0.875,% v/v,24.0,4.0,"post-crosslinking of dry spheres, pH 5, glycine quench",,"basic gelatin (IEP 9.0, Mw 100 kDa, Nitta)",9.0,,5.0,electric-field precision particle fabrication (monodisperse),50.0,swollen mean diameter 100 um,trypan blue (acidic dye),872.9,-4.0,absorption of 0.1 % w/v drug solution into dry spheres (5 ul/mg),,PBS pH 7.4,collagenase 1A,373 ng/ml,PBS,37.0,0.5498,0.0,,0.36,first-order enzymatic,7.74556161299051e-12,,0.0,"f_free: calibrated on PBS curve (interpolated in GA for 0.25/0.625); D, mu: published relations (Cheng)",calibration/consistency
Chang 2023,10.3390/polym15061504,chang2023_hu2024,glutaraldehyde,,,,,"post-crosslinking, DAP-modified",55.0,type B,,,,,10.545,SEM diameter / 2 (hollow interior),gentamicin,477.6,5.0,"soaking of formed spheres, 24 h",,PBS,,,PBS,37.0,0.828,,0.968,,"measured mass loss (linear regression, Sec. 3.4)",,,,f_free = first plateau / final value; k_weak from the 1 h point,source of transferred parameters
Chang 2023,10.3390/polym15061504,chang2023_hu2024,glutaraldehyde,,,,,"post-crosslinking, DAP-modified",51.0,type B,,,,,8.68,SEM diameter / 2 (hollow interior),gentamicin,477.6,5.0,"soaking of formed spheres, 24 h",,PBS,,,PBS,37.0,0.538,,,,"measured mass loss (linear regression, Sec. 3.4)",,,,f_free = first plateau / final value; k_weak from the 1 h point,source of transferred parameters
Hu 2024,10.3390/ma17143578,chang2023_hu2024,glutaraldehyde,,,0.5,5.0,,86.0,type B,,,,,8.05,SEM 16.1 +/- 4.8 um,gentamicin,477.6,5.0,"immersion in 10 mg/ml gentamicin, 24 h",,deionised water,,,none (water),37.0,0.828,,0.968,,measured mass loss of drug-free spheres (Fig. 3),,,,transferred from Chang 2023 (no tuning on Hu),cross-paper prediction
Mladenovska 2002,Int J Pharm 242 (2002) 247,mladenovska2002,glutaraldehyde,0.05,mg GA / mg gelatin (saturated toluene),4.0,0.0,,,,,,,,3.515,"series A, mean diameter",BSA,66500.0,,incorporated before crosslinking,,buffer + collagenase,collagenase,,,37.0,0.0,,,,measured mass loss of blank spheres (Fig. 1),,5.69,,"tau_exit from size A, scaled with diameter",calibration
Mladenovska 2002,Int J Pharm 242 (2002) 247,mladenovska2002,glutaraldehyde,0.05,mg GA / mg gelatin (saturated toluene),4.0,0.0,,,,,,,,2.945,"series B, mean diameter",BSA,66500.0,,incorporated before crosslinking,,buffer + collagenase,collagenase,,,37.0,0.0,,,,measured mass loss of blank spheres (Fig. 1),,4.767,,"tau_exit from size A, scaled with diameter",prediction
Mladenovska 2002,Int J Pharm 242 (2002) 247,mladenovska2002,glutaraldehyde,0.05,mg GA / mg gelatin (saturated toluene),4.0,0.0,,,,,,,,2.315,"series C, mean diameter",BSA,66500.0,,incorporated before crosslinking,,buffer + collagenase,collagenase,,,37.0,0.0,,,,measured mass loss of blank spheres (Fig. 1),,3.747,,"tau_exit from size A, scaled with diameter",prediction
Mladenovska 2002,Int J Pharm 242 (2002) 247,mladenovska2002,glutaraldehyde,0.05,mg GA / mg gelatin (saturated toluene),4.0,0.0,,,,,,,,1.6,"series D, mean diameter",BSA,66500.0,,incorporated before crosslinking,,buffer + collagenase,collagenase,,,37.0,0.0,,,,measured mass loss of blank spheres (Fig. 1),,2.59,,"tau_exit from size A, scaled with diameter",prediction
Mladenovska 2002,Int J Pharm 242 (2002) 247,mladenovska2002,glutaraldehyde,0.05,mg GA / mg gelatin (saturated toluene),4.0,0.0,,,,,,,,1.145,"series E, mean diameter",BSA,66500.0,,incorporated before crosslinking,,buffer + collagenase,collagenase,,,37.0,0.0,,,,measured mass loss of blank spheres (Fig. 1),,1.853,,"tau_exit from size A, scaled with diameter",prediction
Mladenovska 2002,Int J Pharm 242 (2002) 247,mladenovska2002,glutaraldehyde,0.05,mg GA / mg gelatin (saturated toluene),4.0,0.0,,,,,,,,0.995,"series F, mean diameter",BSA,66500.0,,incorporated before crosslinking,,buffer + collagenase,collagenase,,,37.0,0.0,,,,measured mass loss of blank spheres (Fig. 1),,1.611,,"tau_exit from size A, scaled with diameter",prediction

````


<!-- ===== notes/abdekhodaie2006_selfcheck.md ===== -->

# FILE: notes/abdekhodaie2006_selfcheck.md

# Steps 1/2 applied to Abdekhodaie & Wu 2006 itself (verapamil on Sephadex SP C-25), 8 Aban 1405
Data Fig. 13 digitized (3 curves: lambda 40.67 C0 1.8; 82.33 C0 1.8; 40.67 C0 3.6 mg/ml; 0-18 min). D (25C): D_w 3.75e-6; step 1 Mackie-Meares Q=12 2.69e-6; step 2 Eq. 26 3.24e-6 (paper 3.21e-6).
Model: Fick + finite well-stirred bath; Langmuir equilibrium K=6056, C_max=0.229 from Fig. 12 (independent); no kinetic fitting. R not reported: 46-137 um bounds, base 100 um.
Equilibrium: Eq. 30 gives 0.069 vs 0.069 (data); other curves 0.33 vs 0.37 and 0.29 vs 0.32.
Kinetics t90: data ~3 min (173-197 s); steps 1-2 2-6 s (0.4-11 s across R): gap 30-100x. Paper fits K_ads=0.133 on curve 1 (tau_int ~33 s). Our reproduction RMS 0.03 (fitted), 0.05-0.07 others.
Fick without binding: equilibrium 0.976 vs 0.07. Sign note: paper Eq. 4 should carry a minus sign.
Files: 08_stepD/abd06_check.py, abd06_step12_vs_data.png



<!-- ===== notes/abdekhodaie_fick_to_langmuir.md ===== -->

# FILE: notes/abdekhodaie_fick_to_langmuir.md

# Abdekhodaie 2006: why Fick failed and what synced it (8 Nov 2026)
Data: Fig. 13, verapamil loading onto Sephadex SP C-25. Loading is release in reverse.

| Stage | What is added | Source of numbers | RMS 1 / 2 / 3 |
|---|---|---|---|
| 1 | Fick alone | D Wilke-Chang x Mackie-Meares (2.69e-6) | 0.86 / 0.58 / 0.62 |
| 2 | Crosslinked network | Eq. 26, D = 3.24e-6 (paper 3.21e-6) | unchanged |
| 3 | Langmuir equilibrium | K = 6056 1/M, C_max = 0.229 M from Fig. 12 | 0.095 / 0.098 / 0.089 |
| 4 | Langmuir kinetics | K_ads = 0.133 fitted by paper on curve 1 | 0.029 / 0.072 / 0.052 |

Stage 1: predicted plateau 0.976 vs data 0.069; t90 6 s vs 173 s. Stage 3: plateaus right, t90 still 2-5 s. Stage 4: curves 2, 3 are predictions; only curve 1 carries the fitted K_ads.
Causes: Level: Fick can take up at most 1/(1+lambda)=2.4 % while 93 % is taken up (binding to SP groups). Speed: tau_D ~3 s, tau_ads ~33 s, data ~3 min -> set by binding reaction.
Fields: stage 3 fills surface-inward in ~8 s; stage 4 fills uniformly over minutes.
Deck: https://claude.ai/artifact/KnUxEsCjPvRWabJeETf4tU ; Report: Report_Abdekhodaie_Fick_to_Langmuir_fa.docx ; Code: 02_abdekhodaie2006/



<!-- ===== notes/degradation_doe_kodra_nov2026.md ===== -->

# FILE: notes/degradation_doe_kodra_nov2026.md

# Degradation + DOE (Kodra 2026) added to the Abdekhodaie report (18 Aban 1405 / 8 Nov 2026)
Report: 14 pages, RTL, OMML equations, headings as plain styled paragraphs (no collapsible Heading styles). Deck: Slides artifact, 25 slides.

## DOE
Kodra 2026, ketoprofen in tannic-acid-crosslinked gelatin microspheres. Factor: crosslinking time 4 / 2 / 0.5 h (MS/K-1, K-2, K-3). Measured per formulation: EE 38.9/22.5/15.2 %, SD(t), DR(t), release. One unknown k_off = 2.68e-5 1/s, fitted on K-1 only, t <= 5 h; K-2, K-3 use k_off scaled by ln(100/EE) ratio (an assumption, not a measurement).

## Five-step ladder (RMSE % release, K-1 / K-2 / K-3, mean) with honest labels
1 Fick 69.8/59.4/49.5, 59.6, rejected | 2 + swelling same, rejected | 3 + binding 14.1/14.8/31.4, 20.1, partial | 4 + degradation 17.7/12.5/12.4, 14.2, valid prediction for K-2, K-3 only | 5 + non-releasable pool 10.3/12.5/12.4, 11.7, descriptive only (f_irr 0.38 for K-1 from curve end point, 0 for K-2/K-3).
t50 data / model step 5: K-1 15.3/11.9, K-2 3.4/4.0, K-3 1.4/1.8 h. Model slower than data for K-2 at 5 h (57 vs 85) and K-3 at 1 and 3 h (24 vs 37, 76 vs 99.6).
Lumped model vs full PDE: release differs by at most 0.1 %.

## Abdekhodaie wording
"Synced" softened to "got close, not fully": (a) plateau of curves 2, 3 is the paper's own Eq. 30 value (0.332, 0.288 vs data 0.370, 0.317); (b) one K_ads does not fit all three curves: best per curve 0.10 / 0.05 / 0.07 vs 0.133. Radius is not the cause (46-137 um changes RMS in the 3rd decimal).

## External tests
Mladenovska 2002 lag law tau = R/v (RMSE 3.6-6.5 %, v from size A only); Hu 2024 (24 h 83 vs 84 %, RMSE 9.1 % after day 1, 1-8 h too fast).

## Files
Deg_DOE/ -> here 03_degradation_doe_kodra/ ; Abd06_sync/ -> 02_abdekhodaie2006/



<!-- ===== notes/external_test_hu2024.md ===== -->

# FILE: notes/external_test_hu2024.md

# Step 6 - External test: Hu 2024 (Materials 17:3578)
Nothing tuned on Hu. Gentamicin, type-B gelatin + GA, soak-loaded; R = 8.05 um. Free fraction from Chang 2023: 0.83 (1.0dM), 0.54 (2.5dM, bound). g(t) = Hu's own m-Em weight loss (Fig. 3), complete ~30 d. Data: Fig. 5 net release normalized to 8-24 d plateau.
Results (0.83): RMSE after 1 d 9.1 %, overall 19.5 %; 24 h level data 84 %, model 83 %. Free fraction 0.54: RMSE 21.7 % after 1 d.
Miss: 1-8 h data rise slower than model (29 -> 78 %); points to desorption phase of hours (k_off needs independent data).
Release ~95 % by day 4-8 while mass loss only 23-40 %: degradation controls only the last few percent. Day 28-32 dip = background-subtraction artifact.
Verdict: partial pass. Steps 1-2 relabeled "necessary base, insufficient alone".
Code: 01_stage1-4_mdl/external/hu2024_external.py



<!-- ===== notes/gelatin_design_map.md ===== -->

# FILE: notes/gelatin_design_map.md

# From parameters to release shape (design map), 12 Aban 1405
Lumped form: dM/dt = -(pi^2 D/R^2) M + k_off S + r S ; dS/dt = -(k_off + r) S ; r = -g'/g. Difference from full PDE for Kodra inputs: 3e-6.
Groups: tau_des/tau_deg (tau_des = 1/k_off), initial free fraction (burst), non-releasable fraction, diffusion time R^2/(pi^2 D) ~0.1 s (negligible).
Map: desorption share >0.7 desorption-controlled; <0.3 degradation-controlled; between mixed; free fraction >0.5 burst/biphasic.
Placement: K-1 mixed (0.70); K-2 desorption (0.80); K-3 mixed (0.41); Chang both degradation-controlled and biphasic.
t50 model vs data: K-2 4.0 vs 3.4 h; K-3 1.85 vs 1.41; K-1 6.3 vs 15.3 (non-releasable fraction missing). RMSE 10-18 %.
Sensitivity around K-2 (x0.5/x1.5): desorption time t50 -48/+44 %; degradation time -12/+3 %; free fraction ~+-4 %; R, Q 0 %. Crosslinking acts mainly via binding strength.
Simulator artifact (Persian UI): presets Kodra K-1/2/3, Chang 1.0/2.5; design mode crosslink time 0.5-4 h interpolated only inside tested range.
Kodra DOE ladder (kodra_steps.py): 1 Fick 69.8/59.4/49.5 mean 59.5 rejected; 2 +swelling same; 3 +binding 14.1/14.8/31.4 mean 20.1 partial; 4 +degradation 17.7/12.5/12.5 mean 14.2 valid for K-2,K-3; 5 +non-releasable pool 10.3/12.5/12.5 mean 11.7 current.
Design example: at 1 h crosslinking t50 ~2.2 h, 24-h release ~100 % (testable prediction).
Files: 05_gelatin_design/



<!-- ===== notes/gelatin_routes_step3.md ===== -->

# FILE: notes/gelatin_routes_step3.md

# Step 3 - three crosslinking routes plus degradation (gelatin), 12 Aban 1405
Model gelatin_routes_model.py (proposal Eq. 4-8): free C (diffuses), reversibly bound S (Langmuir, sites S_max0*g(t)), strongly bound P (freed only by degradation r=-g'/g). D(t)=D_w*MM(phi0*g(t)); option D=D_w*Eq.26(Q(t)); boundary perfect sink or membrane h.
Verification: no binding = Crank (1e-5); fast linear binding = Crank with D/(1+K_b) (7e-5); strong pool under linear degradation freed in proportion.
Route activation: Chang 2023 gentamicin(+)/type B/GA route 2 active (modelled); Hu 2024 same; Lan 2017 bFGF/formaldehyde (isotherm saturates ~2.1 mg/g; 35 % unreleased 28 d); Zhang 2023 vancomycin/EDC weak, dialysis-bag barrier, plateau <100 %; Kodra 2026 ketoprofen(-)/tannic acid, TA-drug binding (modelled); Saravanan 2011 and Liu 2022 inactive (dispersed drug); Jin 2023 morphine: unknown.
Chang 2023: free fraction 0.83 / 0.54; free pool out in ~2 h; proportional freeing of strong pool is too early (day 16 predicted 94/77 %, data 84/59 %). Next: tie liberation to crosslink scission; microspheres are hollow.
Kodra 2026 full integration: Q(t) from SD%, EE 38.9/22.5/15.2, g(t)=DR%(t), R=7.5 um*Q^(1/3); initial retained drug all bound. k_off = 2.7e-5 1/s fitted on K-1 t<=5 h; others scaled ln(1/EE). K-2 RMSE 12.5 % (19.7 without scaling), K-3 12.4 % (17.4); K-1 24 h predicted 100 % vs 62 % data (~38 % bound to soluble fragments).
Files: 04_gelatin_routes/



<!-- ===== notes/model_completion_nov2026.md ===== -->

# FILE: notes/model_completion_nov2026.md

# Completing the gelatin model with the new PDFs (17 Aban 1405)
## Mladenovska 2002 (Int J Pharm 242:247)
BSA in GA-crosslinked gelatin microspheres, 6 sizes (1.99-7.03 um), 0.1 mg/ml collagenase. Fick RMSE 40-63 %; release = mass loss 22-31 %; with lag tau = R/v 3.6-6.5 %.
t50 ~ d^0.83 (diffusion would give 2, front control 1) -> not diffusion-controlled. Release lags mass loss (50-56 points at 1 h, ~0 at 13 h): third paper showing lag (Chang, Kodra K-1).
Lag model dF/dt = (L(t)-F)/tau, L = measured mass loss; tau ~ d^0.90; v = R/tau ~ 0.62 um/h (0.51-0.76), calibrated on size A only, sizes B-F predicted RMSE 3.6-5.7 %. v is not yet transferable to non-enzymatic media.
## Politzer 1996 (J Phys Chem 100:5538)
D of 10 small molecules in gelatin layers: swollen 2.9-16.7e-7 cm2/s, dry ~9x lower. Same order as our gel D (~1e-6): step-1 D confirmed; slow release cannot come from D.
## COMSOL-style figures (Model_completion/, comsol_style.py)
A Fick gentamicin R=8 um empties in ~0.1 s; B step-5 Kodra K-1 uniform fading; C free-drug quasi-steady profile <5e-4 % of drug; D 3D cutaway; E mesh 40 shells.
## Gaps open
k_off fitted (needs Singh or Song 2015); Cheng 2011, Choy 2008 not received; Hu early 1-8 h; Zhang 2023 external test not run. For PLGA branch: Chen 2026 adaptive FEM (D=4.6e-14 cm2/s, optimised 1.11e-12, r=52.56 um); 2024 PLGA implant model.



<!-- ===== notes/plga_step1_findings.md ===== -->

# FILE: notes/plga_step1_findings.md

# Switch to PLGA, step 1 (Fick without fitting), 8 Aban 1405
Main line moved to PLGA/PLA microspheres (industrial value). Base for numerics: Chen, Hu & Ouyang 2026 (AAMM 18:897; 3D Fick, adaptive FEM); physics from Ford Versypt 2013 review and Mittapelly 2024 (ACS ABM 7:7453).
Step 1: D = D_medium (Wilke-Chang) x Mackie-Meares(phi=1-eps). 1a dissolved (Crank); 1b dispersed above solubility (pseudo-steady Higuchi sphere): t50 = 0.01835 C0 R^2/(D Cs).
Dataset: Sivasankaran & Jonnalagadda 2022 (Int J Pharm 624:121994), levonorgestrel in PLLA, spray-dried, D50 4-5.5 um, loading 6-51 %, 50 % EtOH; Fig. 7 digitized, day-28 from Table 7. eps not reported (0.02-0.3). Cs lower bound 0.02 mg/ml.
Results: data t50 118, 25, 5.4, <8, 1.8 h (batches 2-6). 1a t50 0.2-0.3 s: 1e4-1e6 faster. 1b (Cs 0.02, eps 0.1): 11 min-1 h; gap ~600x at 6 % loading, ~2x at 51 %. Opposite trend vs loading. Key unknowns: loading-dependent porosity/percolation, polymer state (Tg), burst.
Implants 2024 paper: SI Tables S1-S4 not available.
Files: 07_plga/



<!-- ===== notes/stage1-4_findings.md ===== -->

# FILE: notes/stage1-4_findings.md

# Gelatin microsphere release modelling - findings (25 Mehr 1405)
Verification: spherical FVM vs analytical series: spatial order 2.00, temporal 1.00 (BE) / 2.00 (CN+Rannacher); mass balance 1.4e-14; positive, monotone.
Dataset: audit Excel had no time-release curves; English dataset built from PDFs (DIRECT / VECTOR_EXTRACTED / DIGITIZED_AUTO / DIGITIZED_VISUAL). Cases: Jin 2023 morphine, Saravanan 2011 diclofenac, Kodra 2026 ketoprofen, Zhang 2023 vancomycin, Chang 2023 and Hu 2024 gentamicin, Lan 2017 bFGF, Liu 2022 icariin. Fixed split: first max(3, floor(0.6 n)) points train.
Constant-D Fick sufficient: diclofenac GM1-3 (D_app 5e-14 to 3.5e-13, charge dependent), icariin. Insufficient: Kodra K-2/3, vancomycin (dialysis bag, plateau <100 %), bFGF (sigmoid). Chang: only to day 16.
Abbasi 2008 (Drug Delivery 15:455): C_i mass concentration; dry initial condition; ideal swelling with volume additivity (Eq. 15), front-fixing; no degradation; Table 1 = Excel. Critique: gels water-containing but dry IC; D1,eq/D2,eq swapped in symbol list; r0=12.5 mm vs diameter 12.5 mm.
Fick+swelling (Abbasi spherical, Table 1, one parameter k_eq): D_eq ~4.0-4.5x Fick D_app. With particle growth from Kodra SD%: K-2 13.1->5.9, K-3 18.7->9.4, K-1 worse 3.4->14.3. Morphine test error 12.3->4.3.
Deliveries: Colab notebook Gelatin_Microsphere_Release_Fick_Swelling.ipynb; 21-slide animated deck.



<!-- ===== notes/stepD_formula_D_findings.md ===== -->

# FILE: notes/stepD_formula_D_findings.md

# D from first principles -> Fick -> Abdekhodaie 2006 swelling correction -> validation (29 Mehr 1405)
No fitting on release curves. D_w Wilke-Chang (Eq. 28 of Abdekhodaie & Wu 2006, Le Bas volume); D_gel Mackie-Meares phi=1/Q; swelling correction Eq. 26 D/D_w = r_s Q^-3/4 exp(-1/(Q-1)), Y=1.
Validation: verapamil Q=12 paper 3.21e-6 code 3.24e-6; rhodamine in water 4.0e-6 measured (Gendron 2008), WC 3.95e-6, SE 4.14e-6; rhodamine B in GelMA 5-10 % (Dogan 2023) code/measured 0.82-0.89.
Eq. 26 as printed: reproduces paper number only with r_s in angstrom; for Q below ~10 gives D_gel > D_w; probably a missing "1 minus" (Lustig-Peppas 1 - r_s/xi) -> raise with supervisor. Ratios >1 capped at D_w.
Measured swelling exists only in Kodra (SD% 1942/1701/930 -> Q 27.2/24.0/13.6) and Zhang (Fig 8 p.4362, ~390/410 % -> Q ~6.3/6.5). No hypothetical swelling for the rest.
D_w small drugs 37C 4.5-7.6e-6, D_gel 1.5-6.5e-6 cm2/s. Model t50 in steps 1-2: 0.008-0.13 s vs data 1 h to ~11 d (5e4-3e7x slower); swelling changes at most 2x -> diffusion in swollen network not controlling; candidates: binding (Langmuir, Eq. 5-8, 22 of 2006 paper), degradation, outer barrier.
Abbasi 2008: caffeine D in gel (2.5-3.8e-5) > in water -> apparent, not absolute D source.
Deliverables: Report_D_formula_Fick_Abdekhodaie_fa.docx, Presentation_Script_noFit_fa.docx, Step_D_Colab_Package.zip

