"""Build the audited stage-2 release dataset (English) with provenance.

Usage:  python build_dataset.py <folder with the original PDFs>
Requires poppler (pdfimages). Every value is traceable to page/figure, method and
an uncertainty estimate. Evidence labels:
  DIRECT_FIGURE_DATA_LABEL  numbers printed in the figure's data table
  VECTOR_EXTRACTED          marker coordinates read from PDF vector drawing operators
  DIGITIZED_AUTO            raster figure; tick-calibrated axes + colour/shape segmentation
  DIGITIZED_VISUAL          raster figure; tick-calibrated gridline overlay read by eye
  DIRECT_PROSE              value printed in the text (used as anchor / cross-check)
"""
import glob, os, subprocess, sys, tempfile, csv, json
import numpy as np
import rasterdig as rd

SRC = sys.argv[1] if len(sys.argv) > 1 else "/root/.claude/uploads/a11b49a0-bef8-5992-ab58-10b375fbbd31"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "data"); QA = os.path.join(OUT, "digitization"); os.makedirs(QA, exist_ok=True)
TMP = tempfile.mkdtemp()


def pdfimg(prefix, page, tag):
    f = glob.glob(os.path.join(SRC, prefix + "*"))[0]
    subprocess.run(["pdfimages", "-png", "-f", str(page), "-l", str(page), f, os.path.join(TMP, tag)], check=True)
    return sorted(glob.glob(os.path.join(TMP, tag + "-*.png")))


rows = []
def add(case, form, t, tunit, y, yunit, evidence, unc, include=True, reason="", note="", err=None):
    th = {"min": t / 60, "h": t, "day": t * 24}[tunit]
    rows.append(dict(case_id=case, formulation=form, time_value=round(t, 4), time_unit=tunit,
                     time_h=round(th, 4), y_value=round(float(y), 4), y_unit=yunit, evidence=evidence,
                     y_uncertainty_digitization=unc, y_reported_error=err, include_in_fit=include,
                     exclusion_reason=reason, note=note))

# ------------------------------------------------------------------ C1 Jin 2023 morphine (printed data row)
t_min = [5, 10, 30, 45, 60, 90, 120, 240, 480, 720, 1440, 2160, 2880, 3600, 4320]
y_mor = [0, 5, 12, 21.5, 25.8, 37.2, 40, 47, 55, 56, 57.1, 57.5, 58.1, 58.5, 59.2]
for t, y in zip(t_min, y_mor):
    add("C1_Jin2023_morphine", "MGM (optimised)", t, "min", y, "% cumulative (paper: Mt/Minf)",
        "DIRECT_FIGURE_DATA_LABEL", 0.05, note="Fig.2 data row, p.7")

# ------------------------------------------------------------------ C2 Saravanan 2011 diclofenac (vector)
with open(os.path.join(QA, "saravanan2011_fig6_vector.csv")) as f:
    for r in csv.DictReader(f):
        t = round(float(r["time_day_raw"]))           # sampling days are integers (0,1,2,3,6,...)
        form = r["formulation"].split()[0]
        if t == 0: continue                             # origin, F(0)=0 by definition
        add("C2_Saravanan2011_diclofenac", form, t, "day", float(r["release_pct"]), "% of loaded drug",
            "VECTOR_EXTRACTED", 0.05, err=r["SE_pct_from_caps"],
            note=f"Fig.6 p.102; raw x={r['time_day_raw']} d; bars = SE (n=6)")

# ------------------------------------------------------------------ C3 Kodra 2026 ketoprofen (Fig.7c)
img = pdfimg("a96845ec", 17, "kod")[2]                 # 2710x813 panel strip
img_k = img
im = rd.load(img, (1800, 0, 2710, 813))
ax, bx, _ = rd.linfit(np.array([275.5, 348.5, 420.5, 492.5, 565.5, 637.5, 709.5, 781.5, 854.5]), np.arange(0, 25, 3.))
ay, by, ry = rd.linfit(np.array([625, 581.5, 536.5, 491.5, 447.5, 402.5, 358.5, 313.5, 268.5, 224.5, 179.5]), np.arange(0, 101, 10.))
from scipy import ndimage as ndi
d = rd.dark(im, 90); m = ndi.binary_opening(d, ndi.generate_binary_structure(2, 1), iterations=4)
lab, n = ndi.label(m)
auto = []
for i in range(1, n + 1):
    ys, xs = np.where(lab == i)
    if 280 < xs.mean() < 880 and 140 < ys.mean() < 640 and len(xs) > 40:
        auto.append((ax * xs.mean() + bx, ay * ys.mean() + by, len(xs), np.ptp(xs) + 1, np.ptp(ys) + 1))
