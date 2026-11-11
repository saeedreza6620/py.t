"""
grm.correlations — parameter relations used WITHOUT fitting to release curves.

Every function states its source. Units: cm, s, K, cP, cm^3/mol.
"""
import numpy as np

NA, KB = 6.02214076e23, 1.380649e-23
DAY = 86400.0

# --- diffusion in water --------------------------------------------------------------------------------------
def eta_water_cP(T):
    """Viscosity of water, Vogel-type fit (about 1 % for 0-100 C)."""
    return 2.414e-2 * 10 ** (247.8 / (T - 140.0))

def wilke_chang(V_s, T=310.15, phi_B=2.6, M_B=18.015):
    """Wilke & Chang (1955) AIChE J 1:264.  D_w = 7.4e-8 (phi_B M_B)^0.5 T / (eta V_s^0.6)  [cm^2/s]."""
    return 7.4e-8 * np.sqrt(phi_B * M_B) * T / (eta_water_cP(T) * V_s ** 0.6)

LEBAS = dict(C=14.8, H=3.7, O=7.4, O_me=9.1, O_eth=11.0, O_acid=12.0, N_prim=10.5, N_sec=12.0, N_tert=10.8,
             N_dbl=15.6, Cl=24.6, ring6=-15.0, ring5=-11.5)
def lebas(**counts):
    """Le Bas molar volume at the normal boiling point (Poling, Prausnitz, O'Connell 5th ed., Table 11-5)."""
    return sum(LEBAS[k] * v for k, v in counts.items())

def stokes_einstein(r_cm, T=310.15):
    return KB * T / (6 * np.pi * eta_water_cP(T) * 1e-3 * r_cm * 1e-2) * 1e4

# --- diffusion in the gel ------------------------------------------------------------------------------------
def mackie_meares(phi):
    """Mackie & Meares (1955) Proc R Soc A 232:498.  D_gel / D_w = ((1 - phi)/(1 + phi))^2."""
    return ((1 - phi) / (1 + phi)) ** 2

# --- glutaraldehyde-crosslinked basic gelatin, acidic dye, collagenase 373 ng/ml (Cheng 2010, Ch. 2) ---------
def D_cheng(ga_pct):
    """Fig. 2.6B power law, D = 7.5132 [GA]^-0.2281 x 1e-4 um^2/s  (fitted by Cheng on the first 3 days in PBS).
    Valid for 0.125 <= GA <= 0.875 % v/v, R ~ 50 um swollen spheres."""
    return 7.5132 * np.asarray(ga_pct, float) ** -0.2281 * 1e-4 * 1e-8

def mu_cheng(ga_pct, coeff=10.0):
    """Eq. 2.12, mu = 0.36 (1 + c exp(-14.29 C_GA)) per day.
    The dissertation prints c = 0.1, which gives 0.366/0.360/0.360 1/d at 0.125/0.375/0.875 % and contradicts the
    values stated in the caption of Fig. 2.7 (1, 0.38, 0.36). c = 10 reproduces them (0.963/0.377/0.360).
    Returned in 1/s."""
    return 0.36 * (1 + coeff * np.exp(-14.29 * np.asarray(ga_pct, float))) / DAY

# --- drugs used in the validation set (Le Bas counts) --------------------------------------------------------
DRUGS = {
    "diclofenac": dict(V=lebas(C=14, H=11, Cl=2, N_sec=1, O_acid=2, ring6=2), MW=296.1, charge=-1),
    "gentamicin": dict(V=lebas(C=21, H=43, N_prim=3, N_sec=2, O=4, O_eth=3, ring6=3), MW=477.6, charge=+5),
    "ketoprofen": dict(V=lebas(C=16, H=14, O=1, O_acid=2, ring6=2), MW=254.3, charge=-1),
    "morphine": dict(V=lebas(C=17, H=19, N_tert=1, O=2, O_eth=1, ring6=4, ring5=1), MW=285.3, charge=+1),
}
