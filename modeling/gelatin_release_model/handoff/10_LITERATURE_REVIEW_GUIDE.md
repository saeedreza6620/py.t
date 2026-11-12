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

## 4. How to continue it (tasks for Grok)
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
