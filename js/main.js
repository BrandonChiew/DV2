// When the rain stops — embeds every chart and links them together.
const views = {};
window.views = views; // handy for checking signal names in the console

const OPTS = { actions: false, renderer: 'svg' };
const ACTUAL_2019 = 14.5; // shown only after the reveal; the chart reads it from crops_by_state.csv

function embed(id, spec) {
  return vegaEmbed('#' + id, 'js/' + spec, OPTS).then(res => {
    views[id] = res.view;
    fit(id);
    return res.view;
  }).catch(err => console.error(spec, err));
}

/* ---------- Small screens ---------- */
// Shrink a chart that is wider than its column, but never below 72% so the text
// stays readable; whatever is still too wide scrolls sideways, with a cue.
// (Every interaction picks marks by their SVG element, so scaling is safe.)
const MIN_SCALE = 0.72;
function fit(id) {
  const box = document.getElementById(id);
  const svg = box && box.querySelector('svg');
  if (!svg) return;
  const natural = +svg.getAttribute('width');
  const avail = box.clientWidth;
  const w = Math.max(Math.min(natural, avail), Math.round(natural * MIN_SCALE));
  svg.style.width = w + 'px';
  svg.style.height = 'auto';
  box.classList.toggle('swipe', w > avail + 1);
}
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => Object.keys(views).forEach(fit), 150);
});

/* ---------- Guess the 2019 harvest ---------- */
function readGuess() {
  try { const g = parseFloat(sessionStorage.getItem('guess2019')); if (!isNaN(g)) return g; } catch (e) {}
  return null;
}
function saveGuess(g) {
  window.__guess = g;
  try { sessionStorage.setItem('guess2019', g); } catch (e) {}
  updateCallback();
}
function updateCallback() {
  const el = document.getElementById('guess-callback');
  if (!el) return;
  const g = window.__guess;
  el.textContent = g == null
    ? `In 2019 the harvest was ${ACTUAL_2019} Mt. Now you know why.`
    : `You guessed ${g.toFixed(1)} Mt for 2019. Now you know why it was ${ACTUAL_2019}.`;
}

function setupGuess(view) {
  const input = document.getElementById('guess-input');
  const out = document.getElementById('guess-out');
  const button = document.getElementById('reveal');
  const result = document.getElementById('guess-result');
  const fields = view.signal('pick_tuple_fields');
  const unit = view.data('pick_store')[0].unit;

  const show = g => { input.value = g; out.textContent = g.toFixed(1) + ' Mt'; };
  // Slider -> chart: replace the selection store with the chosen rung.
  const setChart = g => view.data('pick_store', [{ unit, fields, values: [g] }]).runAsync();

  const start = readGuess();
  if (start != null) setChart(start);
  show(start != null ? start : 25);
  window.__guess = start;
  updateCallback();

  // Chart drag -> slider and storage.
  view.addSignalListener('pick', (name, value) => {
    const g = value && value.mt_pick ? value.mt_pick[0] : null;
    if (g == null) return;
    show(g); saveGuess(g);
  });
  input.addEventListener('input', () => {
    const g = parseFloat(input.value);
    show(g); setChart(g); saveGuess(g);
  });

  button.addEventListener('click', () => {
    view.signal('reveal', true).runAsync();
    if (window.__guess == null) saveGuess(parseFloat(input.value));
    const g = window.__guess, diff = g - ACTUAL_2019;
    const how = Math.abs(diff) < 0.75 ? 'Spot on.'
      : `You were ${Math.abs(diff).toFixed(1)} Mt ${diff > 0 ? 'too high' : 'too low'}.`;
    result.innerHTML = `Less than half.<span>The real 2019 harvest was ${ACTUAL_2019} Mt, under half of 2016. You guessed ${g.toFixed(1)} Mt. ${how}</span>`;
    button.disabled = true;
    button.textContent = 'Real harvest shown';
  });
}

/* ---------- Data for text readouts (same CSVs the charts use) ---------- */
function loadCSV(name) {
  return vega.loader().load('data/processed/' + name)
    .then(text => vega.read(text, { type: 'csv', parse: 'auto' }));
}
const dataReady = Promise.all(['crops_by_state.csv', 'rain_vs_yield.csv', 'farm_income.csv', 'climate_drivers.csv'].map(loadCSV))
  .then(([crops, rain, income, drivers]) => ({ crops, rain, income, drivers }));

const ENSO_NAME = { 'El Nino': 'El Niño', 'La Nina': 'La Niña', Neutral: 'no El Niño or La Niña' };

