# From parameters to release shape (design map), 12 Aban 1405
Lumped form: dM/dt = -(pi^2 D/R^2) M + k_off S + r S ; dS/dt = -(k_off + r) S ; r = -g'/g. Difference from full PDE for Kodra inputs: 3e-6.
Groups: tau_des/tau_deg (tau_des = 1/k_off), initial free fraction (burst), non-releasable fraction, diffusion time R^2/(pi^2 D) ~0.1 s (negligible).
Map: desorption share >0.7 desorption-controlled; <0.3 degradation-controlled; between mixed; free fraction >0.5 burst/biphasic.
Placement: K-1 mixed (0.70); K-2 desorption (0.80); K-3 mixed (0.41); Chang both degradation-controlled and biphasic.
t50 model vs data: K-2 4.0 vs 3.4 h; K-3 1.85 vs 1.41; K-1 6.3 vs 15.3 (non-releasable fraction missing). RMSE 10-18 %.
Sensitivity around K-2 (x0.5/x1.5): desorption time t50 -48/+44 %; degradation time -12/+3 %; free fraction ~+-4 %; R, Q 0 %. Crosslinking acts mainly via binding strength.
Simulator artifact (Persian UI): presets Kodra K-1/2/3, Chang 1.0/2.5; design mode crosslink time 0.5-4 h interpolated only inside tested range.
Kodra DOE ladder (kodra_steps.py): 1 Fick 69.8/59.4/49.5 mean 59.5 rejected; 2 +swelling same; 3 +binding 14.1/14.8/31.4 mean 20.1 partial; 4 +degradation 17.7/12.5/12.5 mean 14.2 valid for K-2,K-3; 5 +non-releasable pool 10.3/12.5/12.5 mean 11.7 current.
Design example: at 1 h crosslinking t50 ~2.2 h, 24-h release ~100 % (testable prediction).
Files: 05_gelatin_design/
