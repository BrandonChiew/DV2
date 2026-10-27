# When the rain stops

How rainfall and drought shape Australia's grain harvests, 1989 to 2025: a single scrolling story page built with Vega-Lite.

FIT3179 Data Visualisation 2, Chew Chen Hin (35154667), Monash University Malaysia, October 2026.
Live page: https://brandonchiew.github.io/DV2/

## What it is
A presentation (not an exploration tool) about Australian farmers and climate. The story starts with a guess about the 2019 wheat harvest, shows where in Australia grain can grow, follows 37 growing seasons of rain, harvest and farm income, then compares states and crops in dry and wet years. The audience is non-specialist readers, so Malaysia is used only for scale: Australia is about 23 times the size of Malaysia. There are 14 charts, listed in `docs/CHART_NOTES.md`, with the idiom, data fields and reasoning for each.

## How it was built
- **Charts:** one Vega-Lite 5 spec per chart in `js/*.vl.json`, embedded with Vega-Embed from a CDN. There is no build step and no framework.
- **Page logic:** `js/main.js` embeds the charts, links them through one page-wide year (a point selection in the panorama and a `selYear` signal in the others), runs the guess game and the sliders, and works out the numbers in several sentences from the CSVs in the browser. `js/mobile.js` holds the narrower chart variants used on phones.
- **Design:** Young Serif for headlines and big numbers, Bricolage Grotesque for everything else (both from Google Fonts), the same two families inside the charts. The colour palette runs from sand to deep teal for rain and brown to teal for "% of normal". The wavy section dividers and the night sky in the closing section are inline SVG.
- **Reading aids:** progress bar, a year chip, tooltips written as plain sentences (also on tap), an animated reveal on the guess chart that is switched off for readers who prefer reduced motion.
- **Accessibility:** every chart has a text description, controls work from the keyboard, colour is backed by labels, shapes or numbers on the charts that depend on it, and the page is laid out and tested for phones 390px wide.

## Run it locally
The charts fetch JSON and CSV files, so open the page through a web server, not `file://`:

```
python3 -m http.server
```
then visit http://localhost:8000.

## What is where
| Path | Contents |
|---|---|
| `index.html` | the page: a plain hero, ten sections, footer |
| `css/style.css` | design tokens, type scale, layout, phone layout |
| `js/main.js`, `js/mobile.js` | page logic and phone chart variants |
| `js/*.vl.json` | one Vega-Lite spec per chart |
| `data/processed/` | the cleaned files the page loads |
| `data/raw/` | the original downloads (large zips are not committed) |
| `data/scripts/` | `clip_isohyets.py` builds two map layers; `check_numbers.py` recomputes the page's numbers from the CSVs |
| `data/SOURCES.md` | where every file came from |
| `docs/CHART_NOTES.md` | one paragraph per chart |

## Data
Bureau of Meteorology (state rainfall series and the average rainfall grid, ENSO history, Annual Climate Statements), ABARES (Australian Crop Report and Agricultural commodities, September 2026) and the Australian Bureau of Statistics (state boundaries, 2021). Context figures for Malaysia come from Geoscience Australia, the CIA World Factbook and the World Bank. Details and links are in `data/SOURCES.md` and in the page footer.

To check that the page agrees with the data, run `python3 data/scripts/check_numbers.py` from the repository root. It prints each number against the value worked out from the CSVs.

## Use of AI

I used Claude, through Claude Code, as an AI coding partner throughout the development of this project. Claude played a major role in translating my ideas into a working interactive data story, helping plan the page structure, develop the HTML, CSS and JavaScript, build the Vega-Lite chart specifications, and write the scripts that processed the raw downloads into cleaned datasets for the visualisations. I worked with Claude iteratively to develop and refine the page's structure, functionality and visual presentation.

- **What I did:** I chose the topic and the story, picked and checked the data sources, wrote or edited the final wording, and chose the colour palette and the typefaces (Young Serif and Bricolage Grotesque).
- **How I checked the numbers:** The key figures (harvests, averages, percentage changes, correlations and farm income) were recomputed from the CSVs with a script and compared with the text on the page. Several sentences work out their own numbers from the CSVs in the browser.
