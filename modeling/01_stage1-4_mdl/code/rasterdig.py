"""Helpers for pixel-calibrated digitization of raster release figures.
Calibration uses the drawn tick marks (detected as dark pixel runs next to the
axis lines); marker centres come from colour segmentation + morphological
opening (removes connecting lines and error bars thinner than the marker)."""
import numpy as np
from PIL import Image
from scipy import ndimage as ndi


def load(path, box=None):
    im = np.asarray(Image.open(path).convert("RGB")).astype(float)
    if box is not None:
        x0, y0, x1, y1 = box
        im = im[y0:y1, x0:x1]
    return im


def dark(im, thr=110):
    return im.mean(axis=2) < thr


def axis_lines(im, thr=110, frac=0.5):
    """Return (row of x-axis, col of y-axis): longest dark horizontal / vertical runs."""
    d = dark(im, thr)
    rows = d.sum(axis=1); cols = d.sum(axis=0)
    return int(np.argmax(rows)), int(np.argmax(cols))


def ticks_x(im, row, side=+1, length=(3, 12), thr=110, x_range=None):
    """Columns where a dark tick extends from the x-axis row (side=+1 below)."""
    d = dark(im, thr)
    a, b = length
    seg = d[row + side * a: row + side * b: side] if side > 0 else d[row - b: row - a]
    hits = seg.mean(axis=0) > 0.6
    lab, n = ndi.label(hits)
    cs = ndi.center_of_mass(hits, lab, range(1, n + 1))
    xs = np.array([c[0] for c in cs])
    if x_range: xs = xs[(xs >= x_range[0]) & (xs <= x_range[1])]
    return xs


def ticks_y(im, col, side=-1, length=(3, 12), thr=110, y_range=None):
    d = dark(im, thr)
    a, b = length
    seg = d[:, col - b: col - a] if side < 0 else d[:, col + a: col + b]
    hits = seg.mean(axis=1) > 0.6
    lab, n = ndi.label(hits)
    cs = ndi.center_of_mass(hits, lab, range(1, n + 1))
    ys = np.array([c[0] for c in cs])
    if y_range: ys = ys[(ys >= y_range[0]) & (ys <= y_range[1])]
    return ys


def linfit(px, val):
    A = np.vstack([px, np.ones_like(px)]).T
    (a, b), res, *_ = np.linalg.lstsq(A, val, rcond=None)
    resid = val - (a * px + b)
    return a, b, float(np.max(np.abs(resid))) if len(px) > 2 else 0.0


def colour_mask(im, rgb, tol=60):
    return np.sqrt(((im - np.asarray(rgb, float)) ** 2).sum(axis=2)) < tol


def blobs(mask, open_r=3, min_area=20):
    st = ndi.generate_binary_structure(2, 1)
    m = ndi.binary_opening(mask, structure=st, iterations=open_r)
    lab, n = ndi.label(m)
    out = []
    for i in range(1, n + 1):
        area = int((lab == i).sum())
        if area >= min_area:
            cy, cx = ndi.center_of_mass(m, lab, i)
            ys, xs = np.where(lab == i)
            out.append(dict(cx=cx, cy=cy, area=area, w=int(np.ptp(xs)) + 1, h=int(np.ptp(ys)) + 1))
    return sorted(out, key=lambda b: b["cx"])


def series_points(im, rgb, tol, xcols, win=10, open_r=2, min_area=60):
    """For each expected marker column, return the largest colour blob near it."""
    mask = colour_mask(im, rgb, tol)
    st = ndi.generate_binary_structure(2, 1)
    m = ndi.binary_opening(mask, structure=st, iterations=open_r)
    lab, n = ndi.label(m)
    res = []
    for xc in xcols:
        best = None
        for i in range(1, n + 1):
            ys, xs = np.where(lab == i)
            if abs(xs.mean() - xc) > win: continue
            a = len(xs)
            if a >= min_area and (best is None or a > best[2]):
                best = (xs.mean(), ys.mean(), a, int(np.ptp(ys)) + 1)
        res.append(best)
    return res


def overlay(im, pts, path, colours):
    """Save a QA image with detected centres drawn as crosses."""
    from PIL import ImageDraw
    img = Image.fromarray(im.astype(np.uint8)).convert("RGB")
    dr = ImageDraw.Draw(img)
    for (x, y), col in zip(pts, colours):
        dr.line([x - 9, y, x + 9, y], fill=col, width=1)
        dr.line([x, y - 9, x, y + 9], fill=col, width=1)
    img.save(path)


def hollow_centres(im, rgb, tol, xcols, win=16, yrange=None, amin=25, amax=400, mask=None):
    """Centres of hollow markers: enclosed non-colour holes inside a colour ring,
    searched in a window around each expected column. Returns list of (x, y, area) or None."""
    if mask is None:
        mask = colour_mask(im, rgb, tol)
    mask = ndi.binary_closing(mask, iterations=1)
    res = []
    for xc in xcols:
        x0, x1 = int(xc - win), int(xc + win)
        sub = ~mask[:, x0:x1]
        if yrange: sub[:yrange[0]] = False; sub[yrange[1]:] = False
        lab, n = ndi.label(sub)
        cands = []
        for i in range(1, n + 1):
            ys, xs = np.where(lab == i)
            a = len(xs)
            if amin <= a <= amax and xs.min() > 0 and xs.max() < (x1 - x0 - 1):
                circ = a / (np.pi * ((np.ptp(xs) + 1) / 2) * ((np.ptp(ys) + 1) / 2))
                if circ > 0.6 and 0.6 < (np.ptp(xs) + 1) / (np.ptp(ys) + 1) < 1.6:
                    cands.append((x0 + xs.mean(), ys.mean(), a, abs(x0 + xs.mean() - xc)))
        res.append(min(cands, key=lambda c: c[3])[:3] if cands else None)
    return res
