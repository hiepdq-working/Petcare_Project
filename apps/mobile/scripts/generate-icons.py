#!/usr/bin/env python3
"""Regenerates the PetCare app icons and splash image (white paw on brand teal).

Run from apps/mobile:  python3 scripts/generate-icons.py
Needs Pillow (pip install pillow). Output goes to assets/.
"""
import math
from pathlib import Path

from PIL import Image, ImageDraw

TEAL = (31, 107, 83, 255)  # #1f6b53 — brand-700
WHITE = (255, 255, 255, 255)
SUPERSAMPLE = 4  # draw big, shrink for smooth edges
ASSETS = Path(__file__).resolve().parent.parent / "assets"

# Paw layout on a unit square: (cx, cy, rx, ry, rotation in degrees).
PAW = [
    (0.50, 0.64, 0.205, 0.165, 0),     # main pad
    (0.255, 0.45, 0.075, 0.105, -28),  # toes, left to right
    (0.405, 0.30, 0.078, 0.112, -9),
    (0.595, 0.30, 0.078, 0.112, 9),
    (0.745, 0.45, 0.075, 0.105, 28),
]


def ellipse_points(cx, cy, rx, ry, angle, steps=96):
    a = math.radians(angle)
    pts = []
    for i in range(steps):
        t = 2 * math.pi * i / steps
        x, y = rx * math.cos(t), ry * math.sin(t)
        pts.append((cx + x * math.cos(a) - y * math.sin(a), cy + x * math.sin(a) + y * math.cos(a)))
    return pts


def draw_paw(draw, size, scale, fill):
    """Paw occupying `scale` of the canvas, centered."""
    offset = size * (1 - scale) / 2
    for cx, cy, rx, ry, angle in PAW:
        pts = ellipse_points(cx * size * scale + offset, cy * size * scale + offset, rx * size * scale, ry * size * scale, angle)
        draw.polygon(pts, fill=fill)


def render(path, size, scale, paw_color, background=None, rounded=0):
    big = size * SUPERSAMPLE
    image = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    if background:
        if rounded:
            draw.rounded_rectangle((0, 0, big - 1, big - 1), radius=int(big * rounded), fill=background)
        else:
            draw.rectangle((0, 0, big, big), fill=background)
    draw_paw(draw, big, scale, paw_color)
    final = image.resize((size, size), Image.LANCZOS)
    if background and not rounded:
        final = final.convert("RGB")  # the App Store rejects icons with an alpha channel
    final.save(path)
    print("wrote", path.relative_to(ASSETS.parent))


render(ASSETS / "icon.png", 1024, 0.78, WHITE, background=TEAL)  # iOS/store icon: full square, OS rounds it
render(ASSETS / "android-icon-background.png", 1024, 0.0, TEAL, background=TEAL)  # solid brand color
render(ASSETS / "android-icon-foreground.png", 1024, 0.60, WHITE)  # kept inside the adaptive-icon safe zone
render(ASSETS / "android-icon-monochrome.png", 1024, 0.60, WHITE)  # themed icons tint this layer
render(ASSETS / "splash-icon.png", 1024, 0.72, WHITE)  # shown on the teal splash background
render(ASSETS / "favicon.png", 64, 0.74, WHITE, background=TEAL, rounded=0.2)
