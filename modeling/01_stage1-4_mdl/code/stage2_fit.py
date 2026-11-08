"""Stage 2 — constant-D spherical Fickian model fitted per formulation.
Base:   y = A * F(k t),  F = 1 - 6/pi^2 sum exp(-n^2 pi^2 k t)/n^2,  k = D_app / R_ref^2
Burst:  y = A * [b + (1-b) F(k t)]  (t > 0), b = effective unresolved fast fraction
A = 1 when y is a fraction of a documented initial drug amount; otherwise A is fitted.
The temporal split is fixed BEFORE any model is fitted and saved to results/split.json.
"""
import json, os, math
import numpy as np, pandas as pd
from scipy.optimize import least_squares
from scipy.stats import t as tdist
import fick_core as fc
from cases import CASES
from plotstyle import plt, save, C, MARKERS, INK2

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, "results"); FIG = os.path.join(ROOT, "figures")
D = pd.read_csv(os.path.join(ROOT, "data", "release_dataset_audited.csv"))
D = D[D.include_in_fit == True].copy()

# ------------------------------------------------------------- 1. fixed temporal split (before fitting)
split = {}
for (case, form), g in D.groupby(["case_id", "formulation"]):
    g = g.sort_values("time_h"); n = len(g)
    ntr = max(3, int(math.floor(0.6 * n)))
    if n - ntr < 2: ntr = n - 2
    split[f"{case}|{form}"] = dict(n=n, n_train=ntr, t_split_h=float(g.time_h.iloc[ntr - 1]),
                                   rule="first max(3, floor(0.6 n)) points in time order = training; rest = test")
json.dump(split, open(os.path.join(RES, "split.json"), "w"), indent=1)


# ------------------------------------------------------------- 2. model machinery
def model(theta, t, kind, amp_free):
    k = math.exp(theta[0]); i = 1
    b = 0.0
    if kind == "FB":
        b = 1 / (1 + math.exp(-theta[i])); i += 1
    A = math.exp(theta[i]) if amp_free else 1.0
    F = fc.F_const(t, k)
    y = A * (b + (1 - b) * F)
    return np.where(t > 0, y, 0.0)


def natural(theta, kind, amp_free):
    out = {"k_per_h": math.exp(theta[0])}; i = 1
    if kind == "FB": out["b"] = 1 / (1 + math.exp(-theta[i])); i += 1
    if amp_free: out["A"] = math.exp(theta[i])
    return out


def fit(t, y, kind, amp_free, scale):
    p = 1 + (kind == "FB") + amp_free
    best = None
    for lk in np.linspace(-9, 4, 14):
        th0 = [lk] + ([-1.0] if kind == "FB" else []) + ([math.log(max(y.max(), 1e-6))] if amp_free else [])
        r = least_squares(lambda th: model(th, t, kind, amp_free) - y, th0, method="trf", max_nfev=4000)
        if best is None or r.cost < best.cost: best = r
    th = best.x
    names = list(natural(th, kind, amp_free).keys())
    nat = np.array(list(natural(th, kind, amp_free).values()))
    res = y - model(th, t, kind, amp_free)
    n = len(t); dof = n - p
    out = dict(params=dict(zip(names, nat.tolist())), n=n, p=p, dof=dof, ssr=float(np.sum(res ** 2)))
    # Jacobian in natural parameters (central differences)
    def f_nat(v):
        v = np.array(v, float)
        thv = [math.log(max(v[0], 1e-300))]; j = 1
        if kind == "FB":
            bb = min(max(v[j], 1e-12), 1 - 1e-12); thv.append(math.log(bb / (1 - bb))); j += 1
        if amp_free: thv.append(math.log(max(v[j], 1e-300)))
        return model(np.array(thv), t, kind, amp_free)
    J = np.zeros((n, p))
    for j in range(p):
        h = 1e-6 * max(abs(nat[j]), 1e-12)
        vp, vm = nat.copy(), nat.copy(); vp[j] += h; vm[j] -= h
        if names[j] == "b": vp[j] = min(vp[j], 1 - 1e-12); vm[j] = max(vm[j], 1e-12)
        J[:, j] = (f_nat(vp) - f_nat(vm)) / (vp[j] - vm[j])
    if dof > 0:
        s2 = out["ssr"] / dof
        try:
            cov = s2 * np.linalg.inv(J.T @ J)
            se = np.sqrt(np.clip(np.diag(cov), 0, None))
            corr = cov / np.outer(np.where(se > 0, se, np.nan), np.where(se > 0, se, np.nan))
            tq = tdist.ppf(0.975, dof)
            out["se"] = dict(zip(names, se.tolist()))
            out["ci95"] = {nm: [nat[j] - tq * se[j], nat[j] + tq * se[j]] for j, nm in enumerate(names)}
            out["corr"] = corr.tolist()
            out["cond_JTJ"] = float(np.linalg.cond(J.T @ J))
        except np.linalg.LinAlgError:
            out["se"] = None
    out["aicc"] = (n * math.log(out["ssr"] / n + 1e-300) + 2 * p + (2 * p * (p + 1) / (n - p - 1) if n - p - 1 > 0 else np.inf))
    out["theta"] = th.tolist()
    return out, res


def metrics(res, scale):
    res = np.asarray(res) / scale
    return dict(RMSE=float(np.sqrt(np.mean(res ** 2))), MAE=float(np.mean(np.abs(res))))


