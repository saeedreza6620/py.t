"""Build the two tables a machine-learning layer will train on.

ml/formulations.csv : one row per formulation = design descriptors (inputs X) + identified physical parameters
                      of the mechanistic model (targets Y) + where each target came from.
ml/curves_long.csv  : one row per measured release point (for end-to-end checks of model + ML).

Design principle (see README, "Extending with machine learning"): ML predicts the PHYSICAL PARAMETERS
(f_free, f_weak, k_weak, mu or mass-loss time scale, D, tau_exit, f_irr) from formulation descriptors; the validated
mechanistic model (grm.release) turns them into a curve. ML never predicts raw curves directly.
Unknown values are left empty (NaN) on purpose — never fill them with guesses."""
import os, sys, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0, ROOT)
import numpy as np, pandas as pd
from grm import D_cheng, mu_cheng, DAY
RES, DATA = os.path.join(ROOT, "results"), os.path.join(ROOT, "data")
v1 = json.load(open(os.path.join(RES, "v1_cheng2010.json"))); v2 = json.load(open(os.path.join(RES, "v2_hu2024_from_chang2023.json")))
v3 = json.load(open(os.path.join(RES, "v3_mladenovska2002.json")))
NA = np.nan
base = dict(paper="", doi_or_source="", split_group="", crosslinker="", crosslinker_conc=NA, crosslinker_conc_unit="", crosslink_time_h=NA,
            crosslink_temp_C=NA, crosslink_mode="", crosslink_degree_pct=NA, gelatin_type="", gelatin_IEP=NA, gelatin_bloom=NA, gelatin_conc_pct_w_v=NA,
            particle_fabrication="", R_um=NA, R_basis="", drug="", drug_MW=NA, drug_charge=NA, loading_method="", drug_loading_pct_w_w=NA,
            medium="", enzyme="", enzyme_conc="", ionic_medium="", temperature_C=37.0,
            # ---- targets (physical parameters of grm) and provenance
            f_free=NA, f_weak=NA, k_weak_per_h=NA, mu_per_day=NA, liberation_law="", D_cm2s=NA, tau_exit_h=NA, f_irr=NA,
            target_source="", validation_role="")
rows = []
for ga in (0.125, 0.25, 0.375, 0.625, 0.875):
    t = v1["test"][f"GA {ga}"]
    rows.append(dict(base, paper="Cheng 2010 (PhD, UIUC, Ch. 2)", doi_or_source="dissertation; Figs 2.6A, 2.7, 2.8", split_group="cheng2010",
                     crosslinker="glutaraldehyde", crosslinker_conc=ga, crosslinker_conc_unit="% v/v", crosslink_time_h=24, crosslink_temp_C=4,
                     crosslink_mode="post-crosslinking of dry spheres, pH 5, glycine quench", gelatin_type="basic gelatin (IEP 9.0, Mw 100 kDa, Nitta)",
                     gelatin_IEP=9.0, gelatin_conc_pct_w_v=5, particle_fabrication="electric-field precision particle fabrication (monodisperse)",
                     R_um=50, R_basis="swollen mean diameter 100 um", drug="trypan blue (acidic dye)", drug_MW=872.9, drug_charge=-4,
                     loading_method="absorption of 0.1 % w/v drug solution into dry spheres (5 ul/mg)", medium="PBS pH 7.4",
                     enzyme="collagenase 1A", enzyme_conc="373 ng/ml", ionic_medium="PBS",
                     f_free=t["f_free"], f_weak=0.0, mu_per_day=t["mu_per_day"], liberation_law="first-order enzymatic", D_cm2s=float(D_cheng(ga)), f_irr=0.0,
                     target_source="f_free: calibrated on PBS curve (interpolated in GA for 0.25/0.625); D, mu: published relations (Cheng)",
                     validation_role="held-out prediction" if ga in (0.25, 0.625) else "calibration/consistency"))
