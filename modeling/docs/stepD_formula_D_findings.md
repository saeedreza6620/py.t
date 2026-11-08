# D from first principles -> Fick -> Abdekhodaie 2006 swelling correction -> validation (29 Mehr 1405)
No fitting on release curves. D_w Wilke-Chang (Eq. 28 of Abdekhodaie & Wu 2006, Le Bas volume); D_gel Mackie-Meares phi=1/Q; swelling correction Eq. 26 D/D_w = r_s Q^-3/4 exp(-1/(Q-1)), Y=1.
Validation: verapamil Q=12 paper 3.21e-6 code 3.24e-6; rhodamine in water 4.0e-6 measured (Gendron 2008), WC 3.95e-6, SE 4.14e-6; rhodamine B in GelMA 5-10 % (Dogan 2023) code/measured 0.82-0.89.
Eq. 26 as printed: reproduces paper number only with r_s in angstrom; for Q below ~10 gives D_gel > D_w; probably a missing "1 minus" (Lustig-Peppas 1 - r_s/xi) -> raise with supervisor. Ratios >1 capped at D_w.
Measured swelling exists only in Kodra (SD% 1942/1701/930 -> Q 27.2/24.0/13.6) and Zhang (Fig 8 p.4362, ~390/410 % -> Q ~6.3/6.5). No hypothetical swelling for the rest.
D_w small drugs 37C 4.5-7.6e-6, D_gel 1.5-6.5e-6 cm2/s. Model t50 in steps 1-2: 0.008-0.13 s vs data 1 h to ~11 d (5e4-3e7x slower); swelling changes at most 2x -> diffusion in swollen network not controlling; candidates: binding (Langmuir, Eq. 5-8, 22 of 2006 paper), degradation, outer barrier.
Abbasi 2008: caffeine D in gel (2.5-3.8e-5) > in water -> apparent, not absolute D source.
Deliverables: Report_D_formula_Fick_Abdekhodaie_fa.docx, Presentation_Script_noFit_fa.docx, Step_D_Colab_Package.zip
