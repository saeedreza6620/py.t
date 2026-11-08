# Abdekhodaie 2006: from Fick to Langmuir (code + COMSOL-style figures)
Run:  python3 abd06_sync.py      (needs numpy, scipy, matplotlib; comsol_lib.py in the same folder)
      python3 deck_figs.py       (large single-curve figures used in the slides)
Outputs: abd06_sync_results.json, figs/*.png
Stages: 1 Fick (Wilke–Chang × Mackie–Meares) · 2 + crosslinked network (Eq. 26) · 3 + Langmuir equilibrium (K, C_max from Fig. 12) · 4 + Langmuir kinetics (K_ads = 0.133, fitted by the paper on curve 1)
