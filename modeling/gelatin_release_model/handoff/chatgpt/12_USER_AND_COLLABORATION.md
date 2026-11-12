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
