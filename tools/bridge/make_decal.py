"""Lift the pencil marks off the near web of the real bridge (test-day photo IMG_1642) into
an RGBA decal for build_bridge.py: the "HOLY ✝ BRIDGE" title and the doodles beside it.

  python3 tools/bridge/make_decal.py PHOTO.jpg tools/bridge/decal-web.png

The web face between the A-frame legs is rectified with a quad warp (its top and bottom
edges fitted to the blue band), the ink is whatever is darker than the local paper, and
the result covers X = DECAL_X0..DECAL_X1 mm of the web (from the photo's left leg to its right).
"""
import sys

import numpy as np
from PIL import Image, ImageFilter

DECAL_X0, DECAL_X1 = 90.0, 1160.0  # mm along the span that the strip covers
X0, X1 = 1200, 4200  # photo columns between the legs (5712-wide original)
W, H = 2048, 148  # output, 1070 × 77.5 mm at ~1.9 px/mm


def band_edges(a):
    """Top/bottom lines of the blue web face: the longest blue run per column, fitted."""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    blue = (b > r + 25) & (b > g + 5) & (b > 90) & (r < 140)
    tops, bots = [], []
    for x in range(X0, X1 + 1, 50):
        ys = np.where(blue[1900:2700, x])[0] + 1900
        if len(ys) < 100:
            continue
        runs, s, p = [], ys[0], ys[0]
        for y in ys[1:]:
            if y != p + 1:
                runs.append((s, p))
                s = y
            p = y
        runs.append((s, p))
        s, e = max(runs, key=lambda t: t[1] - t[0])
        if e - s > 170:  # a column the ink does not cut in two
            tops.append((x, s))
            bots.append((x, e))
    fit = lambda pts: np.polyfit([p[0] for p in pts], [p[1] for p in pts], 1)
    return np.poly1d(fit(tops)), np.poly1d(fit(bots))


def main(photo, out):
    im = Image.open(photo).convert("RGB")
    top, bot = band_edges(np.asarray(im).astype(int))
    # PIL QUAD order: upper-left, lower-left, lower-right, upper-right
    quad = [X0, top(X0), X0, bot(X0), X1, bot(X1), X1, top(X1)]
    strip = im.transform((W, H), Image.QUAD, quad, Image.BICUBIC)
    L = np.asarray(strip.convert("L")).astype(float)
    paper = np.asarray(strip.convert("L").filter(ImageFilter.MedianFilter(41))).astype(float)
    ink = np.clip((paper - L - 10) / 30, 0, 1)
    ink[:, :40] = ink[:, -40:] = 0  # the legs' shadows at either end
    ink[:7, :] = ink[118:, :] = 0  # the flange lip above, the bench shadow below
    rgba = np.zeros((H, W, 4), np.uint8)
    rgba[..., :3] = (28, 32, 52)  # pencil, near-black blue
    rgba[..., 3] = (ink * 235).astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(out, optimize=True)
    print(f"{out}: {(ink > 0.3).sum()} ink px, covers X {DECAL_X0:.0f}–{DECAL_X1:.0f} mm")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
