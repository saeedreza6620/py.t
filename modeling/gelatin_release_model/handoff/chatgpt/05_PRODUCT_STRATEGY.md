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
