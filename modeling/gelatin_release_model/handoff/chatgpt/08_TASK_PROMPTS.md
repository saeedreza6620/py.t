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
