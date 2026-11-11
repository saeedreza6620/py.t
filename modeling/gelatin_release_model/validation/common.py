import os, sys, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import numpy as np, pandas as pd, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 9.5, "axes.spines.top": False, "axes.spines.right": False,
                     "axes.grid": True, "grid.color": "#e3e6ee", "legend.frameon": False})
NAVY, BLUE, ORG, GRN, GREY, PUR, RED = "#0E1B4D", "#2F5CF0", "#EB6834", "#1BAF7A", "#8A8F99", "#8A3FD1", "#C62828"
H, DAY = 3600.0, 86400.0
DATA = os.path.join(ROOT, "data"); RES = os.path.join(ROOT, "results"); FIG = os.path.join(ROOT, "figures")
os.makedirs(RES, exist_ok=True); os.makedirs(FIG, exist_ok=True)

def save(name, obj):
    with open(os.path.join(RES, name + ".json"), "w") as f:
        json.dump(obj, f, indent=1, default=lambda x: float(x) if np.isscalar(x) else list(x))
    return obj

def r(x, n=2):
    return float(np.round(float(x), n))
