"""Appendix figure: digitized points drawn over the original raster figures (linear axes only).
The image is placed with an extent computed from the same tick calibration used in build_dataset.py."""
import glob, os, subprocess, tempfile, sys
import numpy as np, pandas as pd
from PIL import Image
from plotstyle import plt, save

SRC = sys.argv[1] if len(sys.argv) > 1 else "/root/.claude/uploads/a11b49a0-bef8-5992-ab58-10b375fbbd31"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = pd.read_csv(os.path.join(ROOT, "data", "release_dataset_audited.csv"))
TMP = tempfile.mkdtemp()
def pdfimg(prefix, page, tag):
    f = glob.glob(os.path.join(SRC, prefix + "*"))[0]
    subprocess.run(["pdfimages", "-png", "-f", str(page), "-l", str(page), f, os.path.join(TMP, tag)], check=True)
    return sorted(glob.glob(os.path.join(TMP, tag + "-*.png")))
def ext(ax_, bx_, ay_, by_, W, H):          # value = a*px + b
    return [bx_, ax_ * W + bx_, ay_ * H + by_, by_]

panels = []
im = np.asarray(Image.open(pdfimg("9f2934ed", 15, "van")[0]).convert("RGB"))[0:520, 930:1662]
panels.append(("Zhang 2023 Fig.8B", im, ext(0.0212988, -0.4909043, -0.2151163, 104.7079838, im.shape[1], im.shape[0]),
               "C4_Zhang2023_vancomycin", 1 / 24))
im = np.asarray(Image.open(pdfimg("a96845ec", 17, "kod")[2]).convert("RGB"))[:, 1800:2710]
panels.append(("Kodra 2026 Fig.7c", im, ext(0.0414937, -11.4462271, -0.2242826, 140.3043162, im.shape[1], im.shape[0]),
               "C3_Kodra2026_ketoprofen", 1))
im = np.asarray(Image.open(pdfimg("74ef1973", 9, "bfgf")[0]).convert("RGB"))
panels.append(("Lan 2017 Fig.3", im, ext(0.0233067, -4.0871427, -0.1147447, 111.3788333, im.shape[1], im.shape[0]),
               "C7_Lan2017_bFGF", 1 / 24))
im = np.asarray(Image.open(pdfimg("b00acc34", 4, "ica")[0]).convert("RGB"))[0:500, 0:700]
panels.append(("Liu 2022 Fig.1A", im, ext(0.0375304, -4.1767172, -0.2671752, 127.3472156, im.shape[1], im.shape[0]),
               "C8_Liu2022_icariin", 1 / 24))
fig, axs = plt.subplots(2, 2, figsize=(10, 7.4))
for a, (ttl, im, e, case, tconv) in zip(axs.ravel(), panels):
    a.imshow(im, extent=e, aspect="auto", alpha=0.75)
    g = D[(D.case_id == case) & D.y_value.notna()]
    a.plot(g.time_h * tconv, g.y_value, "+", color="#e34948", ms=9, mew=1.4)
    a.set_title(ttl + "  (red + = dataset values)", fontsize=8.5); a.grid(False)
    a.set_xlim(e[0], e[1]); a.set_ylim(e[2], e[3])
save(fig, os.path.join(ROOT, "figures", "FigA1_digitization_QA.png"))
