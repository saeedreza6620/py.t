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
