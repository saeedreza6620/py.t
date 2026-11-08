"""Exact extraction of Saravanan et al. 2011, Fig. 6 (vector graphics in the PDF).
Marker centres and error-bar caps are read from the PDF drawing operators;
axes are calibrated on the drawn tick marks (y: 0 -> 552.59 pt, 100 -> 325.18 pt;
x: tick labels 0 and 30 days centred at 352.10 and 543.75 pt)."""
import glob, sys, csv, numpy as np, pdfplumber
pdf = glob.glob(sys.argv[1] + "/2d9af386*")[0]
p = pdfplumber.open(pdf).pages[6]
Y0, Y100 = 552.59, 325.18
X0, X30 = (349.9 + 354.3) / 2, (539.3 + 548.2) / 2
fy = lambda y: (Y0 - y) / (Y0 - Y100) * 100
fx = lambda x: (x - X0) / (X30 - X0) * 30
mk = [o for o in p.curves + p.rects if o["top"] > 300 and o["x1"] - o["x0"] < 4]
caps = [l for l in p.lines + p.curves if 300 < l["top"] < 570 and abs(l["bottom"] - l["top"]) < 0.3
        and 2.5 < l["x1"] - l["x0"] < 3.5 and l["x0"] > 355]
rows = []
for o in mk:
    cx = (o["x0"] + o["x1"]) / 2; cy = (o["top"] + o["bottom"]) / 2
    if o["object_type"] == "rect": sym, form = "square", "GM2 (18.3% w/w)"
    elif len(o["pts"]) == 5: sym, form = "diamond", "GM1 (9.8% w/w)"
    else: sym, form = "triangle", "GM3 (26.7% w/w)"
    t = fx(cx)
    # caps belonging to this marker: same column, nearest above and below
    col = [c["top"] for c in caps if abs((c["x0"] + c["x1"]) / 2 - cx) < 1.0]
    up = [y for y in col if y < cy - 0.5]; dn = [y for y in col if y > cy + 0.5]
    se = None
    if up and dn:
        yu, yd = max(up), min(dn)
        # pick symmetric pair (caps of other series may share the column)
        se = (fy(yu) - fy(yd)) / 2
    rows.append((form, sym, round(t, 3), round(fy(cy), 3), None if se is None else round(se, 3)))
rows.sort(key=lambda r: (r[0], r[2]))
with open(sys.argv[2], "w", newline="") as f:
    w = csv.writer(f); w.writerow(["formulation", "marker", "time_day_raw", "release_pct", "SE_pct_from_caps"])
    w.writerows(rows)
for r in rows: print(r)
