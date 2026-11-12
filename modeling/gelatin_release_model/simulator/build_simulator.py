"""Builds simulator/grm_simulator.html (single self-contained file, works offline) from the template and the
project data/results. Run after validation/run_all.py:   python simulator/build_simulator.py"""
import os, json, numpy as np, pandas as pd
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
D, R = os.path.join(ROOT, "data"), os.path.join(ROOT, "results")
v1 = json.load(open(os.path.join(R, "v1_cheng2010.json"))); v2 = json.load(open(os.path.join(R, "v2_hu2024_from_chang2023.json")))
v3 = json.load(open(os.path.join(R, "v3_mladenovska2002.json"))); v4 = json.load(open(os.path.join(R, "v4_saravanan2011_negative_control.json")))
c = pd.read_csv(os.path.join(D, "cheng2010_release_vector.csv")); c = c[c.t_day > 0.5]; c["ga"] = c.series.str.extract(r"GA ([0-9.]+)")
cheng = dict(R_um=50, cal={k.split()[1]: v["f_free"] for k, v in v1["calibration"].items()},
             pbs={g: s[["t_day", "release_pct"]].round(3).values.tolist() for g, s in c[c.figure == "2.6A"].groupby("ga")},
             enz={g: s[["t_day", "release_pct", "errbar_half_pct"]].fillna(0).round(3).values.tolist() for g, s in c[c.figure != "2.6A"].groupby("ga")})
g = pd.read_csv(os.path.join(D, "hu2024_mass_remaining.csv"))
hu = dict(t_h=v2["hu_data"]["t_h"], y=v2["hu_data"]["y_pct_of_plateau"], mass_t_day=g.t_day.tolist(), mass_rem=g.mass_remaining_pct.tolist(),
          R_um=8.05, D=v2["hu_data"]["D_cm2s"], f_first=v2["chang_1.0dM-G"]["f_free"], k_weak_h=v2["hu_pred_B_weak_rate_from_chang"]["k_weak_per_h"])
m = pd.read_csv(os.path.join(D, "mladenovska2002_digitized.csv")); ser = {}
for k, s in m.groupby("series"):
    a = s[s.quantity == "BSA_cumulative_release"]; b = s[s.quantity == "blank_sphere_mass_remaining"]
    ser[k] = dict(d=float(s.mean_diameter_um.iloc[0]), t_h=a.t_h.tolist(), y=a.value_pct.tolist(), mt_h=b.t_h.tolist(), rem=b.value_pct.tolist())
mlad = dict(series=ser, tauA_h=v3["per_size"]["A"]["tau_exit_h"], dA=v3["per_size"]["A"]["diameter_um"])
s = pd.read_csv(os.path.join(D, "saravanan2011_fig6_vector.csv")); s = s[s.time_day_raw > 0.5]
sar = dict(Dw=v4["Dw_cm2s"], R={k: v["R_um"] for k, v in v4["cases"].items()},
           pts={f.split()[0]: x[["time_day_raw", "release_pct", "SE_pct_from_caps"]].round(3).values.tolist() for f, x in s.groupby("formulation", sort=False)})
w2 = json.load(open(os.path.join(R, "w2_all_parameters.json")))
LAB = {"A": "A: میکروسفر ۵ تا ۵۰ میکرون، داروی کوچک، بافر", "B": "B: کره متورم بزرگ، نفوذ بسیار کند، آنزیم (نوع Cheng)", "C": "C: سامانه Cheng، فقط متغیرهای طراحی"}
glob = dict(N=int(os.environ.get("GRM_SOBOL_N", 1024)), regimes={k: dict(label=LAB[k], title=LAB[k], ranges=v["ranges"],
            sobol={o: {n: dict(S1=round(x["S1"], 4), ST=round(x["ST"], 4)) for n, x in d.items() if not n.startswith("_")} for o, d in v["sobol"].items()})
            for k, v in w2["regimes"].items()})
data = dict(cheng=cheng, hu=hu, mlad=mlad, sar=sar, global_=None, version="1.1.0")
data["global"] = glob; del data["global_"]
html = open(os.path.join(HERE, "template.html"), encoding="utf-8").read().replace("/*__DATA__*/null", json.dumps(data, separators=(",", ":")))
open(os.path.join(HERE, "grm_simulator.html"), "w", encoding="utf-8").write(html)
print("wrote grm_simulator.html", len(html) // 1024, "kB")
