# Gelatin microsphere release modelling - findings (25 Mehr 1405)
Verification: spherical FVM vs analytical series: spatial order 2.00, temporal 1.00 (BE) / 2.00 (CN+Rannacher); mass balance 1.4e-14; positive, monotone.
Dataset: audit Excel had no time-release curves; English dataset built from PDFs (DIRECT / VECTOR_EXTRACTED / DIGITIZED_AUTO / DIGITIZED_VISUAL). Cases: Jin 2023 morphine, Saravanan 2011 diclofenac, Kodra 2026 ketoprofen, Zhang 2023 vancomycin, Chang 2023 and Hu 2024 gentamicin, Lan 2017 bFGF, Liu 2022 icariin. Fixed split: first max(3, floor(0.6 n)) points train.
Constant-D Fick sufficient: diclofenac GM1-3 (D_app 5e-14 to 3.5e-13, charge dependent), icariin. Insufficient: Kodra K-2/3, vancomycin (dialysis bag, plateau <100 %), bFGF (sigmoid). Chang: only to day 16.
Abbasi 2008 (Drug Delivery 15:455): C_i mass concentration; dry initial condition; ideal swelling with volume additivity (Eq. 15), front-fixing; no degradation; Table 1 = Excel. Critique: gels water-containing but dry IC; D1,eq/D2,eq swapped in symbol list; r0=12.5 mm vs diameter 12.5 mm.
Fick+swelling (Abbasi spherical, Table 1, one parameter k_eq): D_eq ~4.0-4.5x Fick D_app. With particle growth from Kodra SD%: K-2 13.1->5.9, K-3 18.7->9.4, K-1 worse 3.4->14.3. Morphine test error 12.3->4.3.
Deliveries: Colab notebook Gelatin_Microsphere_Release_Fick_Swelling.ipynb; 21-slide animated deck.