def pick(tt, area_lo, area_hi, side=None):
    c = [a for a in auto if abs(a[0] - tt) < 0.15 and area_lo <= a[2] <= area_hi and a[4] < 25]
    return c
# area classes: squares ~200, triangles/circles ~80-100 (triangle vs circle separated by known prose anchors)
K = {"MS/K-1": {}, "MS/K-2": {}, "MS/K-3": {}}
for tt in [1, 3, 5, 24]:
    sq = pick(tt, 150, 260); sm = sorted(pick(tt, 60, 130), key=lambda a: a[1])
    if sq: K["MS/K-2"][tt] = sq[0][1]
    if tt == 3 or tt == 5:      # small markers: upper = triangle (MS/K-3), lower = circle (MS/K-1)
        K["MS/K-3"][tt], K["MS/K-1"][tt] = sm[-1][1], sm[0][1]
    if tt == 1: K["MS/K-3"][tt] = sm[-1][1]
    if tt == 24: K["MS/K-1"][tt] = sm[0][1]
vis = {("MS/K-1", 0.5): 12.9, ("MS/K-2", 0.5): 10.6, ("MS/K-3", 0.5): 9.0, ("MS/K-1", 1): 17.4}
for form in K:
    for tt in [0.5, 1, 3, 5, 24]:
        if (form, tt) in vis:
            add("C3_Kodra2026_ketoprofen", form, tt, "h", vis[(form, tt)], "% of encapsulated drug (Kr/Ke)",
                "DIGITIZED_VISUAL", 2.0 if tt == 0.5 else 1.5, note="Fig.7c p.17; overlapping markers")
        elif tt in K[form]:
            add("C3_Kodra2026_ketoprofen", form, tt, "h", min(K[form][tt], 100.0), "% of encapsulated drug (Kr/Ke)",
                "DIGITIZED_AUTO", 0.5, note="Fig.7c p.17")
        elif form == "MS/K-3" and tt == 24:
            add("C3_Kodra2026_ketoprofen", form, tt, "h", 100.0, "% of encapsulated drug (Kr/Ke)",
                "DIGITIZED_VISUAL", 2.0, note="marker hidden under MS/K-2 marker; line ends at 100%")
# prose anchors (cross-check, not duplicated in fits)
prose_k = [("MS/K-3", 1, 37.7), ("MS/K-1", 24, 62.1), ("MS/K-2", 5, 84.7)]

# ------------------------------------------------------------------ C4 Zhang 2023 vancomycin (Fig.8B, dialysis bag)
img = pdfimg("9f2934ed", 15, "van")[0]
im = rd.load(img, (930, 0, 1662, 520))
ax, bx, rx = rd.linfit(np.array([70.5, 117, 163.5, 210.5, 305, 398.5, 492.5, 586.5, 680.5]), np.array([1, 2, 3, 4, 6, 8, 10, 12, 14.]))
ay, by, ry = rd.linfit(np.array([487, 440.5, 393.5, 347, 300.5, 254.5, 208, 161.5, 114.5, 68.5, 22]), np.arange(0, 101, 10.))
ts = [0.25, 0.5, 1, 2, 3, 4, 6, 8, 10, 12, 14]
for form, yx in [("pH 7.4", (47, 560)), ("pH 6.0", (88, 560))]:
    pts = rd.series_points(im, im[yx], 60, [(t - bx) / ax for t in ts], win=7, open_r=2, min_area=30)
    for t, p in zip(ts, pts):
        if p is None:
            add("C4_Zhang2023_vancomycin", form, t, "day", np.nan, "% of loaded drug (M0)", "DIGITIZED_AUTO", None,
                include=False, reason="marker occluded by the other series", note="Fig.8B p.4362")
            continue
        add("C4_Zhang2023_vancomycin", form, round(t, 3), "day", ay * p[1] + by, "% of loaded drug (M0)",
            "DIGITIZED_AUTO", 0.4, note=f"Fig.8B; detected x={ax*p[0]+bx:.3f} d")
