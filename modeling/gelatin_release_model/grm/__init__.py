"""grm — Gelatin Release Model (crosslinked gelatin spheres; glutaraldehyde focus)."""
from .model import Liberation, Pool, Particle, release, release_pde
from .correlations import (wilke_chang, lebas, mackie_meares, stokes_einstein, D_cheng, mu_cheng, DRUGS, DAY)
from .analysis import rmse, r2, t_at, elasticities, rate_control_weights
from .fick import release_analytical, release_series, profile_analytical, SphereFVM
__version__ = "1.0.0"
