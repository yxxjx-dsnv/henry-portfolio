'''import scipy.optimize as optimize
import numpy as np
import matplotlib.pyplot as plt
from pylab import loadtxt

def load_data(filename):
    return loadtxt(filename, usecols=(0,1,2,3), skiprows=1, unpack=True)

# 우리가 맞출 함수: 살짝 위로 휘는 2차식
def quad(L, a, b, c):
    return a*L**2 + b*L + c

filename = "graphs/Q Factor vs. Length of Pendulum Graph/data_q_factor_vs_length_henry.txt"
x, y, xerr, yerr = load_data(filename)

plt.rcParams.update({'font.size': 14})
plt.rcParams['figure.figsize'] = 10, 9

popt, pcov = optimize.curve_fit(quad, x, y, sigma=yerr, p0=(3000, -100, 100), absolute_sigma=True)
perr = np.sqrt(np.diag(pcov))

print("Q(L) = aL^2 + bL + c")
print(f"a = {popt[0]:.2e} ± {perr[0]:.2e}")
print(f"b = {popt[1]:.2f} ± {perr[1]:.2f}")
print(f"c = {popt[2]:.2f} ± {perr[2]:.2f}")

xs = np.linspace(min(x), max(x), 500)
curve = quad(xs, *popt)

fig, (ax1, ax2) = plt.subplots(2, 1, gridspec_kw={'height_ratios':[2,1]})

ax1.errorbar(x, y, yerr=yerr, xerr=xerr, fmt='.', color='black', label='data')
ax1.plot(xs, curve, color='black', label='best fit')
ax1.set_xlabel("Length (m)")
ax1.set_ylabel("Q factor")
ax1.set_title("Q Factor vs. Length of Pendulum")
ax1.legend(loc='lower right')

resid = y - quad(x, *popt)
ax2.errorbar(x, resid, yerr=yerr, xerr=xerr, fmt='.', color='black')
ax2.axhline(0, color='black')
ax2.set_xlabel("Length (m)")
ax2.set_ylabel("Residuals")

fig.tight_layout()
plt.show()'''


# -*- coding: utf-8 -*-
"""
Q Factor vs. Length (Linear Fit)
"""

import scipy.optimize as optimize
import numpy as np
import matplotlib.pyplot as plt
from pylab import loadtxt

def load_data(filename):
    return loadtxt(filename, usecols=(0,1,2,3), skiprows=1, unpack=True)

# 1차식 정의
def linear(L, a, b):
    return a*L + b

# 데이터 불러오기
filename = "graphs/Q Factor vs. Length of Pendulum Graph/data_q_factor_vs_length_henry.txt"
x, y, xerr, yerr = load_data(filename)

plt.rcParams.update({'font.size': 14})
plt.rcParams['figure.figsize'] = 10, 9

# 피팅 수행
popt, pcov = optimize.curve_fit(linear, x, y, sigma=yerr, p0=(2000, 100), absolute_sigma=True)
perr = np.sqrt(np.diag(pcov))

print("Q(L) = aL + b")
print(f"a (slope) = {popt[0]:.2f} ± {perr[0]:.2f}")
print(f"b (intercept) = {popt[1]:.2f} ± {perr[1]:.2f}")

# 베스트 핏 곡선
xs = np.linspace(min(x), max(x), 500)
curve = linear(xs, *popt)

# 그래프 구성
fig, (ax1, ax2) = plt.subplots(2, 1, gridspec_kw={'height_ratios':[2,1]})
ax1.errorbar(x, y, yerr=yerr, xerr=xerr, fmt='.', color='black', label='data')
ax1.plot(xs, curve, color='black', label='best fit')
ax1.set_xlabel("Length (m)")
ax1.set_ylabel("Q factor")
ax1.set_title("Q Factor vs. Length of Pendulum")
ax1.legend(loc='lower right')

# 잔차 그래프
resid = y - linear(x, *popt)
ax2.errorbar(x, resid, yerr=yerr, xerr=xerr, fmt='.', color='black')
ax2.axhline(0, color='black')
ax2.set_xlabel("Length (m)")
ax2.set_ylabel("Residuals")

fig.tight_layout()
plt.show()