kw = v2["hu_pred_B_weak_rate_from_chang"]["k_weak_per_h"]
for form, deg, R in (("1.0dM-G", 55, 21.09 / 2), ("2.5dM-G", 51, 17.36 / 2)):
    rows.append(dict(base, paper="Chang 2023", doi_or_source="10.3390/polym15061504", split_group="chang2023_hu2024", crosslinker="glutaraldehyde",
                     crosslink_mode="post-crosslinking, DAP-modified", crosslink_degree_pct=deg, gelatin_type="type B", R_um=R, R_basis="SEM diameter / 2 (hollow interior)",
                     drug="gentamicin", drug_MW=477.6, drug_charge=5, loading_method="soaking of formed spheres, 24 h", medium="PBS", ionic_medium="PBS",
                     f_free=v2[f"chang_{form}"]["f_free"], k_weak_per_h=kw if form == "1.0dM-G" else NA,
                     liberation_law="measured mass loss (linear regression, Sec. 3.4)", target_source="f_free = first plateau / final value; k_weak from the 1 h point",
                     validation_role="source of transferred parameters"))
rows.append(dict(base, paper="Hu 2024", doi_or_source="10.3390/ma17143578", split_group="chang2023_hu2024", crosslinker="glutaraldehyde", crosslink_time_h=0.5,
                 crosslink_temp_C=5, crosslink_degree_pct=86, gelatin_type="type B", R_um=8.05, R_basis="SEM 16.1 +/- 4.8 um", drug="gentamicin", drug_MW=477.6,
                 drug_charge=5, loading_method="immersion in 10 mg/ml gentamicin, 24 h", medium="deionised water", ionic_medium="none (water)",
                 f_free=0.828, k_weak_per_h=kw, liberation_law="measured mass loss of drug-free spheres (Fig. 3)",
                 target_source="transferred from Chang 2023 (no tuning on Hu)", validation_role="cross-paper prediction"))
for k, o in v3["per_size"].items():
    rows.append(dict(base, paper="Mladenovska 2002", doi_or_source="Int J Pharm 242 (2002) 247", split_group="mladenovska2002", crosslinker="glutaraldehyde",
                     crosslinker_conc=0.05, crosslinker_conc_unit="mg GA / mg gelatin (saturated toluene)", crosslink_time_h=4, crosslink_temp_C=0,
                     R_um=o["diameter_um"] / 2, R_basis=f"series {k}, mean diameter", drug="BSA", drug_MW=66500, drug_charge=NA,
                     loading_method="incorporated before crosslinking", medium="buffer + collagenase", enzyme="collagenase",
                     f_free=0.0, liberation_law="measured mass loss of blank spheres (Fig. 1)", tau_exit_h=o["tau_exit_h"],
                     target_source="tau_exit from size A, scaled with diameter", validation_role=o["role"]))
F = pd.DataFrame(rows); F.to_csv(os.path.join(os.path.dirname(__file__), "formulations.csv"), index=False)
# long table of measured points
L = []
c = pd.read_csv(os.path.join(DATA, "cheng2010_release_vector.csv"))
for _, x in c[c.t_day > 0.5].iterrows():
    L.append(dict(split_group="cheng2010", paper="Cheng 2010", formulation=x.series + (" PBS" if x.figure == "2.6A" else " collagenase"), t_h=x.t_day * 24,
                  release_pct=x.release_pct, err_pct=x.errbar_half_pct, normalisation="% of loaded drug", evidence="VECTOR_EXTRACTED"))
a = pd.read_csv(os.path.join(DATA, "release_dataset_audited.csv"))
for _, x in a[a.include_in_fit == True].iterrows():
    L.append(dict(split_group=x.case_id, paper=x.case_id.split("_")[1], formulation=x.formulation, t_h=x.time_h, release_pct=x.y_value,
                  err_pct=x.y_reported_error, normalisation=x.y_unit, evidence=x.evidence))
m = pd.read_csv(os.path.join(DATA, "mladenovska2002_digitized.csv"))
for _, x in m[(m.quantity == "BSA_cumulative_release") & (m.t_h > 0)].iterrows():
    L.append(dict(split_group="mladenovska2002", paper="Mladenovska 2002", formulation=f"series {x.series}", t_h=x.t_h, release_pct=x.value_pct,
                  err_pct=NA, normalisation="% of loaded BSA", evidence="DIGITIZED_RASTER"))
pd.DataFrame(L).to_csv(os.path.join(os.path.dirname(__file__), "curves_long.csv"), index=False)
print(F[["paper", "crosslinker_conc", "R_um", "drug", "f_free", "k_weak_per_h", "mu_per_day", "tau_exit_h", "validation_role"]].to_string())
print(len(L), "measured points")
