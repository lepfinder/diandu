#!/usr/bin/env python3
"""裁 Natural Earth 公有领域岸线与河网，投影成形势图底图。

不读取任何郡界或历史政区多边形。势力只是十一座城的示意色块。
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = Path("/tmp/ne")
OUT = ROOT / "data" / "basemap.json"

# 益州、河北、江东、岭南都要落在画框里，西边停在盆地边缘。
BOX = (101.6, 26.55, 122.55, 40.6)  # 成都到建业，蓟南到长沙，画幅偏横
W = 1000.0
PAD = 28.0

# 中国区域常用的亚尔勃斯投影，两条标准纬线夹住这幅图。
PHI1 = 25.0
PHI2 = 40.0
PHI0 = 33.0
LAM0 = 111.0


def load(name: str) -> dict:
    with (SRC / name).open() as f:
        return json.load(f)


def ring_bbox(ring: list) -> tuple[float, float, float, float]:
    xs = [p[0] for p in ring]
    ys = [p[1] for p in ring]
    return min(xs), min(ys), max(xs), max(ys)


def bbox_hit(a, b) -> bool:
    return not (a[2] < b[0] or a[0] > b[2] or a[3] < b[1] or a[1] > b[3])


def clip_ring(ring: list, box: tuple[float, float, float, float]) -> list:
    """Sutherland–Hodgman。环不必闭合。"""
    xmin, ymin, xmax, ymax = box

    def clip(points, inside, cross):
        if not points:
            return []
        out = []
        prev = points[-1]
        prev_in = inside(prev)
        for cur in points:
            cur_in = inside(cur)
            if cur_in:
                if not prev_in:
                    out.append(cross(prev, cur))
                out.append(cur)
            elif prev_in:
                out.append(cross(prev, cur))
            prev, prev_in = cur, cur_in
        return out

    def vcross(x):
        def cross(a, b):
            dx = b[0] - a[0]
            t = 0 if dx == 0 else (x - a[0]) / dx
            return [x, a[1] + t * (b[1] - a[1])]

        return cross

    def hcross(y):
        def cross(a, b):
            dy = b[1] - a[1]
            t = 0 if dy == 0 else (y - a[1]) / dy
            return [a[0] + t * (b[0] - a[0]), y]

        return cross

    ring = [[p[0], p[1]] for p in ring]
    ring = clip(ring, lambda p: p[0] >= xmin, vcross(xmin))
    ring = clip(ring, lambda p: p[0] <= xmax, vcross(xmax))
    ring = clip(ring, lambda p: p[1] >= ymin, hcross(ymin))
    ring = clip(ring, lambda p: p[1] <= ymax, hcross(ymax))
    return ring


def clip_line(points: list, box: tuple[float, float, float, float]) -> list:
    xmin, ymin, xmax, ymax = box

    def clip_seg(a, b):
        x0, y0 = a
        x1, y1 = b
        dx, dy = x1 - x0, y1 - y0
        t0, t1 = 0.0, 1.0
        checks = (
            (-dx, x0 - xmin),
            (dx, xmax - x0),
            (-dy, y0 - ymin),
            (dy, ymax - y0),
        )
        for p, q in checks:
            if p == 0:
                if q < 0:
                    return None
                continue
            t = q / p
            if p < 0:
                if t > t1:
                    return None
                if t > t0:
                    t0 = t
            else:
                if t < t0:
                    return None
                if t < t1:
                    t1 = t
        return (
            [x0 + t0 * dx, y0 + t0 * dy],
            [x0 + t1 * dx, y0 + t1 * dy],
        )

    parts = []
    cur = []
    for i in range(len(points) - 1):
        seg = clip_seg(points[i], points[i + 1])
        if seg is None:
            if len(cur) >= 2:
                parts.append(cur)
            cur = []
            continue
        if not cur:
            cur = [seg[0], seg[1]]
        elif abs(cur[-1][0] - seg[0][0]) < 1e-8 and abs(cur[-1][1] - seg[0][1]) < 1e-8:
            cur.append(seg[1])
        else:
            if len(cur) >= 2:
                parts.append(cur)
            cur = [seg[0], seg[1]]
    if len(cur) >= 2:
        parts.append(cur)
    return parts


def dist2(a, b) -> float:
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2


def douglas(points: list, eps: float) -> list:
    if len(points) < 3:
        return points
    eps2 = eps * eps

    def keep(start, end, out):
        ax, ay = points[start]
        bx, by = points[end]
        dx, dy = bx - ax, by - ay
        denom = dx * dx + dy * dy
        worst = -1.0
        idx = -1
        for i in range(start + 1, end):
            px, py = points[i]
            if denom == 0:
                d = dist2(points[i], points[start])
            else:
                t = ((px - ax) * dx + (py - ay) * dy) / denom
                t = 0 if t < 0 else 1 if t > 1 else t
                qx, qy = ax + t * dx, ay + t * dy
                d = (px - qx) ** 2 + (py - qy) ** 2
            if d > worst:
                worst = d
                idx = i
        if worst > eps2 and idx != -1:
            keep(start, idx, out)
            keep(idx, end, out)
        else:
            out.append(end)

    out_idx = [0]
    keep(0, len(points) - 1, out_idx)
    return [points[i] for i in out_idx]


def area(ring: list) -> float:
    s = 0.0
    for i in range(len(ring)):
        x1, y1 = ring[i]
        x2, y2 = ring[(i + 1) % len(ring)]
        s += x1 * y2 - x2 * y1
    return abs(s) * 0.5


def walk(coords, fn):
    if isinstance(coords[0], (int, float)):
        fn(coords)
        return
    for c in coords:
        walk(c, fn)


def albers():
    import math

    p1 = math.radians(PHI1)
    p2 = math.radians(PHI2)
    p0 = math.radians(PHI0)
    l0 = math.radians(LAM0)
    n = 0.5 * (math.sin(p1) + math.sin(p2))
    c = math.cos(p1) ** 2 + 2 * n * math.sin(p1)
    rho0 = math.sqrt(c - 2 * n * math.sin(p0)) / n

    def project(lon, lat):
        rho = math.sqrt(c - 2 * n * math.sin(math.radians(lat))) / n
        theta = n * (math.radians(lon) - l0)
        x = rho * math.sin(theta)
        y = rho0 - rho * math.cos(theta)
        return x, y

    return project


def fit(project):
    samples = []
    for lon in (BOX[0], BOX[2]):
        for lat in (BOX[1], BOX[3]):
            samples.append(project(lon, lat))
    for lon in range(int(BOX[0]), int(BOX[2]) + 1):
        samples.append(project(lon, BOX[1]))
        samples.append(project(lon, BOX[3]))
    for lat in range(int(BOX[1]), int(BOX[3]) + 1):
        samples.append(project(BOX[0], lat))
        samples.append(project(BOX[2], lat))
    xs = [p[0] for p in samples]
    ys = [p[1] for p in samples]
    minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
    span_x = maxx - minx
    span_y = maxy - miny
    inner_w = W - PAD * 2
    height = inner_w * (span_y / span_x) + PAD * 2
    scale = inner_w / span_x

    def xy(lon, lat):
        x, y = project(lon, lat)
        return (PAD + (x - minx) * scale, PAD + (maxy - y) * scale)

    return xy, W, height


def path_of(rings: list, xy, close=True) -> str:
    chunks = []
    for ring in rings:
        if len(ring) < 2:
            continue
        pts = [xy(p[0], p[1]) for p in ring]
        cmd = [f"M{pts[0][0]:.1f} {pts[0][1]:.1f}"]
        cmd.extend(f"L{x:.1f} {y:.1f}" for x, y in pts[1:])
        if close:
            cmd.append("Z")
        chunks.append("".join(cmd))
    return "".join(chunks)


def dedupe(pts: list, tol=1e-4) -> list:
    out = []
    for p in pts:
        if not out or abs(out[-1][0] - p[0]) > tol or abs(out[-1][1] - p[1]) > tol:
            out.append(p)
    return out


def stitch(parts: list) -> list:
    """按端点相接，拼成一条从西到东的线。"""
    remaining = [dedupe([[p[0], p[1]] for p in part]) for part in parts if len(part) > 1]
    if not remaining:
        return []
    line = remaining.pop(0)
    while remaining:
        end = line[-1]
        start = line[0]
        best_i = -1
        best_d = 1e9
        mode = ""
        for i, part in enumerate(remaining):
            for flag, pt in (("tail-head", part[0]), ("tail-tail", part[-1]), ("head-head", part[0]), ("head-tail", part[-1])):
                anchor = end if flag.startswith("tail") else start
                d = dist2(anchor, pt)
                if d < best_d:
                    best_d = d
                    best_i = i
                    mode = flag
        part = remaining.pop(best_i)
        if mode == "tail-head":
            line.extend(part[1:])
        elif mode == "tail-tail":
            line.extend(reversed(part[:-1]))
        elif mode == "head-tail":
            line = part[:-1] + line
        else:
            line = list(reversed(part))[1:] + line
    if line[0][0] > line[-1][0]:
        line.reverse()
    return line


def slice_lon(pts: list, lon0: float, lon1: float) -> list:
    """线已大致自西向东。取出经度落在区间内的那一段。"""
    cut = []
    for i in range(len(pts) - 1):
        a, b = pts[i], pts[i + 1]
        lo, hi = (a, b) if a[0] <= b[0] else (b, a)
        if hi[0] < lon0 or lo[0] > lon1:
            continue
        seg = [a, b]
        # 只收集中点落在区间里的段，避免回头弯被整段丢光
        mid = (a[0] + b[0]) / 2
        if lon0 - 0.15 <= mid <= lon1 + 0.15:
            if cut and dist2(cut[-1], seg[0]) < 1e-8:
                cut.append(seg[1])
            elif cut and dist2(cut[-1], seg[1]) < dist2(cut[-1], seg[0]):
                cut.append(seg[0])
            else:
                if cut and dist2(cut[-1], seg[0]) > 0.2:
                    # 跳过断开的另一支
                    continue
                cut.extend(seg if not cut else seg[1:])
    # 收成单调：从第一个进入 lon0 的点到离开 lon1 的点
    inside = [p for p in dedupe(cut) if lon0 - 0.05 <= p[0] <= lon1 + 0.05]
    return inside


def river_width(rank: float) -> float:
    if rank <= 2:
        return 2.15
    if rank <= 4:
        return 1.25
    if rank <= 6:
        return 0.78
    if rank <= 7:
        return 0.55
    return 0.4


def collect_rivers():
    data = load("ne_10m_rivers.json")
    yang_parts = []
    huang_parts = []
    drawn = []
    for ft in data["features"]:
        geom = ft.get("geometry")
        if not geom:
            continue
        rank = ft["properties"].get("scalerank") or 99
        if rank > 8:
            continue
        name = ft["properties"].get("name") or ""
        lines = geom["coordinates"]
        if geom["type"] == "LineString":
            lines = [lines]
        if name in ("Yangtze", "Chang Jiang"):
            yang_parts.extend(line for line in lines if len(line) >= 10)
        if name == "Huang":
            huang_parts.extend(line for line in lines if len(line) >= 10)
        if name == "Jinsha":
            continue  # 金沙江在画框西缘，并进长江会把线拖出盆地
        for line in lines:
            pts = [[p[0], p[1]] for p in line]
            for part in clip_line(pts, BOX):
                part = douglas(part, 0.02 if rank <= 4 else 0.028)
                if len(part) >= 2:
                    drawn.append((river_width(rank), part))
    yang = stitch(yang_parts)
    huang = stitch(huang_parts)
    return drawn, yang, huang


def collect_lakes():
    data = load("ne_10m_lakes.json")
    lakes = []
    for ft in data["features"]:
        geom = ft.get("geometry")
        if not geom:
            continue
        rank = ft["properties"].get("scalerank") or 99
        if rank > 7:
            continue
        name = ft["properties"].get("name") or ""
        if "Reservoir" in name or name in ("Qinghai Hu",):
            continue
        polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
        for poly in polys:
            rings = []
            for ring in poly:
                pts = [[p[0], p[1]] for p in ring]
                if not bbox_hit(ring_bbox(pts), BOX):
                    continue
                clipped = clip_ring(pts, BOX)
                clipped = douglas(clipped, 0.02)
                if len(clipped) >= 3 and area(clipped) >= 0.004:
                    rings.append(clipped)
            if rings:
                lakes.append(rings)
    return lakes


def collect_land():
    data = load("ne_10m_land.json")
    kept = []
    for ft in data["features"]:
        geom = ft.get("geometry")
        if not geom:
            continue
        polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
        for poly in polys:
            outer = [[p[0], p[1]] for p in poly[0]]
            if not bbox_hit(ring_bbox(outer), BOX):
                continue
            clipped = clip_ring(outer, BOX)
            clipped = douglas(dedupe(clipped), 0.012)
            if len(clipped) < 4 or area(clipped) < 0.01:
                continue
            holes = []
            for hole in poly[1:]:
                pts = [[p[0], p[1]] for p in hole]
                if not bbox_hit(ring_bbox(pts), BOX):
                    continue
                h = douglas(dedupe(clip_ring(pts, BOX)), 0.012)
                if len(h) >= 4 and area(h) >= 0.01:
                    holes.append(h)
            kept.append([clipped, *holes])
    return kept


def point_in(ring: list, lon: float, lat: float) -> bool:
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        yi, yj = ring[i][1], ring[j][1]
        xi, xj = ring[i][0], ring[j][0]
        if ((yi > lat) != (yj > lat)) and (lon < (xj - xi) * (lat - yi) / (yj - yi + 1e-15) + xi):
            inside = not inside
        j = i
    return inside


def build_cells(yang: list, huang: list) -> list:
    def rev(pts):
        return [list(p) for p in reversed(pts)]

    def copy(pts):
        return [[p[0], p[1]] for p in pts]

    # 潼关大弯：黄河由此转而东流。之前是晋陕峡谷。
    bend = min(
        (i for i, p in enumerate(huang) if 109.4 < p[0] < 111.2 and p[1] < 36),
        key=lambda i: huang[i][1],
    )
    gorge_top = next(i for i in range(bend, 0, -1) if huang[i][1] >= 37.15)

    def huang_span(lon0: float, lon1: float | None = None) -> list:
        out = []
        for p in huang[bend:]:
            if p[0] < lon0:
                continue
            out.append([p[0], p[1]])
            if lon1 is not None and p[0] > lon1:
                break
        return out

    def yang_span(lon0: float, lon1: float | None = None) -> list:
        out = []
        for p in yang:
            if p[0] < lon0:
                continue
            out.append([p[0], p[1]])
            if lon1 is not None and p[0] > lon1:
                break
        return out

    yellow_all = huang_span(huang[bend][0])  # 潼关到入海
    gorge = copy(huang[gorge_top : bend + 1])  # 北纬 37 以南的峡谷，到潼关

    # 邺 / 许都 / 洛阳 / 徐州 共用的黄河段
    yellow_to_luo = huang_span(huang[bend][0], 112.85)
    yellow_to_xu = huang_span(112.85, 116.35)
    yellow_to_sea = huang_span(116.35)
    yang_to_sea = yang_span(117.7)
    yang_huainan = yang_span(114.7, 117.85)

    qinling = [
        [105.2, 34.02],
        [106.4, 33.94],
        [107.8, 33.9],
        [109.2, 33.74],
        [110.15, 33.52],
    ]
    daba = [
        [105.4, 32.7],
        [106.8, 32.46],
        [108.1, 32.4],
        [109.2, 32.2],
        [110.05, 32.35],
    ]
    # 江陵城在江北，北缘抬过城，不压在江流上。
    jing_north = [
        [110.2, 31.15],
        [111.15, 30.98],
        [112.25, 30.74],
        [113.2, 30.6],
        [114.15, 30.88],
        [114.7, 31.05],
    ]
    jing_south = [
        [110.05, 29.55],
        [111.3, 29.28],
        [112.7, 29.12],
        [114.15, 29.22],
        [114.7, 29.35],
    ]
    xiang_north = [
        [110.2, 33.45],
        [111.2, 33.22],
        [112.55, 33.42],
        [113.35, 33.18],
        [114.7, 32.42],
    ]

    ye_start = bend
    for i in range(bend - 1, 0, -1):
        if huang[i][1] >= 40.25 and huang[i][0] > 109.2:
            ye_start = i
            break
    ye = copy(huang[ye_start:]) + [
        [122.15, 38.15],
        [122.35, 40.6],
        [huang[ye_start][0], 40.6],
    ]

    xuzhou = yellow_to_sea + [
        [122.35, 37.4],
        [122.45, 34.2],
        [121.6, 32.5],
    ] + rev(yang_to_sea) + [
        [117.7, 31.55],
        [117.7, 33.55],
        [116.35, 33.55],
    ]

    # 许都含豫州和淮南，南缘让出荆襄。
    xudu = yellow_to_xu + [
        [116.35, 33.55],
        [117.7, 33.55],
        [117.7, 31.55],
    ] + rev(yang_huainan) + rev(xiang_north[2:]) + [
        [112.7, 34.4],
    ]

    luoyang = yellow_to_luo + [
        [112.7, 34.4],
    ] + rev(xiang_north[:3]) + [
        [110.2, 34.15],
    ]

    # 关中顺着晋陕峡谷接到画框，黄河以西不再空出一块。
    west_bank = copy(huang[ye_start : bend + 1])
    changan = qinling + rev(west_bank) + [
        [west_bank[0][0], 40.6],
        [101.6, 40.6],
        [101.6, 34.15],
    ]

    hanzhong = [[101.6, 34.05]] + qinling + [
        [110.15, 32.7],
    ] + rev(daba) + [[101.6, 32.75]]

    # 和江陵共用西缘，三峡不再留一条空白。
    gorge_meet = [
        [110.2, 31.15],
        [110.12, 30.55],
        [110.05, 29.85],
        [110.15, 29.55],
    ]
    chengdu = daba + gorge_meet + [
        [109.7, 28.3],
        [109.55, 26.55],
        [101.6, 26.55],
        [101.6, 30.0],
        [101.7, 32.2],
        [103.4, 32.85],
    ]

    xiangyang = xiang_north + rev(jing_north)

    jiangling = jing_north + rev(jing_south) + rev(gorge_meet[:-1])

    changsha = jing_south + [
        [114.7, 26.55],
        [109.55, 26.55],
        [109.7, 28.3],
        [110.15, 29.55],
    ]

    jianye = yang_huainan + yang_to_sea[1:] + [
        [122.4, 31.2],
        [122.5, 26.55],
        [114.7, 26.55],
        [114.7, 29.35],
    ]

    cells = [
        ("ye", ye),
        ("xuzhou", xuzhou),
        ("xudu", xudu),
        ("luoyang", luoyang),
        ("changan", changan),
        ("hanzhong", hanzhong),
        ("chengdu", chengdu),
        ("xiangyang", xiangyang),
        ("jiangling", jiangling),
        ("changsha", changsha),
        ("jianye", jianye),
    ]
    _ = (yellow_all, xiang_north, copy)
    return [(city, dedupe(ring)) for city, ring in cells]


def main():
    project = albers()
    xy, width, height = fit(project)
    drawn, yang, huang = collect_rivers()
    yang = douglas(dedupe(yang), 0.03)
    huang = douglas(dedupe(huang), 0.025)
    land = collect_land()
    lakes = collect_lakes()
    cells = build_cells(yang, huang)

    # dx, dy 是城名相对城点的偏移，躲开河名和邻城。
    cities = [
        ("ye", "邺", 114.38, 36.33, 0, -14),
        ("xuzhou", "徐州", 117.28, 34.27, 0, -14),
        ("xudu", "许昌", 113.85, 34.04, 0, 18),
        ("luoyang", "洛阳", 112.45, 34.66, -20, -13),
        ("changan", "长安", 108.94, 34.30, 0, -14),
        ("hanzhong", "汉中", 107.03, 33.07, 0, -14),
        ("chengdu", "成都", 104.07, 30.67, 0, -14),
        ("xiangyang", "襄阳", 112.14, 32.04, 0, -14),
        ("jiangling", "江陵", 112.19, 30.33, 0, -15),
        ("changsha", "长沙", 112.94, 28.23, 0, 16),
        ("jianye", "建业", 118.78, 32.06, -22, 34),
    ]
    minors = [
        ("蓟", 116.40, 39.92, 0, 14),
        ("晋阳", 112.55, 37.87, -16, -4),
        ("寿春", 116.96, 32.60, 0, -14),
        ("柴桑", 115.97, 29.73, 26, 22),
        ("赤壁", 113.62, 29.85, -6, 28),
        ("白帝", 109.53, 31.04, -22, -2),
        ("祁山", 105.70, 34.20, 12, -12),
        ("官渡", 114.05, 34.92, 18, -14),
    ]

    by_city = {city: ring for city, ring in cells}
    for cid, name, lon, lat, _dx, _dy in cities:
        ring = by_city[cid]
        if not point_in(ring, lon, lat):
            raise SystemExit(f"{name} ({lon},{lat}) 不在自己的色块里")

    grat = []
    for lon in range(104, 123, 4):
        grat.append([[lon, BOX[1]], [lon, BOX[3]]])
    for lat in range(28, 41, 4):
        grat.append([[BOX[0], lat], [BOX[2], lat]])

    ranges = [
        # 秦岭、太行、大巴、巫山、南岭，只作浅色山影，不是边界。
        [[104.8, 34.2], [106.6, 34.15], [108.6, 33.95], [110.2, 33.6], [110.0, 33.95], [108.2, 34.35], [106.2, 34.5], [104.8, 34.45]],
        [[112.2, 35.4], [112.9, 36.6], [113.6, 38.2], [114.2, 39.6], [113.5, 39.4], [112.6, 37.6], [112.0, 36.0]],
        [[106.2, 32.3], [107.8, 32.15], [109.4, 32.05], [110.3, 31.6], [109.6, 31.7], [108.0, 32.45], [106.4, 32.6]],
        [[109.6, 31.3], [110.3, 31.0], [110.9, 30.6], [110.6, 30.3], [109.8, 30.7]],
        [[110.2, 25.6], [111.6, 25.2], [113.2, 24.6], [113.4, 25.1], [111.6, 25.7], [110.4, 26.0]],
    ]

    payload = {
        "w": round(width, 1),
        "h": round(height, 1),
        "land": "".join(path_of(poly, xy) for poly in land),
        "lakes": [path_of(poly, xy) for poly in lakes],
        "rivers": [{"w": w, "d": path_of([line], xy, close=False)} for w, line in drawn],
        "ranges": [path_of([ring], xy) for ring in ranges],
        "graticule": path_of(grat, xy, close=False),
        "cells": [{"city": city, "d": path_of([ring], xy)} for city, ring in cells],
        "cities": [
            {
                "id": cid,
                "name": name,
                "x": round(xy(lon, lat)[0], 1),
                "y": round(xy(lon, lat)[1], 1),
                "dx": dx,
                "dy": dy,
            }
            for cid, name, lon, lat, dx, dy in cities
        ],
        "minors": [
            {
                "name": name,
                "x": round(xy(lon, lat)[0], 1),
                "y": round(xy(lon, lat)[1], 1),
                "dx": dx,
                "dy": dy,
            }
            for name, lon, lat, dx, dy in minors
        ],
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
    print(f"wrote {OUT} land={sum(p.count('M') for p in [payload['land']])} rivers={len(drawn)} lakes={len(lakes)} {width:.0f}x{height:.0f} bytes={OUT.stat().st_size}")


if __name__ == "__main__":
    main()
