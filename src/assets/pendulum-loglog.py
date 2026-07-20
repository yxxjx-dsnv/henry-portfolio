

# -*- coding: utf-8 -*-
"""
Log(Period) vs Log(Length) graph generator for PHY180 Lab 2
Author: Yeonjun Henry Kim
"""

import fit_black_box as bb
import numpy as np

# load the same data (Length in cm)
filename = "graphs/Log(Period) vs. Log(Length) of Pendulum Graph/data_period_vs_length_henry.txt"
x, y, xerr, yerr = bb.load_data(filename)

# 2. log10 변환
logx = np.log10(x)
logy = np.log10(y)

# 3. 불확실성 log 스케일로 전파
#   d(log10 x) = dx / (x * ln 10)
logx_err = xerr / (x * np.log(10))
logy_err = yerr / (y * np.log(10))

# Define linear model for log–log relationship
def linear_func(logL, n, logk):
    return n * logL + logk

# Initial guess for slope/intercept
init_guess = (0.5, 0.3)

# Labels and title
xlabel = "log₁₀(Length (m))"
ylabel = "log₁₀(Period (s))"
title = "Log(Period) vs Log(Length) of Pendulum Graph"

bb.plot_fit(
    linear_func,
    logx, logy,
    logx_err, logy_err,
    init_guess=init_guess,
    font_size=14,
    xlabel=xlabel,
    ylabel=ylabel,
    title=title
)