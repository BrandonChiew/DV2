# Data sources

All raw files were downloaded on 6 October 2026. Raw downloads live in `raw/`; the cleaned files the web page loads live in `processed/`.

| Folder | File(s) | Source | URL |
|---|---|---|---|
| `raw/bom/` | `rain_cool_<state>.txt` (Apr–Oct) and `rain_annual_<state>.txt`, 1900–2025 | Bureau of Meteorology, Australian climate variability & change – time series (area-averaged rainfall) | https://www.bom.gov.au/climate/change/ |
| `raw/bom/` | `rainan.zip` (average annual rainfall grid, ESRI ASCII) | Bureau of Meteorology, climate averages maps | https://www.bom.gov.au/climate/maps/averages/rainfall/ |
| `raw/abares/` | `03_AustCropRrt20260901_StateCropData_v1.0.0.xlsx` | ABARES, Australian Crop Report September 2026 (No. 219), state data | https://www.agriculture.gov.au/abares/research-topics/agricultural-outlook/australian-crop-report/september-2026 |
| `raw/abares/` | `02_AgCommodities202609_Tables_v1.0.0.xlsx`, `03_AgCommodities202609_Stats_v1.0.0.xlsx` | ABARES, Agricultural commodities September quarter 2026 | https://www.agriculture.gov.au/abares/research-topics/agricultural-outlook/data |
| `raw/bom/` | `enso_events_bom.txt` (El Niño / La Niña event years + 2019 and 2022 climate statements) | Bureau of Meteorology, ENSO history and Annual Climate Statements | https://www.bom.gov.au/climate/history/enso/ |
| `raw/abs/` | `STE_2021_AUST_SHP_GDA2020.zip` | Australian Bureau of Statistics, ASGS Edition 3 – States and Territories 2021 | https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs-edition-3/jul2021-jun2026/access-and-downloads/digital-boundary-files |
| `raw/fao/` | `faostat_wheat_export_tonnes_2019-2023.csv` (export quantity, tonnes) and `faostat_wheat_export_value_usd_2019-2023.csv` (export value, 1000 USD), Australia → all partner countries | FAO, FAOSTAT Detailed trade matrix | https://www.fao.org/faostat/en/#data/TM |

## Processed files (what the web page loads)
| File | Built from | Contents |
|---|---|---|
| `processed/rainfall_by_state.csv` | BOM time series | state, year, cool-season (Apr–Oct) mm, annual mm, cool-season % of the 1961–1990 average |
| `processed/crops_by_state.csv` | ABARES Crop Report state data | state (+ Australia), crop (wheat, barley, canola), season, year sown, status (actual / ABARES estimate / ABARES forecast), area ('000 ha), production (kt), yield (t/ha = production ÷ area) |
| `processed/rain_vs_yield.csv` | BOM + ABARES joined on state and year | cool-season rainfall and wheat yield per state, 1989–2025, each also as % of that state's average |
| `processed/climate_drivers.csv` | BOM ENSO event list | year 1989–2025, El Niño / La Niña / Neutral (event 2002–03 is assigned to the 2002 growing season); notes for 2019 (+IOD, driest year) and 2022 (La Niña + −IOD) |
| `processed/farm_income.csv` | ABARES Agricultural commodities Sept 2026, Statistical Table 2 | all Australian farms, 1994–95 to 2026–27: gross value, total cash costs, net value of farm production, real (inflation-adjusted) net value, $m |
| `processed/aus_states.topojson` | ABS STE 2021 | 8 states/territories, simplified with mapshaper (0.6%), small islands removed |
| `processed/isohyets_annual_avg.topojson` | BOM average annual rainfall grid | filled rainfall bands (0–200, 200–300, 300–400, 400–600, 600–800, 800–1200, 1200–1600, 1600–2400, 2400+ mm); grid averaged to 0.15°, contoured, clipped to the coastline |
| `processed/wheatbelt_outline.geojson` | `isohyets_annual_avg.topojson` via `scripts/clip_isohyets.py` | outer edge of the 300–600 mm bands (the 400 mm line between them dropped), south of 26°S only, Tasmania and short inland pieces removed: the gold "wheat belt" line |
| `processed/isohyets_sw_wa.geojson` | `isohyets_annual_avg.topojson` via `scripts/clip_isohyets.py` | 300 mm+ rainfall bands clipped to south-west Western Australia (west of 129°E, south of 26.5°S) |
| `processed/wheat_exports_by_country.csv` | FAOSTAT (tonnes) | year, destination, region, tonnes, 2019–2023 |
| `processed/wheat_exports_flows.csv` | FAOSTAT (tonnes) | Sankey links: Australia → region → country, average tonnes per year 2019–2023; top 10 destinations + Malaysia named, the rest grouped as "Other" |

Notes: the season "2019–20" is the crop sown in autumn 2019 and harvested in late 2019, so it is matched with April–October 2019 rainfall. 2022–23 to 2025–26 are ABARES estimates and 2026–27 is a forecast.
