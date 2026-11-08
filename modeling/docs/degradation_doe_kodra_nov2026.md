# Degradation + DOE (Kodra 2026) added to the Abdekhodaie report (18 Aban 1405 / 8 Nov 2026)
Report: 14 pages, RTL, OMML equations, headings as plain styled paragraphs (no collapsible Heading styles). Deck: Slides artifact, 25 slides.

## DOE
Kodra 2026, ketoprofen in tannic-acid-crosslinked gelatin microspheres. Factor: crosslinking time 4 / 2 / 0.5 h (MS/K-1, K-2, K-3). Measured per formulation: EE 38.9/22.5/15.2 %, SD(t), DR(t), release. One unknown k_off = 2.68e-5 1/s, fitted on K-1 only, t <= 5 h; K-2, K-3 use k_off scaled by ln(100/EE) ratio (an assumption, not a measurement).

## Five-step ladder (RMSE % release, K-1 / K-2 / K-3, mean) with honest labels
1 Fick 69.8/59.4/49.5, 59.6, rejected | 2 + swelling same, rejected | 3 + binding 14.1/14.8/31.4, 20.1, partial | 4 + degradation 17.7/12.5/12.4, 14.2, valid prediction for K-2, K-3 only | 5 + non-releasable pool 10.3/12.5/12.4, 11.7, descriptive only (f_irr 0.38 for K-1 from curve end point, 0 for K-2/K-3).
t50 data / model step 5: K-1 15.3/11.9, K-2 3.4/4.0, K-3 1.4/1.8 h. Model slower than data for K-2 at 5 h (57 vs 85) and K-3 at 1 and 3 h (24 vs 37, 76 vs 99.6).
Lumped model vs full PDE: release differs by at most 0.1 %.

## Abdekhodaie wording
"Synced" softened to "got close, not fully": (a) plateau of curves 2, 3 is the paper's own Eq. 30 value (0.332, 0.288 vs data 0.370, 0.317); (b) one K_ads does not fit all three curves: best per curve 0.10 / 0.05 / 0.07 vs 0.133. Radius is not the cause (46-137 um changes RMS in the 3rd decimal).

## External tests
Mladenovska 2002 lag law tau = R/v (RMSE 3.6-6.5 %, v from size A only); Hu 2024 (24 h 83 vs 84 %, RMSE 9.1 % after day 1, 1-8 h too fast).

## Files
Deg_DOE/ -> here 03_degradation_doe_kodra/ ; Abd06_sync/ -> 02_abdekhodaie2006/