add("C4_Zhang2023_vancomycin", "pH 6.0", 0.0833, "day", 1.6, "% of loaded drug (M0)", "DIGITIZED_AUTO", 1.0,
    include=False, reason="cluster of 0.5-2 h markers at the axis; times not resolvable",
    note="shows near-zero release in the first hours (lag)")

# ------------------------------------------------------------------ C5 Chang 2023 gentamicin (Fig.5, concentration)
img = pdfimg("b06428c9", 14, "chang")[2]
im = rd.load(img)
ay, by, ry = rd.linfit(np.array([83., 137.5, 192, 246, 300, 354.5, 409, 463.5, 518, 572]), np.arange(10, 0, -1.))
cols = [206, 226.5, 268.5, 352.5, 437.5, 478.5, 560.5, 724.5, 912.5, 1191.5]
tl = [(1, "h"), (2, "h"), (4, "h"), (8, "h"), (1, "day"), (2, "day"), (4, "day"), (8, "day"), (16, "day"), (32, "day")]
for form, rgb, tol in [("0.5dM-G", (240, 185, 205), 50), ("1.0dM-G", (228, 110, 150), 50), ("2.5dM-G", (170, 25, 75), 50)]:
    pts = rd.series_points(im, rgb, tol, cols, win=6, open_r=2, min_area=25)
    for (t, u), p in zip(tl, pts):
        partial = p is not None and p[2] < 60
        if p is None or (form == "0.5dM-G" and (u == "h")):
            add("C5_Chang2023_gentamicin", form, t, u, np.nan if p is None else ay * p[1] + by, "mg/mL (cumulative concentration)",
                "DIGITIZED_AUTO", None, include=False, reason="marker occluded by darker series", note="Fig.5 p.14")
            continue
        add("C5_Chang2023_gentamicin", form, t, u, ay * p[1] + by, "mg/mL (cumulative concentration)",
            "DIGITIZED_AUTO", 0.15 if form == "0.5dM-G" or partial else 0.06, note="Fig.5 p.14")
prose_c = [("0.5dM-G", 32, 4.9), ("1.0dM-G", 32, 4.7), ("2.5dM-G", 32, 7.7)]

# ------------------------------------------------------------------ C6 Hu 2024 gentamicin m-EmG (Fig.5, mass, background)
img = pdfimg("0e339a9d", 10, "hu")[1]
im = rd.load(img)
ay, by, ry = rd.linfit(np.array([1611, 1412, 1214, 1016, 817.5, 618.5, 421, 222.5]), np.arange(0, 0.71, 0.1))
tl = [(1, "h"), (2, "h"), (4, "h"), (8, "h")] + [(d, "day") for d in [1, 2, 4, 8, 12, 16, 20, 24, 28, 32]]
ser = {}
for nm, rgb in [("m-EmG", (47, 85, 150)), ("m-Em", (197, 91, 17))]:
    b = [q for q in rd.blobs(rd.colour_mask(im, rgb, 60), open_r=8, min_area=300) if q["w"] < 80 and q["cx"] > 400]
    ser[nm] = [ay * q["cy"] + by for q in b]
assert len(ser["m-EmG"]) == 14 and len(ser["m-Em"]) == 14, {k: len(v) for k, v in ser.items()}
for (t, u), g, bkg in zip(tl, ser["m-EmG"], ser["m-Em"]):
    add("C6_Hu2024_gentamicin", "m-EmG raw", t, u, g, "mg (cumulative mass)", "DIGITIZED_AUTO", 0.002,
        include=False, reason="raw signal; fit uses background-corrected series", note="Fig.5 p.10")
    add("C6_Hu2024_gentamicin", "m-Em background", t, u, bkg, "mg (cumulative mass)", "DIGITIZED_AUTO", 0.002,
        include=False, reason="drug-free background", note="Fig.5 p.10")
    add("C6_Hu2024_gentamicin", "m-EmG net (raw - background)", t, u, g - bkg, "mg (cumulative mass)", "DIGITIZED_AUTO",
        0.003, note="net = m-EmG - m-Em, as instructed in the paper's text")

