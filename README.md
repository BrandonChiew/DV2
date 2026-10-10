# When the rain stops

How rainfall and drought shape Australia's grain harvests, 1989–2025. A single scrolling story page built with Vega-Lite.

FIT3179 Data Visualisation 2 — Chew Chen Hin (35154667), Monash University Malaysia, 2026.
Live page: https://brandonchiew.github.io/dv2-farmers-climate/

## Run it locally
The charts fetch their JSON and CSV files, so open the page through a web server, not `file://`:

```
python3 -m http.server
```
then visit http://localhost:8000.

## What is where
| Path | Contents |
|---|---|
| `index.html` | the page: hero, nine story sections, footer |
| `css/style.css` | design tokens, layout, layered SVG scenes, phone layout |
| `js/main.js` | embeds every chart, the guess game, the rain slider, the page-wide year link, text readouts computed from the CSVs |
| `js/*.vl.json` | one Vega-Lite spec per chart (list below) |
| `data/processed/` | cleaned files the page loads |
| `data/raw/` | original downloads (large zips are not committed) |
| `data/scripts/clip_isohyets.py` | builds the wheat-belt outline and the south-west WA rain bands from the isohyet TopoJSON |
| `data/SOURCES.md` | where every file came from |

## Charts
| Spec | Idiom | Interaction |
|---|---|---|
| `guess.vl.json` | bar chart, guess-first | drag the 2019 bar (or slider), reveal button; guess is kept for the last section |
| `map_isohyets.vl.json` | isohyet bands (scalar field map) + proportional circles | tooltips |
| `panorama.vl.json` | four linked rows on one year axis: ENSO strip, rain capsule heatmap, wheat area, income "roots" | click a year (or use the slider) — the light column moves and later charts follow |
| `nsw_scatter.vl.json` | connected scatterplot | "be the farmer" rain slider; follows the selected year |
| `choropleths.vl.json` | choropleth small multiples (2 × 2) | tooltips |
| `wa_map.vl.json` | WA map with rain-band overlay + locator | tooltips |
| `wa_scatter.vl.json` | scatterplot | follows the selected year |
| `swing.vl.json` | dumbbell + slopegraph | hover a state to highlight it in both |
| `streamgraph.vl.json` | streamgraph | tooltips; follows the selected year |
| `diverging.vl.json` | diverging bars | tooltips |

## Data
Bureau of Meteorology (rainfall series and grid, ENSO history, Annual Climate Statements), ABARES (Australian Crop Report and Agricultural commodities, September 2026) and the Australian Bureau of Statistics (state boundaries). Details in `data/SOURCES.md`.
