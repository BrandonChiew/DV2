"""Derive two small map layers from processed/isohyets_annual_avg.topojson.

1. processed/wheatbelt_outline.geojson
   The outer edge of the 300-600 mm average-rain bands (the 400 mm line between
   them is dropped), kept only south of 26°S so the tropical north, which has the
   same rainfall but not the same farming, is not outlined. Tasmania and
   pieces shorter than 1.5 degrees (small inland islands) are dropped.
2. processed/isohyets_sw_wa.geojson
   The 300 mm+ bands clipped to south-west Western Australia (west of 129°E,
   south of 26.5°S), for the WA section.

Run from the repo root:  python3 data/scripts/clip_isohyets.py
Only the Python standard library is needed.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
topo = json.loads((ROOT / "processed/isohyets_annual_avg.topojson").read_text())
sx, sy = topo["transform"]["scale"]
tx, ty = topo["transform"]["translate"]


def decode(arc):
    x = y = 0
    out = []
    for dx, dy in arc:
        x += dx
        y += dy
        out.append((round(x * sx + tx, 4), round(y * sy + ty, 4)))
    return out


arcs = [decode(a) for a in topo["arcs"]]


def arc_points(i):
    return arcs[i] if i >= 0 else arcs[~i][::-1]


def ring_points(ring):
    pts = []
    for i in ring:
        p = arc_points(i)
        pts.extend(p if not pts else p[1:])
    return pts


geoms = topo["objects"]["isohyets"]["geometries"]


def polygons(g):
    return [g["arcs"]] if g["type"] == "Polygon" else g["arcs"]


# ---------- 1. wheat-belt outline ----------
belt = [g for g in geoms if g["properties"]["min_mm"] in (300, 400)]
uses = {}
for g in belt:
    for poly in polygons(g):
        for ring in poly:
            for i in ring:
                k = i if i >= 0 else ~i
                uses[k] = uses.get(k, 0) + 1
edge_arcs = [k for k, n in uses.items() if n == 1]  # shared arcs = the 400 mm line


def clip_line_south(line, lat_max):
    """Split a polyline into the pieces that lie south of lat_max."""
    pieces, cur = [], []
    for a, b in zip(line, line[1:]):
        ina, inb = a[1] <= lat_max, b[1] <= lat_max
        if ina and not cur:
            cur = [a]
        if ina and inb:
            cur.append(b)
        elif ina != inb:
            t = (lat_max - a[1]) / (b[1] - a[1])
            p = (round(a[0] + t * (b[0] - a[0]), 4), lat_max)
            if ina:
                cur.append(p)
                pieces.append(cur)
                cur = []
            else:
                cur = [p, b]
    if len(cur) > 1:
        pieces.append(cur)
    return [p for p in pieces if len(p) > 1]


def length(line):
    return sum(((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5 for a, b in zip(line, line[1:]))


lines = []
for k in edge_arcs:
    lines.extend(clip_line_south(arcs[k], -26.0))
# drop Tasmania (not wheat country) and short inland islands / stubs left by the cut
lines = [l for l in lines if max(p[1] for p in l) > -39.5 and length(l) >= 1.5]
outline = {
    "type": "FeatureCollection",
    "features": [{
        "type": "Feature",
        "properties": {"name": "Wheat belt (300-600 mm a year, south of 26°S)"},
        "geometry": {"type": "MultiLineString", "coordinates": lines},
    }],
}

# ---------- 2. south-west WA bands ----------
BOX = (-180.0, 129.0, -90.0, -26.5)  # lon min, lon max, lat min, lat max


def clip_ring(ring, box):
    """Sutherland-Hodgman clip of one ring to an axis-aligned box."""
    lon0, lon1, lat0, lat1 = box
    edges = [
        (lambda p: p[0] >= lon0, lambda a, b: _x(a, b, lon0)),
        (lambda p: p[0] <= lon1, lambda a, b: _x(a, b, lon1)),
        (lambda p: p[1] >= lat0, lambda a, b: _y(a, b, lat0)),
        (lambda p: p[1] <= lat1, lambda a, b: _y(a, b, lat1)),
    ]
    pts = ring[:-1]
    for inside, cut in edges:
        if not pts:
            break
        out = []
        for j, cur in enumerate(pts):
            prev = pts[j - 1]
            if inside(cur):
                if not inside(prev):
                    out.append(cut(prev, cur))
                out.append(cur)
            elif inside(prev):
                out.append(cut(prev, cur))
        pts = out
    return pts + pts[:1] if len(pts) >= 3 else None


def _x(a, b, lon):
    t = (lon - a[0]) / (b[0] - a[0])
    return (lon, round(a[1] + t * (b[1] - a[1]), 4))


def _y(a, b, lat):
    t = (lat - a[1]) / (b[1] - a[1])
    return (round(a[0] + t * (b[0] - a[0]), 4), lat)


sw = []
for g in geoms:
    if g["properties"]["min_mm"] < 300:
        continue
    polys = []
    for poly in polygons(g):
        rings = [clip_ring(ring_points(r), BOX) for r in poly]
        if rings[0]:
            polys.append([r for r in rings if r])
    if polys:
        sw.append({
            "type": "Feature",
            "properties": dict(g["properties"]),
            "geometry": {"type": "MultiPolygon", "coordinates": polys},
        })

for name, fc in (("wheatbelt_outline", outline), ("isohyets_sw_wa", {"type": "FeatureCollection", "features": sw})):
    path = ROOT / f"processed/{name}.geojson"
    path.write_text(json.dumps(fc, separators=(",", ":")))
    print(path.relative_to(ROOT.parent), path.stat().st_size, "bytes")
