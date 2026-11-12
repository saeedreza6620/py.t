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