function yearCard(d, year) {
  const wheat = d.crops.find(r => r.state_code === 'AUS' && r.crop === 'wheat' && r.year === year);
  const inc = d.income.find(r => r.year === year);
  const enso = d.drivers.find(r => r.year === year);
  const nsw = d.rain.find(r => r.state_code === 'NSW' && r.year === year);
  const parts = [];
  if (wheat) parts.push(`Wheat: ${(wheat.production_kt / 1000).toFixed(1)} Mt${wheat.status !== 'actual' ? ' (ABARES ' + wheat.status + ')' : ''}.`);
  if (nsw) parts.push(`NSW rain: ${Math.round(nsw.rain_cool_pct_of_avg)}% of normal.`);
  if (inc) parts.push(`Farmers kept $${(inc.real_net_value_m / 1000).toFixed(1)}b.`);
  if (enso) parts.push(`Pacific: ${ENSO_NAME[enso.enso]}.`);
  return `<b>${wheat ? wheat.season : year}</b>${parts.join(' ')}`;
}

/* ---------- Page-wide year link ---------- */
// The panorama's point selection "yr" drives everything; other charts get the year
// through their own "selYear" signal (added section by section).
let currentYear = 2019;
const yearListeners = [];
// Choose a year for the whole page from any chart (set up by the panorama).
let selectYear = y => setYear(y);
function setYear(year) {
  currentYear = year;
  dataReady.then(d => {
    const card = document.getElementById('year-card');
    if (card) card.innerHTML = yearCard(d, year);
  });
  yearListeners.forEach(fn => fn(year));
}

function setupPanorama(view) {
  const input = document.getElementById('year-input');
  const unit = view.data('yr_store')[0].unit;
  const fields = view.data('yr_store')[0].fields;
  view.addSignalListener('yr', (name, value) => {
    const y = value && value.year ? +value.year[0] : null;
    if (y && y !== currentYear) setYear(y);
  });
  // Keyboard / slider route to the same selection.
  selectYear = y => view.data('yr_store', [{ unit, fields, values: [y] }]).runAsync();
  input.addEventListener('input', () => selectYear(+input.value));
  yearListeners.push(y => { input.value = y; });
  setYear(currentYear);
}

// Charts that simply mark the selected year through a "selYear" signal.
function followYear(view) {
  yearListeners.push(y => view.signal('selYear', y).runAsync());
  view.signal('selYear', currentYear).runAsync();
}

// Charts whose dots carry a year: clicking a dot chooses that year for the page.
// (Lines and areas are skipped: their datum is only the first point.)
function clickYear(view) {
  view.addEventListener('click', (evt, item) => {
    const type = item && item.mark && item.mark.marktype;
    if (type === 'line' || type === 'area') return;
    const y = item && item.datum && item.datum.year;
    if (y >= 1989 && y <= 2025) selectYear(y);
  });
}

/* ---------- NSW: be the farmer ---------- */
function listYears(ys) {
  return ys.length < 2 ? ys.join('') : ys.slice(0, -1).join(', ') + ' and ' + ys[ys.length - 1];
}
function setupNSW(view) {
  const input = document.getElementById('rain-input');
  const out = document.getElementById('rain-out');
  const readout = document.getElementById('rain-readout');
  const update = () => {
    const c = +input.value, lo = c - 30, hi = c + 30;
    out.textContent = `${lo}–${hi} mm`;
    view.signal('rain', c).runAsync();
    dataReady.then(d => {
      const hits = d.rain.filter(r => r.state_code === 'NSW' && Math.abs(r.rain_cool_mm - c) <= 30)
        .sort((a, b) => a.year - b.year);
      if (!hits.length) { readout.textContent = `No season since 1989 got ${lo}–${hi} mm in NSW.`; return; }
      const ys = hits.map(r => r.wheat_yield_t_ha);
      const min = Math.min(...ys).toFixed(1), max = Math.max(...ys).toFixed(1);
      readout.textContent = `${hits.length === 1 ? 'One season' : hits.length + ' seasons'} got ${lo}–${hi} mm: ${listYears(hits.map(r => r.year))}. ` +
        `Wheat yielded ${min === max ? min : min + ' to ' + max} tonnes a hectare.`;
    });
  };
  input.addEventListener('input', update);
  update();
  followYear(view);
}

