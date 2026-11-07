#!/usr/bin/env python3
"""羊皮纸晕渲。高程来自公有领域的 Terrarium 瓦片，不使用江山时序的郡界。"""

from __future__ import annotations

import math
import os
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image

import importlib.util

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("basemap", ROOT / "scripts" / "build-basemap.py")
basemap = importlib.util.module_from_spec(spec)
spec.loader.exec_module(basemap)

OUT = ROOT / "public" / "map" / "relief.webp"
CACHE = Path("/tmp/ne/dem")
Z = 7
TILE = 256
LIGHT = np.array([244, 236, 220], dtype=np.float32)
SHADOW = np.array([146, 124, 96], dtype=np.float32)
EARTH_M = 40075016.686
PROXY = os.environ.get("https_proxy", "http://127.0.0.1:7897")


def layout():
    project = basemap.albers()
    box = basemap.BOX
    samples = [project(lon, lat) for lon in (box[0], box[2]) for lat in (box[1], box[3])]
    for lon in range(int(box[0]), int(box[2]) + 1):
        samples.append(project(lon, box[1]))
        samples.append(project(lon, box[3]))
    for lat in range(int(box[1]), int(box[3]) + 1):
        samples.append(project(box[0], lat))
        samples.append(project(box[2], lat))
    xs = [p[0] for p in samples]
    ys = [p[1] for p in samples]
    minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
    span_x, span_y = maxx - minx, maxy - miny
    inner = basemap.W - basemap.PAD * 2
    height = inner * (span_y / span_x) + basemap.PAD * 2
    scale = inner / span_x

    p1 = math.radians(basemap.PHI1)
    p2 = math.radians(basemap.PHI2)
    p0 = math.radians(basemap.PHI0)
    l0 = math.radians(basemap.LAM0)
    n = 0.5 * (math.sin(p1) + math.sin(p2))
    c = math.cos(p1) ** 2 + 2 * n * math.sin(p1)
    rho0 = math.sqrt(c - 2 * n * math.sin(p0)) / n

    def lonlat(sx, sy):
        x = minx + (sx - basemap.PAD) / scale
        y = maxy - (sy - basemap.PAD) / scale
        theta = np.arctan2(x, rho0 - y)
        rho = np.hypot(x, rho0 - y)
        lat = np.degrees(np.arcsin(np.clip((c - (rho * n) ** 2) / (2 * n), -1, 1)))
        lon = np.degrees(l0 + theta / n)
        return lon, lat

    return basemap.W, height, lonlat