# ------------------------------------------------------------------ C7 Lan 2017 bFGF (Fig.3)
img = pdfimg("74ef1973", 9, "bfgf")[0]
im = rd.load(img)
ax, bx, _ = rd.linfit(np.array([175.5, 304, 432.5, 561.5, 690.5, 819.5, 947, 1076.5, 1205, 1334, 1462.5]), np.arange(0, 31, 3.))
ay, by, _ = rd.linfit(np.array([970.5, 796.5, 622, 448, 273.5, 99]), np.arange(0, 101, 20.))
b = [q for q in rd.blobs(rd.colour_mask(im, (10, 30, 230), 90), open_r=3, min_area=150)]
b = [q for q in b if not (19 < ax * q["cx"] + bx < 22 and ay * q["cy"] + by < 35)]     # drop legend marker
for q in b:
    add("C7_Lan2017_bFGF", "B normal GMS", round(ax * q["cx"] + bx, 2), "day", ay * q["cy"] + by,
        "% of encapsulated (fluorescence)", "DIGITIZED_AUTO", 0.3, note="Fig.3 p.9; filled squares")
R, G, B = im[..., 0], im[..., 1], im[..., 2]
ts = [5, 7, 9, 12, 15]
pts = rd.hollow_centres(im, None, None, [(t - bx) / ax for t in ts], win=14, yrange=(20, 968),
                        mask=((R - G) > 20) & ((R - B) > 20), amin=15)
for t, p in zip(ts, pts):
    add("C7_Lan2017_bFGF", "A porous GMS", round(ax * p[0] + bx, 2), "day", ay * p[1] + by,
        "% of encapsulated (fluorescence)", "DIGITIZED_AUTO", 0.3, note="Fig.3; hollow-circle centre")
for t, y in [(0.42, 1.0), (1.0, 2.8), (2.0, 5.1), (3.0, 8.0), (20.0, 62.1), (29.0, 65.7)]:
    add("C7_Lan2017_bFGF", "A porous GMS", t, "day", y, "% of encapsulated (fluorescence)", "DIGITIZED_VISUAL", 1.0,
        note="Fig.3; error bar crosses hollow marker")

# ------------------------------------------------------------------ C8 Liu 2022 icariin GMs (Fig.1A)
img = pdfimg("b00acc34", 4, "ica")[0]
im = rd.load(img, (0, 0, 700, 500))
ax, bx, _ = rd.linfit(np.array([111., 191, 271, 351.5, 431.5, 512, 590, 670.5]), np.arange(0, 22, 3.))
ay, by, _ = rd.linfit(np.array([476.5, 402, 327, 252, 177, 102.5]), np.arange(0, 101, 20.))
ts = [1, 3, 7, 10, 14, 21]
for form, rgb in [("GM-1 0.25 mM", (0, 0, 230)), ("GM-2 0.5 mM", (230, 0, 0))]:
    pts = rd.series_points(im, rgb, 90, [(t - bx) / ax for t in ts], win=10, open_r=4, min_area=40)
    for t, p in zip(ts, pts):
        add("C8_Liu2022_icariin", form, t, "day", ay * p[1] + by, "% of loaded drug", "DIGITIZED_AUTO", 0.6,
            note="Fig.1A p.4")
for form in ["GM-3 1 mM", "GM-4 2 mM"]:
    for t in ts:
        add("C8_Liu2022_icariin", form, t, "day", np.nan, "% of loaded drug", "DIGITIZED_AUTO", None, include=False,
            reason="markers occluded by GM-1/GM-2 markers; not digitized to avoid guessing", note="Fig.1A")


