# Switch to PLGA, step 1 (Fick without fitting), 8 Aban 1405
Main line moved to PLGA/PLA microspheres (industrial value). Base for numerics: Chen, Hu & Ouyang 2026 (AAMM 18:897; 3D Fick, adaptive FEM); physics from Ford Versypt 2013 review and Mittapelly 2024 (ACS ABM 7:7453).
Step 1: D = D_medium (Wilke-Chang) x Mackie-Meares(phi=1-eps). 1a dissolved (Crank); 1b dispersed above solubility (pseudo-steady Higuchi sphere): t50 = 0.01835 C0 R^2/(D Cs).
Dataset: Sivasankaran & Jonnalagadda 2022 (Int J Pharm 624:121994), levonorgestrel in PLLA, spray-dried, D50 4-5.5 um, loading 6-51 %, 50 % EtOH; Fig. 7 digitized, day-28 from Table 7. eps not reported (0.02-0.3). Cs lower bound 0.02 mg/ml.
Results: data t50 118, 25, 5.4, <8, 1.8 h (batches 2-6). 1a t50 0.2-0.3 s: 1e4-1e6 faster. 1b (Cs 0.02, eps 0.1): 11 min-1 h; gap ~600x at 6 % loading, ~2x at 51 %. Opposite trend vs loading. Key unknowns: loading-dependent porosity/percolation, polymer state (Tg), burst.
Implants 2024 paper: SI Tables S1-S4 not available.
Files: 07_plga/
