// When the rain stops — embeds every chart and links them together.
const views = {};
window.views = views; // handy for checking signal names in the console

const REDUCED_MOTION = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Tooltips: every chart hands over one plain sentence ("tip") ---------- */
const tipEl = document.createElement('div');
tipEl.className = 'tip'; tipEl.setAttribute('role', 'tooltip');
document.body.appendChild(tipEl);
let tapShownAt = 0, tapShownY = 0;
function sentenceTooltip(handler, event, item, value) {
  // On a touch screen a tap redraws the chart and nudges the layout, which makes the browser send a
  // mouse-out and a tiny scroll straight away; those must not close the sentence the reader just asked for.
  if ((value == null || value === '') && event && event.type === 'mouseout' && performance.now() - tapShownAt < 1500) return;
  if (value == null || value === '') { tipEl.classList.remove('on'); return; }
  const text = typeof value === 'object'
    ? ('tip' in value ? value.tip : Object.entries(value).map(([k, v]) => `${k}: ${v}`).join('. '))
    : String(value);
  tipEl.textContent = text;
  tipEl.classList.add('on');
  const pad = 14, w = tipEl.offsetWidth, h = tipEl.offsetHeight;
  let x = event.clientX + pad, y = event.clientY + pad;
  if (x + w > innerWidth - 8) x = Math.max(8, event.clientX - w - pad);
  if (y + h > innerHeight - 8) y = Math.max(8, event.clientY - h - pad);
  tipEl.style.left = x + 'px'; tipEl.style.top = y + 'px';
}
document.addEventListener('scroll', () => {
  if (Math.abs(scrollY - tapShownY) > 60 || !tapShownAt) tipEl.classList.remove('on');
}, { passive: true });

const OPTS = { actions: false, renderer: 'svg', tooltip: sentenceTooltip };
// The two numbers the guess game needs come from the CSV (set once the data has loaded).
let ACTUAL_2019 = 14.5, KNOWN_2016 = 31.8;

// On a phone the chart is rebuilt from a narrower variant of its spec (see js/mobile.js).
function specSource(spec) {
  if (!PHONE.matches) return Promise.resolve('js/' + spec);
  return fetch('js/' + spec).then(r => r.json()).then(s => { wrapTitles(s); if (PHONE_TWEAKS[spec]) PHONE_TWEAKS[spec](s); return s; });
}
// Crossing the phone breakpoint (rotating, resizing) rebuilds the page's charts once.
PHONE.addEventListener('change', () => location.reload());

// Touch screens have no hover: a tap on a mark shows its sentence, a tap anywhere else hides it.
const TOUCH = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
function tapTooltips(view) {
  view.addEventListener('click', (evt, item) => {
    if (item && item.tooltip) { tapShownAt = performance.now(); tapShownY = scrollY; sentenceTooltip(null, evt, item, item.tooltip); }
    else tipEl.classList.remove('on');
  });
}

function embed(id, spec) {
  return specSource(spec).then(src => vegaEmbed('#' + id, src, OPTS)).then(res => {
    views[id] = res.view;
    if (TOUCH) tapTooltips(res.view);
    fit(id);
    return res.view;
  }).catch(err => console.error(spec, err));
}

/* ---------- Small screens ---------- */
// Shrink a chart that is wider than its column, but never below 72% so the text
// stays readable; whatever is still too wide scrolls sideways, with a cue.
// (Every interaction picks marks by their SVG element, so scaling is safe.)
const MIN_SCALE = 0.72;
// Charts that sit in a column of known width may also grow to fill it (up to this factor),
// so a narrow chart is not left floating in an empty section.
const MAX_UP = { 'c-guess': 1.3, 'c-enso': 1.4, 'c-sown': 1.4, 'c-diverge': 1.35, 'c-five': 1.25,
  'c-map': 1.12, 'c-bump': 1.2, 'c-swing': 1.15, 'c-stream': 1.2, 'c-nsw': 1.2, 'c-choro': 1.2, 'c-wamap': 1.25, 'c-wa': 1.25 };
