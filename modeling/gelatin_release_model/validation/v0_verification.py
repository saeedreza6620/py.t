"""V0 — code verification (is the mathematics solved correctly?). No experimental data.
  a) finite-volume solver vs Crank analytical series: mesh and time-step convergence, mass balance
  b) multi-pool superposition formula (Eq. 1 in grm/model.py) vs the PDE with source term (Eq. 2)"""
from common import *
from grm import *
from grm.model import release_pde
out = {}
# a) mesh convergence on the base Fick problem (dimensionless), surface-graded shells (p = 2), Crank-Nicolson
taus = np.array([0.001, 0.005, 0.0305, 0.1, 0.3]); ex = release_analytical(taus)
mesh = []
for N in (10, 20, 40, 80, 160, 320):
    m = SphereFVM(N, 2.0); res = m.solve(taus, 1e-5, theta=0.5)
    mesh.append(dict(N=N, err_max=float(np.abs(res["F_inv"] - ex).max()), mass_closure=float(np.abs(res["F_inv"] - res["F_flux"]).max()),
                     F=res["F_inv"].tolist()))
for a, b in zip(mesh[:-1], mesh[1:]): a["order"] = float(np.log2(a["err_max"] / b["err_max"]))
out["mesh"] = mesh
step = []
m = SphereFVM(80, 2.0)
for dt in (2e-3, 1e-3, 5e-4, 2.5e-4, 1.25e-4):
    res = m.solve(taus, dt, theta=0.5); step.append(dict(dtau=dt, err_max=float(np.abs(res["F_inv"] - ex).max())))
out["time_step"] = step
# b) superposition vs PDE for three pool structures
cases = {
 "free + enzymatic bound (Cheng-type)": Particle([Pool(0.47, name="free"), Pool(0.53, Liberation("first_order", rate=mu_cheng(0.375)), "bound")],
                                                 50e-4, D_cheng(0.375)),
 "free + weak + measured-mass-loss bound": Particle([Pool(0.5, name="free"), Pool(0.2, Liberation("first_order", rate=1 / (5 * H)), "weak"),
                                                    Pool(0.3, Liberation.from_mass_remaining(np.array([0, 1, 2, 5, 10, 20, 30]) * DAY,
                                                                                             np.array([1, .95, .9, .7, .4, .1, 0])), "bound")], 8e-4, 3e-11),
 "slow diffusion only, f_irr = 0.1": Particle([Pool(0.9, name="free")], 20e-4, 1e-12, f_irr=0.1),
}
sup = {}
fig, axs = plt.subplots(1, 3, figsize=(14, 4))
for ax, (nm, p) in zip(axs, cases.items()):
    tmax = 18 * DAY if "Cheng" in nm else 30 * DAY
    t = np.linspace(0, tmax, 61)[1:]
    a = release(t, p); b = release_pde(t, p, N=160)
    sup[nm] = dict(max_abs_diff_pct=float(100 * np.abs(a - b).max()))
    ax.plot(t / DAY, 100 * a, color=NAVY, lw=2, label="superposition, Eq. (1)"); ax.plot(t[::3] / DAY, 100 * b[::3], "o", color=ORG, ms=4, mfc="white", label="finite-volume PDE, Eq. (2)")
    ax.set_title(f"{nm}\nmax |diff| = {100 * np.abs(a - b).max():.3f} %-points", loc="left", fontsize=8.8); ax.set_xlabel("time (day)"); ax.set_ylabel("released (%)")
axs[0].legend(fontsize=8)
fig.tight_layout(); fig.savefig(os.path.join(FIG, "V0_superposition_vs_pde.png"), dpi=170); plt.close(fig)
out["superposition_vs_pde"] = sup
fig, a = plt.subplots(figsize=(5.4, 4))
a.loglog([x["N"] for x in mesh], [x["err_max"] for x in mesh], "o-", color=NAVY, label="max |F − F_exact|")
a.loglog([10, 320], [7e-3, 7e-3 / 32 ** 2], color=GREY, lw=1, label="slope −2"); a.set_xlabel("radial cells N (surface-graded)"); a.set_ylabel("error (fraction)")
a.legend(); a.set_title("V0: finite-volume solver vs Crank series", loc="left", fontsize=9.5); fig.tight_layout(); fig.savefig(os.path.join(FIG, "V0_mesh.png"), dpi=170); plt.close(fig)
save("v0_verification", out)
print(json.dumps({k: v for k, v in out.items() if k != "mesh"}, indent=1)); print([(x["N"], x["err_max"]) for x in mesh])