def main():
    # ------------------------------------------------------------- 3. run all formulations
    records, curves = [], {}
    for (case, form), g in D.groupby(["case_id", "formulation"]):
        meta = CASES[case]; g = g.sort_values("time_h")
        t = g.time_h.values.astype(float); yraw = g.y_value.values.astype(float)
        pct = "%" in g.y_unit.iloc[0]
        y = yraw / 100 if pct else yraw
        amp_free = meta["amplitude"] == "free"
        disp = 100.0 if pct else 1.0                       # metrics reported in data units (%-points or mg...)
        sp = split[f"{case}|{form}"]; ntr = sp["n_train"]
        unc = g.y_uncertainty_digitization.fillna(0).values / (100 if pct else 1)
        for kind in ["F", "FB"]:
            p = 1 + (kind == "FB") + amp_free
            full, res = fit(t, y, kind, amp_free, 1)
            rec = dict(case=case, formulation=form, model=("A·F" if amp_free else "F") + ("+burst" if kind == "FB" else ""),
                       kind=kind, amp_free=amp_free, n=len(t), p=p, **{f"full_{k}": v for k, v in metrics(res * disp, 1).items()})
            rec.update(params=full["params"], se=full.get("se"), ci95=full.get("ci95"), corr=full.get("corr"),
                       cond=full.get("cond_JTJ"), aicc=full["aicc"])
            # early / late windows (first and last 40 % of points)
            nw = max(1, int(round(0.4 * len(t))))
            rec["early_RMSE"] = metrics(res[:nw] * disp, 1)["RMSE"]; rec["late_RMSE"] = metrics(res[-nw:] * disp, 1)["RMSE"]
            rec["early_window_h"] = [float(t[0]), float(t[nw - 1])]; rec["late_window_h"] = [float(t[-nw]), float(t[-1])]
            # adequacy: |res| within tolerance (3 % of plateau scale or 2x digitisation uncertainty)
            scale = full["params"].get("A", 1.0)
            tol = np.maximum(0.03 * scale, 2 * unc)
            ok = np.abs(res) <= tol
            rec["points_within_tol"] = int(ok.sum())
            first_bad = np.where(~ok)[0]
            rec["fick_adequate_until_h"] = float(t[first_bad[0] - 1]) if len(first_bad) and first_bad[0] > 0 else (float(t[-1]) if not len(first_bad) else None)
            rec["residual_signs"] = "".join("+" if r > 0 else "-" for r in res)
            # temporal test
            if ntr > p:
                tr, _ = fit(t[:ntr], y[:ntr], kind, amp_free, 1)
                pred = model(np.array(tr["theta"]), t, kind, amp_free)
                rec.update(train_params=tr["params"], train_RMSE=metrics((y[:ntr] - pred[:ntr]) * disp, 1)["RMSE"],
                           test_RMSE=metrics((y[ntr:] - pred[ntr:]) * disp, 1)["RMSE"],
                           test_MAE=metrics((y[ntr:] - pred[ntr:]) * disp, 1)["MAE"], test_identifiable=True)
                curves[(case, form, kind, "train")] = tr["theta"]
            else:
                rec.update(test_identifiable=False, test_note=f"n_train={ntr} <= p={p}: not identifiable on training set")
            # D_app
            R, Rsd = meta["R"].get(form, (None, None))
            if R:
                k_s = full["params"]["k_per_h"] / 3600.0
                Dapp = k_s * (R * 1e-4) ** 2
                rel_k = (full["se"]["k_per_h"] / full["params"]["k_per_h"]) if full.get("se") else np.nan
                rel_R = (Rsd / R) if Rsd else 0.20
                rel_D = math.sqrt(rel_k ** 2 + (2 * rel_R) ** 2)
                rec.update(R_um=R, R_rel_unc=rel_R, R_unc_source="reported SD" if Rsd else "assumed 20% (not reported)",
                           Dapp_cm2_s=Dapp, Dapp_rel_unc=rel_D,
                           Dapp_low=Dapp * math.exp(-1.96 * min(rel_D, 50)), Dapp_high=Dapp * math.exp(1.96 * min(rel_D, 50)))
            records.append(rec); curves[(case, form, kind, "full")] = full["theta"]

    R_ = pd.DataFrame(records)
    R_.to_pickle(os.path.join(RES, "stage2_fits.pkl"))
    json.dump(records, open(os.path.join(RES, "stage2_fits.json"), "w"), indent=1, default=lambda o: o.item() if hasattr(o, "item") else str(o))
    cols = ["case", "formulation", "model", "n", "p", "full_RMSE", "full_MAE", "early_RMSE", "late_RMSE", "train_RMSE",
            "test_RMSE", "test_MAE", "aicc", "fick_adequate_until_h", "R_um", "Dapp_cm2_s", "Dapp_low", "Dapp_high"]
    flat = R_[cols].copy()
    flat["k_per_h"] = R_.params.apply(lambda d: d["k_per_h"]); flat["b"] = R_.params.apply(lambda d: d.get("b"))
    flat["A"] = R_.params.apply(lambda d: d.get("A"))
    flat["k_se"] = R_.se.apply(lambda d: d["k_per_h"] if isinstance(d, dict) else None)
    flat["b_se"] = R_.se.apply(lambda d: d.get("b") if isinstance(d, dict) else None)
    flat["A_se"] = R_.se.apply(lambda d: d.get("A") if isinstance(d, dict) else None)
    flat.to_csv(os.path.join(RES, "stage2_fit_table.csv"), index=False)
    pd.to_pickle(curves, os.path.join(RES, "stage2_curves.pkl"))
    print(flat.to_string(max_colwidth=18))


if __name__ == "__main__":
    main()
