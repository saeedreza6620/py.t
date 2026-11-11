"""V3 — size effect in an enzymatic medium: Mladenovska et al. 2002 (Int J Pharm 242:247).
BSA in GA-crosslinked gelatin microspheres, six sizes (mean diameter 1.99-7.03 um), collagenase, 37 C.
The paper measured BOTH the release (Fig. 2) and the mass remaining of drug-free spheres of the same six series (Fig. 1).
Model: all BSA is network-bound (a 66 kDa protein cannot diffuse out of an intact GA network: f_free = 0); it is
liberated in proportion to the measured mass loss and leaves through a first-order exit step with time tau_exit.
Fick exit with any plausible D for BSA empties a 3.5 um sphere in seconds (shown below), so the exit is front-controlled.
Calibration: tau_exit on the LARGEST size (A) only. Test: sizes B-F with tau_exit = tau_A * d / d_A (front speed constant).
The scaling exponent 1 is a hypothesis (surface/front control); the free exponent fitted per size is reported as a check."""
from common import *
from grm import *
from scipy.optimize import minimize_scalar
m = pd.read_csv(os.path.join(DATA, "mladenovska2002_digitized.csv"))
diam = m.groupby("series").mean_diameter_um.first().to_dict()
def series(k):
    s = m[m.series == k]; rel = s[s.quantity == "BSA_cumulative_release"]; ms = s[s.quantity == "blank_sphere_mass_remaining"]
    return rel.t_h.values, rel.value_pct.values, ms.t_h.values, ms.value_pct.values / 100
def particle(k, tau_h):
    _, _, tm, g = series(k)
    return Particle([Pool(1.0, Liberation.from_mass_remaining(tm * H, g, normalise=False), "bound")], exit="first_order", tau_exit_s=tau_h * H)
def err(k, tau_h):
    tr, y, _, _ = series(k); p = 100 * release(tr[1:] * H, particle(k, tau_h)); return rmse(p, y[1:])
out = dict(fick_check={}, per_size={})
for k in diam:   # Fick exit, BSA D_w ~ 8e-7 cm2/s even reduced 100x
    R = diam[k] / 2 * 1e-4; out["fick_check"][k] = {"tau_D_s_at_D_8e-9_cm2s": r(R ** 2 / (np.pi ** 2 * 8e-9), 2)}
tauA = minimize_scalar(lambda x: err("A", x), bounds=(0.05, 30), method="bounded").x
free = {}
for k in diam:
    free[k] = minimize_scalar(lambda x: err(k, x), bounds=(0.05, 30), method="bounded").x
    tk = tauA * diam[k] / diam["A"]
    out["per_size"][k] = dict(diameter_um=diam[k], role="calibration" if k == "A" else "prediction", tau_exit_h=r(tk, 3),
                              rmse_pct=r(err(k, tk)), rmse_release_equals_massloss_pct=r(err(k, 1e-4)), tau_free_fit_h=r(free[k], 3))
D = np.array(list(diam.values())); T = np.array([free[k] for k in diam])
out["tau_vs_diameter_exponent_free_fit"] = r(np.polyfit(np.log(D), np.log(T), 1)[0], 3)
out["front_speed_um_per_h"] = r(diam["A"] / 2 / tauA, 3)
out["rmse_predicted_sizes"] = [out["per_size"][k]["rmse_pct"] for k in diam if k != "A"]
save("v3_mladenovska2002", out)
cols = dict(A="#0000FF", B="#008000", C="#FF0000", D="#00BFBF", E="#BF00BF", F="#BFBF00")
fig, axs = plt.subplots(1, 2, figsize=(12.5, 4.3)); tt = np.linspace(0.02, 24, 300)
for k in diam:
    tr, y, tm, g = series(k); o = out["per_size"][k]
    axs[0].plot(tm, 100 * (1 - g), "s--", color=cols[k], ms=3.5, lw=1, label=f"{k}: d = {diam[k]} µm")
    axs[1].plot(tt, 100 * release(tt * H, particle(k, o["tau_exit_h"])), color=cols[k], lw=1.6 if k != "A" else 2.6,
                label=f"{k} ({o['role'][:5]}.) RMSE {o['rmse_pct']:.1f}")
    axs[1].plot(tr, y, "o", color=cols[k], ms=4.5, mfc="white", mew=1.3)
axs[0].set_xlim(0, 72); axs[0].set_ylim(0, 100); axs[0].set_xlabel("time (h)"); axs[0].set_ylabel("mass lost, drug-free spheres (%)")
axs[0].set_title("(a) measured input: degradation of blank spheres (Fig. 1)", loc="left", fontsize=9.5); axs[0].legend(fontsize=8)
axs[1].set_xlim(0, 24); axs[1].set_ylim(0, 100); axs[1].set_xlabel("time (h)"); axs[1].set_ylabel("BSA released (%)"); axs[1].legend(fontsize=7.8, loc="lower right")
axs[1].set_title("(b) release: τ_exit from size A only, scaled with diameter for B–F", loc="left", fontsize=9.5)
fig.tight_layout(); fig.savefig(os.path.join(FIG, "V3_mladenovska2002.png"), dpi=170); plt.close(fig)
print(json.dumps(out, indent=1)[:2500])
