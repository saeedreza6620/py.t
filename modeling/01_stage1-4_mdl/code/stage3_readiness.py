"""Stage 3 — readiness of each case for a hydration-dependent (Fujita-type) diffusivity.
Outputs results/stage3_readiness.csv, results/abbasi2008_workbook_values.csv, Fig3_1."""
import os, numpy as np, pandas as pd
from plotstyle import plt, save, C, INK2

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, "results"); FIG = os.path.join(ROOT, "figures")

# Abbasi, Eslamian & Rousseau 2008 (DOI 10.1080/10717540802321628): values as recorded in the
# audit workbook (sheet 04, rows D060-D091, 'Table II'); full text NOT available in this session.
ab = []
for gel, md, caf, Dw, bw, Dc, bc in [
    (5, 0, 0.10, 4.4e-5, 6.8, 3.8e-5, 8.5), (5, 0, 0.05, 4.4e-5, 6.8, 3.2e-5, 9.8),
    (5, 4, 0.10, 3.5e-5, 3.2, 3.0e-5, 4.8), (5, 4, 0.05, 3.5e-5, 3.2, 3.3e-5, 7.8),
    (4, 0, 0.10, 5.6e-5, 4.1, 2.5e-5, 5.9), (4, 0, 0.05, 5.6e-5, 4.1, 2.5e-5, 6.9),
    (4, 4, 0.10, 4.8e-5, 4.8, 3.5e-5, 5.9), (4, 4, 0.05, 4.8e-5, 4.8, 3.5e-5, 8.9)]:
    ab.append(dict(gelatin_wt=gel, maltodextrin_wt=md, caffeine_wt=caf, Dw_eq_cm2_s=Dw, beta_w=bw,
                   Dcaf_eq_cm2_s=Dc, beta_caf=bc, geometry="cylinder D=12.5 mm, H=10 mm (hydrogel, not microsphere)",
                   provenance="audit workbook sheet 04 (DIRECT_TABLE, 'Table II, attached PDF'); not re-verified here"))
AB = pd.DataFrame(ab); AB.to_csv(os.path.join(RES, "abbasi2008_workbook_values.csv"), index=False)

fig, ax = plt.subplots(figsize=(5.2, 3.4))
th = np.linspace(0, 1, 200)
for i, b in enumerate(sorted(set(AB.beta_caf))):
    ax.semilogy(th, np.exp(-b * (1 - th)), color=C[i % 8], lw=1.3, label=fr"$\beta_d$={b:g}")
ax.set_xlabel(r"$C_w/C_{w,eq}$"); ax.set_ylabel(r"$D_d/D_{d,eq}$")
ax.legend(fontsize=7, ncol=2, title="caffeine, workbook values", title_fontsize=7.5)
save(fig, os.path.join(FIG, "Fig3_1_fujita_shape.png"))

Y, N, P, U = "yes", "no", "partial", "not reported"
rows = [
 dict(case="C1 Jin 2023 morphine", Q1_Cw_or_data=N, Q2_same_formulation_medium="—", Q3_volume_or_radius_vs_time=N,
      Q4_network_mass_constant=U, Q5_covers_initial_transient=N, determinable="k only (lumped D_app/R^2)",
      decision="constant radius; Fujita model not testable"),
 dict(case="C2 Saravanan 2011 diclofenac", Q1_Cw_or_data=N, Q2_same_formulation_medium="—", Q3_volume_or_radius_vs_time=N,
      Q4_network_mass_constant=U, Q5_covers_initial_transient=N, determinable="k per batch; D_app with assumed R uncertainty",
      decision="constant radius; Fujita model not testable"),
 dict(case="C3 Kodra 2026 ketoprofen", Q1_Cw_or_data=P + ": gravimetric SD% = (Wt-Wi)/Wi only; no wet volume -> C_w not computable",
      Q2_same_formulation_medium=Y + " (MS/K-1..3, PBS pH 7.4, 37 C)",
      Q3_volume_or_radius_vs_time=N + " (single hydrated size distribution of empty MS; MS/K Table S2 unavailable)",
      Q4_network_mass_constant=N + " (DR% -> ~0 at 24 h; apparent SD falls after its peak)",
      Q5_covers_initial_transient=N + " (first swelling point 1 h; 10-38% of drug already released by 1 h)",
      determinable="k; exploratory (k_eq, beta) of a gravimetric-index model only, weakly identifiable",
      decision="constant radius retained; Fujita C_w model not testable; index model = candidate only"),
 dict(case="C4 Zhang 2023 vancomycin", Q1_Cw_or_data=P + ": 'swelling rate' of drug-free M only", Q2_same_formulation_medium=N + " (M vs VM)",
      Q3_volume_or_radius_vs_time=N, Q4_network_mass_constant=U, Q5_covers_initial_transient=P + " (M: 15 min resolved)",
      determinable="k (lumped with dialysis membrane)", decision="constant radius; not testable"),
 dict(case="C5 Chang 2023 gentamicin", Q1_Cw_or_data=N, Q2_same_formulation_medium="—", Q3_volume_or_radius_vs_time=N,
      Q4_network_mass_constant=N + " (weight loss of drug-free dM reported)", Q5_covers_initial_transient=N,
      determinable="k, A", decision="constant radius; not testable"),
 dict(case="C6 Hu 2024 gentamicin", Q1_Cw_or_data=N + " (weight change of drug-free m-Em)", Q2_same_formulation_medium=N,
      Q3_volume_or_radius_vs_time=N, Q4_network_mass_constant=N, Q5_covers_initial_transient=N,
      determinable="k, A", decision="constant radius; not testable"),
 dict(case="C7 Lan 2017 bFGF", Q1_Cw_or_data=N, Q2_same_formulation_medium="—", Q3_volume_or_radius_vs_time=N,
      Q4_network_mass_constant=U, Q5_covers_initial_transient=N, determinable="k", decision="constant radius; not testable"),
 dict(case="C8 Liu 2022 icariin", Q1_Cw_or_data=N, Q2_same_formulation_medium="—", Q3_volume_or_radius_vs_time=N,
      Q4_network_mass_constant=U, Q5_covers_initial_transient=N, determinable="k (no reference radius)",
      decision="constant radius; not testable"),
]
pd.DataFrame(rows).to_csv(os.path.join(RES, "stage3_readiness.csv"), index=False)
print(pd.DataFrame(rows).to_string())