/* ---------- Barley note: where 2019's barley held up ---------- */
function barleyNote() {
  const el = document.getElementById('barley-note');
  dataReady.then(d => {
    const change = (state, year) => {
      const rows = d.crops.filter(r => r.state_code === state && r.crop === 'barley');
      const now = rows.find(r => r.year === year).production_kt;
      const prev = rows.filter(r => r.year >= year - 5 && r.year < year);
      return 100 * (now / (prev.reduce((s, r) => s + r.production_kt, 0) / prev.length) - 1);
    };
    const pct = v => (v >= 0 ? '+' : '−') + Math.abs(Math.round(v)) + '%';
    const aus = change('AUS', 2019), vic = change('VIC', 2019), nsw = change('NSW', 2019);
    el.textContent = `In 2019 barley held steady (${pct(aus)}). The state data shows where it held up: ` +
      `Victoria grew ${Math.round(vic)}% more barley than its five-year average, while New South Wales grew ${Math.abs(Math.round(nsw))}% less.`;
  });
}

/* ---------- More text readouts (numbers come from the CSVs, not from this file) ---------- */
const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
const absPct = v => Math.abs(Math.round(v)) + '%';

// "Farmers still sow": change in area sown and in yield against the five years before.
function sownNote() {
  const el = document.getElementById('sown-note');
  dataReady.then(d => {
    const w = d.crops.filter(r => r.state_code === 'AUS' && r.crop === 'wheat');
    const change = (field, year) => {
      const prev = w.filter(r => r.year >= year - 5 && r.year < year).map(r => r[field]);
      return 100 * (w.find(r => r.year === year)[field] / mean(prev) - 1);
    };
    const one = (year, label) => {
      const a = change('area_kha', year), y = change('yield_t_ha', year);
      return `${label}, farmers sowed ${absPct(a)} ${a < 0 ? 'less' : 'more'} wheat and the yield ${y < 0 ? 'fell' : 'rose'} ${absPct(y)}.`;
    };
    el.textContent = [one(2002, 'In 2002'), one(2006, 'In 2006'), one(2019, 'In 2019, the driest year'),
      one(2022, 'In 2022, the record harvest')].join(' ') + ' All changes are against the average of the five years before.';
  });
}

// Five-state chart: how closely rain and yield move together in each state (correlation r).
function fiveNote() {
  const el = document.getElementById('five-note');
  dataReady.then(d => {
    const r = code => {
      const rows = d.rain.filter(x => x.state_code === code && x.year <= 2025 && x.yield_pct_of_avg != null);
      const xs = rows.map(x => x.rain_cool_pct_of_avg), ys = rows.map(x => x.yield_pct_of_avg);
      const mx = mean(xs), my = mean(ys);
      return xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) /
        Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0) * ys.reduce((s, y) => s + (y - my) ** 2, 0));
    };
    const f = code => r(code).toFixed(2);
    el.textContent = `Is New South Wales special? Here is the same test in every mainland state. A wetter season goes with a bigger yield in New South Wales (r = ${f('NSW')}), ` +
      `Victoria (${f('VIC')}), South Australia (${f('SA')}) and Queensland (${f('QLD')}). Western Australia is the odd one out (${f('WA')}).`;
  });
}

// Panorama side note: 2019 is the exception for money.
function incomeNote() {
  const el = document.getElementById('income-note');
  dataReady.then(d => {
    const kept = y => (d.income.find(r => r.year === y).real_net_value_m / 1000).toFixed(1);
    el.textContent = `Money did not follow in 2019: farmers kept $${kept(2019)}b after costs, against $${kept(2018)}b the year before. ` +
      'That figure covers every farm product, not wheat alone.';
  });
}

// Wait for web fonts so Vega measures text with the right typeface.
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  embed('c-guess', 'guess.vl.json').then(v => v && setupGuess(v));
  embed('c-map', 'map_isohyets.vl.json');
  embed('c-pano', 'panorama.vl.json').then(v => v && setupPanorama(v));
  embed('c-nsw', 'nsw_scatter.vl.json').then(v => v && setupNSW(v));
  embed('c-choro', 'choropleths.vl.json');
  embed('c-wamap', 'wa_map.vl.json');
  embed('c-wa', 'wa_scatter.vl.json').then(v => v && followYear(v));
  embed('c-swing', 'swing.vl.json');
  embed('c-stream', 'streamgraph.vl.json').then(v => v && followYear(v));
  embed('c-diverge', 'diverging.vl.json');
  embed('c-enso', 'enso_jitter.vl.json').then(v => { if (v) { followYear(v); clickYear(v); } });
  embed('c-sown', 'sown_vs_yield.vl.json');
  embed('c-five', 'five_scatter.vl.json').then(v => v && followYear(v));
  embed('c-bump', 'bump.vl.json').then(v => { if (v) { followYear(v); clickYear(v); } });
  barleyNote();
  sownNote();
  fiveNote();
  incomeNote();
});