function fit(id) {
  const box = document.getElementById(id);
  const svg = box && box.querySelector('svg');
  if (!svg) return;
  const natural = +svg.getAttribute('width');
  const avail = (box.parentElement || box).clientWidth; // Vega shrink-wraps the chart box itself
  // The 37-column panorama keeps its size on a phone and scrolls sideways, so its text stays readable.
  const floor = PHONE.matches && id === 'c-pano' ? 1 : MIN_SCALE;
  const w = Math.max(Math.min(natural * (MAX_UP[id] || 1), avail), Math.round(natural * floor));
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

  // The real bar rises over 0.9 s (instantly if the reader asked for reduced motion).
  const rise = () => new Promise(done => {
    view.signal('reveal', true);
    if (REDUCED_MOTION) { view.signal('revealT', 1).run(); return done(); }
    const t0 = performance.now(), dur = 900;
    const step = now => {
      const k = Math.min(1, (now - t0) / dur);
      view.signal('revealT', 1 - Math.pow(1 - k, 3)).run();
      if (k < 1) requestAnimationFrame(step); else done();
    };
    requestAnimationFrame(step);
  });

  button.addEventListener('click', async () => {
    button.disabled = true;
    if (window.__guess == null) saveGuess(parseFloat(input.value));
    await dataReady;                                  // real values come from the CSV
    view.signal('realMt', ACTUAL_2019);
    await rise();
    const g = window.__guess, diff = g - ACTUAL_2019;
    const drop = Math.round(100 * (1 - ACTUAL_2019 / KNOWN_2016));
    const how = Math.abs(diff) < 0.75
      ? `You guessed ${g.toFixed(1)} Mt: spot on.`
      : `You guessed ${g.toFixed(1)} Mt, so you were ${Math.abs(diff).toFixed(1)} Mt too ${diff > 0 ? 'high' : 'low'}.`;
    const big = ACTUAL_2019 < KNOWN_2016 / 2 ? 'Less than half.' : `${drop}% less.`;
    result.innerHTML = `${big}<span>${how} The real 2019 harvest was ${ACTUAL_2019} Mt, ${drop}% less than the ${KNOWN_2016} Mt of 2016.</span>`;
    button.textContent = 'Real harvest shown';
    updateCallback();
  });
}

/* ---------- Data for text readouts (same CSVs the charts use) ---------- */
function loadCSV(name) {
  return vega.loader().load('data/processed/' + name)
    .then(text => vega.read(text, { type: 'csv', parse: 'auto' }));
}
const dataReady = Promise.all(['crops_by_state.csv', 'rain_vs_yield.csv', 'farm_income.csv', 'climate_drivers.csv'].map(loadCSV))
  .then(([crops, rain, income, drivers]) => ({ crops, rain, income, drivers }));

dataReady.then(d => {
  const wheat = y => d.crops.find(r => r.state_code === 'AUS' && r.crop === 'wheat' && r.year === y).production_kt / 1000;
  ACTUAL_2019 = +wheat(2019).toFixed(1); KNOWN_2016 = +wheat(2016).toFixed(1);
  updateCallback();
});

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

/* ---------- Reader aids: progress bar, year chip, try-a-year buttons ---------- */
function setupReaderAids() {
  const bar = document.getElementById('progress-bar');
  const chip = document.getElementById('year-chip');
  const first = document.getElementById('seasons'), last = document.getElementById('end');
  let queued = false;
  const update = () => {
    queued = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.width = (max > 0 ? Math.min(100, 100 * scrollY / max) : 0) + '%';
    // The chip appears once the panorama is reached and leaves when the closing section arrives.
    const on = scrollY + innerHeight * 0.5 > first.offsetTop && scrollY + innerHeight * 0.6 < last.offsetTop;
    chip.classList.toggle('on', on);
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
  document.querySelectorAll('.chip-btn').forEach(b => b.addEventListener('click', () => selectYear(+b.dataset.year)));
}
setupReaderAids();

/* ---------- Page-wide year link ---------- */
// The panorama's point selection "yr" drives everything; other charts get the year
// through their own "selYear" signal (added section by section).
let currentYear = 2019;
const yearListeners = [];
// Choose a year for the whole page from any chart (set up by the panorama).
let selectYear = y => setYear(y);
function setYear(year) {
  currentYear = year;
  const chipYear = document.getElementById('yc-year');
  if (chipYear) chipYear.textContent = year;
  const chip = document.getElementById('year-chip');
  if (chip) chip.setAttribute('aria-label', `The year chosen for the whole page: ${year}. Go to the panorama to change it.`);
  document.querySelectorAll('.chip-btn').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.year === year)));
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
    el.textContent = `Is NSW special? Here is the same test in every mainland state. Rain and yield rise together in New South Wales (r = ${f('NSW')}), ` +
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

// Wait for the web fonts so Vega measures text with the right typeface.
// Ask for both typefaces explicitly (a chart is the first user of some weights), but never wait long.
const fontsReady = document.fonts
  ? Promise.race([
      Promise.all(['400 18px "Bricolage Grotesque"', '600 13px "Bricolage Grotesque"', '400 24px "Young Serif"'].map(f => document.fonts.load(f))),
      new Promise(r => setTimeout(r, 2500))])
  : Promise.resolve();
fontsReady.then(() => {
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