def tile_range():
    west, south, east, north = basemap.BOX
    west, south, east, north = west - 1.2, south - 1.2, east + 1.2, north + 1.2
    n = 2**Z

    def xy(lon, lat):
        x = (lon + 180) / 360 * n
        lat = max(-85, min(85, lat))
        y = (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n
        return x, y

    x0, y1 = xy(west, south)
    x1, y0 = xy(east, north)
    return int(x0), int(y0), int(x1), int(y1)


def fetch(tx, ty):
    dest = CACHE / str(Z) / f"{tx}_{ty}.png"
    if dest.exists() and dest.stat().st_size > 1000:
        return dest
    dest.parent.mkdir(parents=True, exist_ok=True)
    url = f"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{Z}/{tx}/{ty}.png"
    proxy = urllib.request.ProxyHandler({"http": PROXY, "https": PROXY})
    opener = urllib.request.build_opener(proxy)
    with opener.open(url, timeout=40) as resp:
        dest.write_bytes(resp.read())
    return dest


def decode(path):
    rgb = np.asarray(Image.open(path).convert("RGB"), dtype=np.float32)
    return rgb[..., 0] * 256 + rgb[..., 1] + rgb[..., 2] / 256 - 32768


def hillshade(elev, zdem, row0):
    rows = row0 + np.arange(elev.shape[0]) + 0.5
    lat = np.degrees(np.arctan(np.sinh(math.pi - 2 * math.pi * rows / (TILE * 2**zdem))))
    px_m = EARTH_M / (TILE * 2**zdem) * np.cos(np.radians(lat))
    zf = 2.4 * 1.45 ** (9 - zdem)
    dzdy, dzdx = np.gradient(elev * zf)
    dzdx = dzdx / px_m[:, None]
    dzdy = dzdy / px_m[:, None]
    slope = np.arctan(np.hypot(dzdx, dzdy))
    aspect = np.arctan2(-dzdx, dzdy)

    def shade(az_deg, alt_deg):
        az, alt = math.radians(az_deg), math.radians(alt_deg)
        return np.sin(alt) * np.cos(slope) + np.cos(alt) * np.sin(slope) * np.cos(az - aspect)

    hs = 0.6 * shade(315, 40) + 0.2 * shade(270, 40) + 0.2 * shade(0, 40)
    t = np.clip(hs / math.sin(math.radians(40)), 0, 1) ** 1.6
    mass = 1 - 0.32 * np.clip(slope / math.radians(40), 0, 1)
    hyp = 1 - 0.16 * np.clip((elev - 400) / 2600, 0, 1)
    rgb = (SHADOW + (LIGHT - SHADOW) * t[..., None]) * (mass * hyp)[..., None]
    return np.clip(rgb, 0, 255).astype(np.uint8), elev


def main():
    x0, y0, x1, y1 = tile_range()
    print(f"tiles z{Z} x {x0}-{x1} y {y0}-{y1} count {(x1 - x0 + 1) * (y1 - y0 + 1)}")
    elev = np.zeros(((y1 - y0 + 1) * TILE, (x1 - x0 + 1) * TILE), dtype=np.float32)
    for ty in range(y0, y1 + 1):
        for tx in range(x0, x1 + 1):
            arr = decode(fetch(tx, ty))
            r, c = (ty - y0) * TILE, (tx - x0) * TILE
            elev[r : r + TILE, c : c + TILE] = arr
    shaded, elev = hillshade(elev, Z, y0 * TILE)
    view_w, view_h, lonlat = layout()
    scale = 2
    out_w, out_h = int(view_w * scale), int(round(view_h * scale))
    ys, xs = np.mgrid[0:out_h, 0:out_w]
    lon, lat = lonlat(xs / scale, ys / scale)
    n = TILE * 2**Z
    mx = (lon + 180) / 360 * n - x0 * TILE
    lat_c = np.clip(lat, -85, 85)
    my = (1 - np.log(np.tan(np.radians(lat_c)) + 1 / np.cos(np.radians(lat_c))) / math.pi) / 2 * n - y0 * TILE
    xi = np.clip(mx, 0, shaded.shape[1] - 1.001)
    yi = np.clip(my, 0, shaded.shape[0] - 1.001)
    x0i, y0i = np.floor(xi).astype(int), np.floor(yi).astype(int)
    fx, fy = xi - x0i, yi - y0i
    sample = (
        shaded[y0i, x0i] * (1 - fx)[..., None] * (1 - fy)[..., None]
        + shaded[y0i, x0i + 1] * fx[..., None] * (1 - fy)[..., None]
        + shaded[y0i + 1, x0i] * (1 - fx)[..., None] * fy[..., None]
        + shaded[y0i + 1, x0i + 1] * fx[..., None] * fy[..., None]
    )
    e00 = elev[y0i, x0i]
    sea = e00 <= 0
    rgba = np.dstack(
        [np.clip(sample, 0, 255).astype(np.uint8), np.where(sea, 0, 255).astype(np.uint8)]
    )
    OUT.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgba, "RGBA").save(OUT, "WEBP", quality=82, method=6)
    print(f"wrote {OUT} {out_w}x{out_h} {OUT.stat().st_size}")


if __name__ == "__main__":
    main()