# ------------------------------------------------------------------ C3 swelling (Fig.7a, same formulations, same medium)
im = rd.load(img_k, (0, 0, 950, 813))
ax, bx, _ = rd.linfit(np.array([167.5, 321.5, 474.5, 628.5, 781.5, 935.5]), np.arange(0, 26, 5.))
ay, by, _ = rd.linfit(np.array([629.5, 537.5, 445.5, 353.5, 261.5, 169.5]), np.arange(0, 2001, 400.))
m = ndi.binary_opening(rd.dark(im, 90), ndi.generate_binary_structure(2, 1), iterations=3)
lab, n = ndi.label(m); fb = []
for i in range(1, n + 1):
    ys, xs = np.where(lab == i)
    if 170 < xs.mean() < 940 and 130 < ys.mean() < 625 and len(xs) > 90 and np.ptp(ys) < 25:
        fb.append((ax * xs.mean() + bx, ay * ys.mean() + by, len(xs)))
def near(t, lo, hi, area_lo, area_hi):
    c = [b for b in fb if abs(b[0] - t) < 0.2 and lo < b[1] < hi and area_lo <= b[2] <= area_hi]
    return c[0][1] if c else None
sw = []
def addsw(form, t, y, ev, unc, note):
    sw.append(dict(case_id="C3_Kodra2026_ketoprofen", formulation=form, time_h=t, SD_percent=round(y, 1),
                   definition="SD% = (Wt - Wi)/Wi x 100, Wi = initial dry mass (mass-based, gravimetric)",
                   evidence=ev, uncertainty=unc, note=note))
for form, spec in {"MS/K-1": [(1, 1500, 1800, 90, 140), (3, 1750, 1950, 90, 140), (24, 1700, 1950, 90, 140)],
                   "MS/K-2": [(3, 1600, 1800, 200, 300), (6, 1250, 1450, 180, 260), (24, 380, 520, 180, 260)],
                   "MS/K-3": [(3, 550, 700, 90, 130), (6, 320, 430, 90, 130), (24, 200, 280, 90, 130)]}.items():
    addsw(form, 0, 0.0, "DIGITIZED_AUTO", 10, "origin (dry)")
    for t, lo, hi, a0, a1 in spec:
        addsw(form, t, near(t, lo, hi, a0, a1), "DIGITIZED_AUTO", 25, "Fig.7a p.17; filled marker")
addsw("MS/K-1", 6, 1942, "DIRECT_PROSE", 140, "text: 1942 +/- 140 % (SD); marker hidden under MS-6")
addsw("MS/K-2", 1, 1300, "DIGITIZED_VISUAL", 80, "filled marker hidden under open MS-10 marker")
addsw("MS/K-2", 6.0001, 1345, "DIRECT_PROSE", 116, "text value at 6 h (cross-check of digitized 6 h point)")
addsw("MS/K-3", 1, 930, "DIGITIZED_VISUAL", 50, "filled marker overlapped by open MS-14 marker")
addsw("MS/K-3", 6.0001, 379, "DIRECT_PROSE", 25, "text value at 6 h (cross-check)")
with open(os.path.join(OUT, "swelling_dataset_C3.csv"), "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(sw[0].keys())); w.writeheader(); w.writerows(sorted(sw, key=lambda r: (r["formulation"], r["time_h"])))

# ------------------------------------------------------------------ write
keys = list(rows[0].keys())
with open(os.path.join(OUT, "release_dataset_audited.csv"), "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=keys); w.writeheader(); w.writerows(rows)
cross = []
for case, lst in [("C3_Kodra2026_ketoprofen", prose_k), ("C5_Chang2023_gentamicin", prose_c)]:
    for form, t, yp in lst:
        dig = [r for r in rows if r["case_id"] == case and r["formulation"] == form and abs(r["time_value"] - t) < 1e-6
               and r["include_in_fit"]]
        cross.append(dict(case=case, formulation=form, t=t, prose=yp, digitized=dig[0]["y_value"] if dig else None))
json.dump(cross, open(os.path.join(OUT, "digitization_crosscheck_vs_prose.json"), "w"), indent=1)
print(len(rows), "rows"); print(json.dumps(cross, indent=1))
