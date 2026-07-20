# Period vs. Length of Pendulum Graph (Power-Law Fit)
# Henry Kim - PHY180 Lab 2

import fit_black_box as bb
import numpy as np
import scipy.optimize as opt

# Define power-law function
def power_law(L, k, n):
    return k * L ** n

# Load your experimental data file
filename = "graphs/Period vs. Length of Pendulum Graph/data_period_vs_length_henry.txt"
x, y, xerr, yerr = bb.load_data(filename)

# Fit the data
init_guess = (2.0, 0.5)
popt, pcov = opt.curve_fit(power_law, x, y, sigma=yerr, p0=init_guess, absolute_sigma=True)
puncert = np.sqrt(np.diagonal(pcov))

# --- Print Results Nicely ---
print("\n===== Power-Law Fit Results (T = k * L^n) =====")
print(f"k (coefficient) = {popt[0]:.4f} ± {puncert[0]:.4f}")
print(f"n (exponent)    = {popt[1]:.4f} ± {puncert[1]:.4f}")
print("==============================================\n")

# Plot using fit_black_box formatting
bb.plot_fit(
    power_law,
    x, y, xerr, yerr,
    init_guess=init_guess,
    font_size=14,
    xlabel="Length (m)",
    ylabel="Period (s)",
    title="Period vs. Length of Pendulum Graph"
)