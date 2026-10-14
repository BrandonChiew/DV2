// Phone-width variants of the chart specs. On a screen of 640px or less each chart is rebuilt
// at a size that fits (instead of making the reader swipe sideways); the data and idioms stay the same.
const PHONE = window.matchMedia('(max-width: 640px)');

function walkSpec(n, fn) {
  if (Array.isArray(n)) n.forEach(v => walkSpec(v, fn));
  else if (n && typeof n === 'object') { fn(n); Object.values(n).forEach(v => walkSpec(v, fn)); }
}
function replaceText(spec, from, to) { // inside Vega expressions
  walkSpec(spec, n => { if (typeof n.calculate === 'string' && n.calculate.includes(from)) n.calculate = n.calculate.split(from).join(to); });
}

// Long chart titles would widen the whole SVG, so on a phone they wrap onto several lines.
function wrapWords(text, max) {
  const lines = []; let cur = '';
  String(text).split(' ').forEach(w => { if ((cur + ' ' + w).trim().length > max) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); });
  if (cur) lines.push(cur);
  return lines;
}
function wrapTitles(spec) {
  walkSpec(spec, n => {
    const t = n.title;
    if (t && typeof t === 'object' && !Array.isArray(t)) {
      if (typeof t.text === 'string') t.text = wrapWords(t.text, 38);
      if (typeof t.subtitle === 'string') t.subtitle = wrapWords(t.subtitle, 46);
      if (Array.isArray(t.subtitle)) t.subtitle = t.subtitle.flatMap(x => wrapWords(x, 46));
    }
  });
}

const PHONE_TWEAKS = {
  'map_isohyets.vl.json': s => {
    s.width = 320; s.height = 275;
    const land = s.layer[0].encoding.fill.legend; Object.assign(land, { orient: 'bottom', columns: 3, symbolSize: 200, titleFontSize: 14, labelFontSize: 13 });
    // the circle-size and wheat-belt legends move to a caption under the map (see index.html)
    s.layer[4].layer[0].encoding.size.legend = null;
    s.layer[3].encoding.stroke.legend = null;
    s.height = 300;
    // smaller circles (the radius expression and the size scale must change together)
    s.layer[4].layer[0].encoding.size.scale.range = [0, 2400];
    walkSpec(s, n => { if (typeof n.expr === 'string' && n.expr.includes('sqrt(5000 / 12')) n.expr = n.expr.replace('sqrt(5000 / 12', 'sqrt(2400 / 12'); });
    // the two italic-free rain notes under Darwin and Alice Springs are in the tooltip on a phone
    s.layer[5].layer = s.layer[5].layer.filter(l => !(l.mark && l.mark.type === 'text' && l.mark.dy === 13));
  },
  'wa_map.vl.json': s => {
    s.hconcat[0].width = 225; s.hconcat[0].height = 262;
    Object.assign(s.hconcat[1].vconcat[0], { width: 78, height: 68 });
    s.spacing = 6;
  },
  'choropleths.vl.json': s => {
    const names = ['Rain 2019', 'Rain 2022', 'Wheat yield 2019', 'Wheat yield 2022'];
    s.concat.forEach((c, i) => { c.width = 148; c.height = 122; if (c.title) c.title.text = names[i]; });
  },
  'nsw_scatter.vl.json': s => {
    s.width = 290; s.height = 300;
    // the two reference labels were placed with pixel positions for the wide version
    s.layer.forEach(l => {
      const t = l.encoding && l.encoding.text && l.encoding.text.value;
      if (t === 'normal yield') l.mark.x = s.width;
      if (t === 'normal rain') l.mark.y = s.height;
    });
  },
  'wa_scatter.vl.json': s => { s.width = 245; s.height = 290; },
  'five_scatter.vl.json': s => {
    s.columns = 2; s.spec.width = 118; s.spec.height = 150;
    s.spec.layer[3].encoding.color.legend.columns = 1;
  },
  'enso_jitter.vl.json': s => {
    s.width = 290; s.height = 300;
    walkSpec(s, n => { if (n.axis && typeof n.axis.labelExpr === 'string') n.axis.labelExpr = "['El Niño', 'Neutral', 'La Niña'][datum.value]"; });
    replaceText(s, "'2019: no El Niño, still the driest year'", "'2019: no El Niño'");
    replaceText(s, "'average ' + format(datum.avg, '.1f') + ' Mt'", "format(datum.avg, '.1f') + ' Mt'");   // three long labels would overlap
  },
  'sown_vs_yield.vl.json': s => {
    s.spec.width = 140;
    replaceText(s, "datum.year == 2019 ? '2019, driest' : datum.year == 2022 ? '2022, record' : toString(datum.year)", 'toString(datum.year)');
    s.facet.row.sort = ['2002', '2006', '2019', '2022'];
    s.facet.row.header.labelFontSize = 18;
  },
  'swing.vl.json': s => {
    s.vconcat = s.hconcat; delete s.hconcat; s.spacing = 22;
    Object.assign(s.vconcat[0], { width: 150, height: 190 });
    s.vconcat[0].layer[0].encoding.x2 = { value: 150 };            // the hover strip spans the whole plot
    replaceText(s, "format(datum['2022'], '.1f') + ', about ' + format(datum.ratio, '.1f') + ' times more'", "format(datum['2022'], '.1f') + ' (' + format(datum.ratio, '.1f') + '×)'");
    Object.assign(s.vconcat[1], { width: 245, height: 190 });
    s.vconcat[1].width = 232;
    s.vconcat[1].encoding.x.scale.range = [80, 156];             // the slope's two columns were placed in pixels
  },
  'bump.vl.json': s => {
    s.width = 250; s.height = 200;
    s.layer[1].mark.strokeWidth = 2; s.layer[3].mark.size = 12; s.layer[3].mark.strokeWidth = 0;       // 37 seasons in 250px: finer lines and dots
  },
  'streamgraph.vl.json': s => {
    s.width = 310; s.height = 240;
    // keep the dotted year rules, drop their text (four labels would sit on top of each other); the tooltip has the numbers
    s.layer[2].layer = s.layer[2].layer.filter(l => !(l.mark && l.mark.type === 'text'));
    walkSpec(s, n => { if (n.axis && Array.isArray(n.axis.values)) n.axis.values = [1989, 1999, 2009, 2019]; });
  },
  'diverging.vl.json': s => {
    s.width = 240;
    s.encoding.x.scale.domain = [-105, 20];                             // room on the left for the bar labels
  }
};
