# 06 — Marketing and go-to-market

Labels: **[FACT + source]**, **[ASSUMPTION]**, **[TO RESEARCH]**. Grok must verify every market figure with a second source before it goes into a pitch deck or business plan.

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
