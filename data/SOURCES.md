# Data sources

Raw downloads live in `raw/`; the cleaned files the web page loads live in `processed/`. All raw files were downloaded on 6 October 2026 (large zips are kept on the author's computer and are not committed). The page combines three sources: the Bureau of Meteorology, ABARES and the Australian Bureau of Statistics.

## Raw data
| Folder | File(s) | Source | URL |
|---|---|---|---|
| `raw/bom/` | `rain_cool_<state>.txt` (April to October) and `rain_annual_<state>.txt`, 1900 to 2025 | Bureau of Meteorology, Australian climate variability and change: time series (area-averaged rainfall) | https://www.bom.gov.au/climate/change/ |
| `raw/bom/` | `rainan.zip` (average annual rainfall grid, ESRI ASCII; not committed) | Bureau of Meteorology, climate averages maps | https://www.bom.gov.au/climate/maps/averages/rainfall/ |
| `raw/bom/` | `enso_events_bom.txt` (El Niño and La Niña event years, plus the 2019 and 2022 climate statements) | Bureau of Meteorology, ENSO history and Annual Climate Statements | https://www.bom.gov.au/climate/history/enso/ |
| `raw/abares/` | `03_AustCropRrt20260901_StateCropData_v1.0.0.xlsx` | ABARES, Australian Crop Report, September 2026 (No. 219), state data | https://www.agriculture.gov.au/abares/research-topics/agricultural-outlook/australian-crop-report/september-2026 |
| `raw/abares/` | `02_AgCommodities202609_Tables_v1.0.0.xlsx`, `03_AgCommodities202609_Stats_v1.0.0.xlsx` | ABARES, Agricultural commodities, September quarter 2026 | https://www.agriculture.gov.au/abares/research-topics/agricultural-outlook/data |
| `raw/abs/` | `STE_2021_AUST_SHP_GDA2020.zip` (not committed) | Australian Bureau of Statistics, ASGS Edition 3: States and Territories 2021 | https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs-edition-3/jul2021-jun2026/access-and-downloads/digital-boundary-files |

## Processed files (what the page loads)
| File | Built from | Contents |
|---|---|---|
| `processed/crops_by_state.csv` | ABARES Crop Report state data | state (and Australia), crop (wheat, barley, canola), season, year sown, status (actual, ABARES estimate or forecast), area ('000 ha), production (kt), yield (t/ha = production ÷ area) |
| `processed/rain_vs_yield.csv` | BoM and ABARES joined on state and year | April to October rain and wheat yield per state, 1989 to 2025, each also as a % of that state's average |
| `processed/rainfall_by_state.csv` | BoM time series | the full 1900 to 2025 series behind `rain_vs_yield.csv`: April to October mm, annual mm, April to October as % of the 1961 to 1990 average. The page does not load it; it is kept as the record of where the rain figures come from |
| `processed/climate_drivers.csv` | BoM ENSO event list | year 1989 to 2025, El Niño, La Niña or Neutral (the 2002 to 2003 event is assigned to the 2002 growing season); notes for 2019 (positive Indian Ocean Dipole, driest year) and 2022 |
| `processed/farm_income.csv` | ABARES Agricultural commodities, Statistical Table 2 | all Australian farms, 1994 to 95 to 2026 to 27: gross value, total cash costs, net value of farm production and real (inflation-adjusted) net value, $ million |
| `processed/aus_states.topojson` | ABS STE 2021 | 8 states and territories, simplified with mapshaper (0.6%), small islands removed |
| `processed/isohyets_annual_avg.topojson` | BoM average annual rainfall grid | filled rainfall bands (0–200, 200–300, 300–400, 400–600, 600–800, 800–1200, 1200–1600, 1600–2400, 2400+ mm); grid averaged to 0.15°, contoured, clipped to the coastline |
| `processed/wheatbelt_outline.geojson` | `isohyets_annual_avg.topojson` via `scripts/clip_isohyets.py` | outer edge of the 300 to 600 mm bands, south of 26°S only, Tasmania and short inland pieces removed: the gold wheat belt line |
| `processed/isohyets_sw_wa.geojson` | `isohyets_annual_avg.topojson` via `scripts/clip_isohyets.py` | 300 mm and wetter bands clipped to south-west Western Australia (west of 129°E, south of 26.5°S) |

Notes: the season "2019–20" is the crop sown in autumn 2019 and harvested in late 2019, so it is matched with April to October 2019 rainfall. 2022–23 to 2025–26 are ABARES estimates and 2026–27 is a forecast.

## Scripts
- `scripts/clip_isohyets.py` builds the two derived map layers from the isohyet TopoJSON (needs only Python 3).
- `scripts/check_numbers.py` recomputes every headline number printed on the page from `processed/` and fails if any of them disagrees with the text. Run it from the repository root with `python3 data/scripts/check_numbers.py`.

## Context figures (not charted, quoted for readers in Malaysia)
| Figure | Value | Source |
|---|---|---|
| Area of Australia | 7,688,287 km² | Geoscience Australia, Area of Australia, States and Territories: https://ga.gov.au/scientific-topics/national-location-information/dimensions/area-of-australia-states-and-territories |
| Area of Malaysia | 329,847 km² (total area) | CIA World Factbook, Malaysia: https://www.cia.gov/the-world-factbook/countries/malaysia/ |
| Ratio | 23.3, written as "about 23 times" | calculated from the two areas above |
| Malaysia's mean annual rainfall | 3,085.5 mm (shown as about 3,100 mm) | World Bank Climate Knowledge Portal, Malaysia current climate: https://climateknowledgeportal.worldbank.org/node/2456 |

The 300 to 600 mm wheat belt it is compared with comes from the BoM rainfall bands above.

## Removed
The two FAOSTAT wheat export files (`raw/fao/` and the two `wheat_exports_*.csv` files in `processed/`) were not used by the page and were removed. They are still in the git history.
