"""Vector extraction of Cheng (2010) dissertation Figs 2.6A, 2.7, 2.8 (release data) from the PDF drawing commands.
Usage: python digitize_cheng2010.py <Cheng_Felice.pdf> <out.csv>
Axis calibration from the tick marks of each plot frame (positions printed by pdfplumber, PDF points)."""
import sys, csv, pdfplumber, numpy as np
PDF, OUT = sys.argv[1], sys.argv[2]
COL = {(0.0, 0.0, 0.0): "black", (1.0, 0.0, 0.0): "red", (0.0, 0.0, 1.0): "blue", (0.0, 0.0, 0.5): "blue"}
# figure: page index, frame (x0, x1, y_top, y_bottom) in PDF pts, data values at those edges, colour -> series label
FIGS = [
 dict(fig="2.6A", page=41, frame=(228.24, 424.44, 97.08, 238.44), xr=(0, 3), yr=(45, 0), medium="PBS, no enzyme",
      series={"black": "GA 0.125 %", "red": "GA 0.375 %", "blue": "GA 0.875 %"}),
 dict(fig="2.7", page=42, frame=(201.72, 411.12, 94.68, 263.64), xr=(0, 20), yr=(110, 0), medium="PBS + collagenase 373 ng/ml",
      series={"black": "GA 0.125 %", "red": "GA 0.375 %", "blue": "GA 0.875 %"}),
 dict(fig="2.8", page=43, frame=(210.6, 420.12, 103.56, 272.52), xr=(0, 20), yr=(110, 0), medium="PBS + collagenase 373 ng/ml",
      series={"black": "GA 0.25 %", "blue": "GA 0.625 %"}),
]
def key(c):
    if c is None: return None
    c = tuple(round(float(v), 1) for v in (c if isinstance(c, (list, tuple)) else [c]))
    return COL.get(c)
pdf = pdfplumber.open(PDF); rows = []
for F in FIGS:
    p = pdf.pages[F["page"]]; x0, x1, yt, yb = F["frame"]
    X = lambda x: F["xr"][0] + (x - x0) / (x1 - x0) * (F["xr"][1] - F["xr"][0])
    Y = lambda y: F["yr"][0] + (y - yt) / (yb - yt) * (F["yr"][1] - F["yr"][0])
    # legend region: words "Exp"/"Model" mark legend rows; markers left of them on the same row are legend glyphs
    leg = [w for w in p.extract_words() if w["text"].startswith("0.") and w["text"].endswith("%") and x0 < w["x0"] < x1 and yt < w["top"] < yb]
    def in_legend(cx, cy):   # legend glyph: just left of a legend label ("0.125%") on the same text row
        return any(abs(cy - (w["top"] + w["bottom"]) / 2) < 5 and 0 < w["x0"] - cx < 30 for w in leg)
    marks = []
    for o in list(p.rects) + list(p.curves):
        if not (4.9 < o["width"] < 11 and 4.5 < o["height"] < 11): continue
        col = key(o.get("non_stroking_color")) or key(o.get("stroking_color"))
        if col not in F["series"]: continue
        cx, cy = (o["x0"] + o["x1"]) / 2, (o["top"] + o["bottom"]) / 2
        if not (x0 - 4 <= cx <= x1 + 4 and yt - 4 <= cy <= yb + 4) or in_legend(cx, cy): continue
        shape = "square" if o in p.rects else ("circle" if abs(o["width"] - o["height"]) < 0.3 else "triangle")
        # triangle centroid lies 1/3 of the height above the base, not at the box centre
        if shape == "triangle": cy = o["top"] + 2 * o["height"] / 3
        marks.append((col, shape, cx, cy))
    # error bars: thin vertical lines whose x is within 0.8 pt of a marker centre
    vl = [l for l in p.lines if abs(l["x1"] - l["x0"]) < 0.05 and 1.0 < (l["bottom"] - l["top"]) < 0.5 * (yb - yt)
          and yt <= l["top"] and l["bottom"] <= yb + 1 and min(abs(l["x0"] - x0), abs(l["x0"] - x1)) > 0.3]
    seen = set()
    for col, shape, cx, cy in sorted(marks, key=lambda m: (m[0], m[2])):
        k = (col, round(cx, 0), round(cy, 0))
        if k in seen: continue          # filled marker drawn twice (fill + outline)
        seen.add(k)
        bars = [l for l in vl if abs(l["x0"] - cx) < 0.8 and (key(l.get("stroking_color")) in (col, "black"))]
        lo = hi = None
        if bars:
            top = min(l["top"] for l in bars); bot = max(l["bottom"] for l in bars)
            if top < cy - 0.5: hi = Y(top)
            if bot > cy + 0.5: lo = Y(bot)
        sd = None
        if hi is not None and lo is not None: sd = (hi - lo) / 2
        elif hi is not None: sd = hi - Y(cy)
        elif lo is not None: sd = Y(cy) - lo
        rows.append(dict(figure=F["fig"], medium=F["medium"], series=F["series"][col], marker=shape, t_day=round(X(cx), 4), release_pct=round(Y(cy), 3),
                         errbar_half_pct=None if sd is None else round(sd, 3), x_pt=round(cx, 2), y_pt=round(cy, 2)))
with open(OUT, "w", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
for r in rows: print(r)
