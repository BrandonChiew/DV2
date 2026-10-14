# Chart notes

One short paragraph per chart: the idiom, the data fields it uses and why it suits the task. All charts are Vega-Lite specs in `js/`; every spec reads its data from `data/processed/`. Phones get narrower variants of the same specs from `js/mobile.js`. Every mark with a tooltip gives one plain sentence.

## 1. Guess the harvest (`guess.vl.json`)
**Idiom:** bar chart with a draggable estimate (a guess-first design). **Data:** `crops_by_state.csv`, rows for Australia, wheat, 2016 and 2019; `production_kt` shown in million tonnes. The reader drags a dashed bar for 2019 against the fixed 2016 bar, then the real bar rises. Bars on a common zero baseline are the most accurate comparison of two quantities, and asking for a guess first makes the fall from 31.8 to 14.5 Mt land harder than stating it.

## 2. Where the grain grows (`map_isohyets.vl.json`)
**Idiom:** three map idioms in one: a scalar field (average yearly rain as filled isohyet bands, one sequential nine-class colour scale), proportional symbols (circle area for the wheat each state grows in a year, 2015–24 average) and spot values (Darwin and Alice Springs), plus the wheat belt outline. **Data:** `isohyets_annual_avg.topojson` (band), `aus_states.topojson`, `wheatbelt_outline.geojson`, and `crops_by_state.csv` (`production_kt`, mainland states). **Projection:** conic equal area, which suits a wide area in the southern mid-latitudes and keeps areas comparable. It shows where grain can grow before any year-to-year story starts.

## 3. 37 seasons, one landscape (`panorama.vl.json`)
**Idiom:** four linked views on one year axis: an icon strip (sun for El Niño, cloud for La Niña, tick for neutral), a heatmap of capsules (April–October rain as a % of normal, one capsule per state and year, seven-class diverging colour scale), an area chart of the national wheat harvest and hanging bars for farm income after costs. **Data:** `climate_drivers.csv` (`enso`, `note`), `rain_vs_yield.csv` (`rain_cool_mm`, `rain_cool_pct_of_avg`), `crops_by_state.csv` (Australia, wheat, `production_kt`) and `farm_income.csv` (`real_net_value_m`). Clicking a year is a point selection that lights the same column in all four rows and drives every chart that follows a `selYear` signal. Aligned rows let the eye compare rain, harvest and money in the same season.

## 4. Pacific pattern against harvest (`enso_jitter.vl.json`)
**Idiom:** jitter plot with a mean bar per group. **Data:** `crops_by_state.csv` (Australia, wheat) joined to `climate_drivers.csv` on year. Each of the 37 harvests is a dot under El Niño (9 years), neutral (16) or La Niña (12). Showing every year, not just the averages of 16.2 and 27.0 Mt, keeps the overlap honest. The horizontal spread comes from the year, so the dots do not move between page loads.

## 5. Sown area against yield (`sown_vs_yield.vl.json`)
**Idiom:** lollipop chart, one row per year (2002, 2006, 2019, 2022) with two sticks each. **Data:** `crops_by_state.csv` (Australia, wheat): `area_kha` and `yield_t_ha`, each compared with the mean of the five years before. A stick from the zero line shows a signed change clearly. Putting area and yield side by side separates "farmers sowed less" from "each hectare gave less".

## 6. New South Wales (`nsw_scatter.vl.json`)
**Idiom:** connected scatterplot with a "be the farmer" rain slider. **Data:** `rain_vs_yield.csv`, NSW: `rain_cool_mm` against `wheat_yield_t_ha`, points joined in year order, with dashed lines at normal rain and normal yield. The slider highlights the seasons inside a 60 mm window and writes out their years and yields. A connected scatterplot shows both the relationship and the path through time, and the dry years sit together in the bottom left.

## 7. Four maps (`choropleths.vl.json`)
**Idiom:** choropleth small multiples, 2 × 2: rain (top) and wheat yield (bottom), 2019 (left) and 2022 (right). **Data:** `rain_vs_yield.csv` (`rain_cool_pct_of_avg`, `yield_pct_of_avg`) and `aus_states.topojson`. Values are standardised (each state as a % of its own normal) so states are comparable, and they are classified into seven bins on a brown-to-teal diverging scale with 100% in the middle. The projection is conic equal area, as the course notes require for choropleths. The Northern Territory and the ACT have no series and are grey.

## 8. State by state (`five_scatter.vl.json`)
**Idiom:** small-multiple scatterplots with a trend line. **Data:** `rain_vs_yield.csv` for the five mainland states, both axes as a % of normal. The correlation r in each panel is worked out inside the spec, so it cannot drift from the data. Shared axes make the panels comparable, and they show that New South Wales is typical (r 0.48 to 0.62) while Western Australia is not (0.24).

## 9. Western Australia (`wa_map.vl.json`)
**Idiom:** isohyet map with a locator inset. **Data:** `isohyets_sw_wa.geojson` (300 mm and wetter bands, clipped to the south-west) and `aus_states.topojson`. Most of the state is desert, so the statewide average hides the thin south-west corner where the wheat grows. This is the granularity point from the choropleth notes: the same data, shown at a finer level, tells another story.

## 10. WA rain against yield (`wa_scatter.vl.json`)
**Idiom:** scatterplot with annotated years. **Data:** `rain_vs_yield.csv`, Western Australia. The points barely line up, and the labelled 2010 (122% of normal rain, 60% of normal yield) and 2018 (67% and 126%) show the break from the NSW pattern.

## 11. The swing between 2019 and 2022 (`swing.vl.json`)
**Idiom:** a dumbbell chart (wheat yield, 2019 to 2022, by state, sorted by the size of the jump) and a slopegraph (rank by wheat grown). **Data:** `crops_by_state.csv`, mainland states. The dumbbell shows New South Wales rising 3.5 times; the slopegraph shows it climbing from fourth to second. A shared hover parameter lights one state in both charts.

## 12. Rank every season (`bump.vl.json`)
**Idiom:** bump chart. **Data:** `crops_by_state.csv`, wheat `production_kt` ranked within each year. Lines cross when two states swap places: Western Australia is first in 29 of 37 seasons and New South Wales drops to fourth in 1994, 2018 and 2019. Clicking a dot chooses that year for the whole page.

## 13. The whole paddock (`streamgraph.vl.json`)
**Idiom:** streamgraph. **Data:** `crops_by_state.csv`, Australia, wheat, barley and canola `production_kt`. Stacking the three crops around a centre line shows the whole harvest narrowing in the drought years and swelling in 2022, while the layers show each crop's share.

## 14. How far each crop fell (`diverging.vl.json`)
**Idiom:** diverging bar chart. **Data:** `crops_by_state.csv`, Australia: each crop's `production_kt` against the mean of the five years before, for 2002, 2006 and 2019. Bars to the left of zero are falls. It shows that barley held steady in 2019 (+3%) while wheat and canola fell, and a note under the chart says where it held up.

## Reader aids (not charts)
A progress bar, a year chip that shows which year the whole page is following, a "click any year" hint with three example years, the guess slider and the rain slider (keyboard alternatives to the dragging and clicking), and sentence tooltips that also open on tap.
