# Step 6 - External test: Hu 2024 (Materials 17:3578)
Nothing tuned on Hu. Gentamicin, type-B gelatin + GA, soak-loaded; R = 8.05 um. Free fraction from Chang 2023: 0.83 (1.0dM), 0.54 (2.5dM, bound). g(t) = Hu's own m-Em weight loss (Fig. 3), complete ~30 d. Data: Fig. 5 net release normalized to 8-24 d plateau.
Results (0.83): RMSE after 1 d 9.1 %, overall 19.5 %; 24 h level data 84 %, model 83 %. Free fraction 0.54: RMSE 21.7 % after 1 d.
Miss: 1-8 h data rise slower than model (29 -> 78 %); points to desorption phase of hours (k_off needs independent data).
Release ~95 % by day 4-8 while mass loss only 23-40 %: degradation controls only the last few percent. Day 28-32 dip = background-subtraction artifact.
Verdict: partial pass. Steps 1-2 relabeled "necessary base, insufficient alone".
Code: 01_stage1-4_mdl/external/hu2024_external.py
