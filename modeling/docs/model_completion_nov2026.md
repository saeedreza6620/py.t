# Completing the gelatin model with the new PDFs (17 Aban 1405)
## Mladenovska 2002 (Int J Pharm 242:247)
BSA in GA-crosslinked gelatin microspheres, 6 sizes (1.99-7.03 um), 0.1 mg/ml collagenase. Fick RMSE 40-63 %; release = mass loss 22-31 %; with lag tau = R/v 3.6-6.5 %.
t50 ~ d^0.83 (diffusion would give 2, front control 1) -> not diffusion-controlled. Release lags mass loss (50-56 points at 1 h, ~0 at 13 h): third paper showing lag (Chang, Kodra K-1).
Lag model dF/dt = (L(t)-F)/tau, L = measured mass loss; tau ~ d^0.90; v = R/tau ~ 0.62 um/h (0.51-0.76), calibrated on size A only, sizes B-F predicted RMSE 3.6-5.7 %. v is not yet transferable to non-enzymatic media.
## Politzer 1996 (J Phys Chem 100:5538)
D of 10 small molecules in gelatin layers: swollen 2.9-16.7e-7 cm2/s, dry ~9x lower. Same order as our gel D (~1e-6): step-1 D confirmed; slow release cannot come from D.
## COMSOL-style figures (Model_completion/, comsol_style.py)
A Fick gentamicin R=8 um empties in ~0.1 s; B step-5 Kodra K-1 uniform fading; C free-drug quasi-steady profile <5e-4 % of drug; D 3D cutaway; E mesh 40 shells.
## Gaps open
k_off fitted (needs Singh or Song 2015); Cheng 2011, Choy 2008 not received; Hu early 1-8 h; Zhang 2023 external test not run. For PLGA branch: Chen 2026 adaptive FEM (D=4.6e-14 cm2/s, optimised 1.11e-12, r=52.56 um); 2024 PLGA implant model.
