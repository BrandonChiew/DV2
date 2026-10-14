"""Recompute every headline number printed on the page from data/processed and compare it with the text.

Run from the repository root:  python3 data/scripts/check_numbers.py
It prints one line per claim and exits with an error if any number on the page disagrees with the data.
"""
import csv
import pathlib
import sys
from statistics import mean

P = pathlib.Path(__file__).resolve().parents[1] / 'processed'
def rows(name): return list(csv.DictReader(open(P / name, encoding='utf-8')))

crops, rain, income, drivers = rows('crops_by_state.csv'), rows('rain_vs_yield.csv'), rows('farm_income.csv'), rows('climate_drivers.csv')
enso = {int(r['year']): r['enso'] for r in drivers}
inc = {int(r['year']): float(r['real_net_value_m']) / 1000 for r in income}

def wheat(state, year, field='production_kt'):
    return float([r for r in crops if r['state_code'] == state and r['crop'] == 'wheat' and int(r['year']) == year][0][field])
def crop(state, c, year, field='production_kt'):
    return float([r for r in crops if r['state_code'] == state and r['crop'] == c and int(r['year']) == year][0][field])
def prev5(fn, year): return mean(fn(y) for y in range(year - 5, year))
def pct_vs_prev(fn, year): return 100 * (fn(year) / prev5(fn, year) - 1)
def corr(state):
    rs = [r for r in rain if r['state_code'] == state and r['wheat_yield_t_ha'] and int(r['year']) <= 2025]
    a = [float(r['rain_cool_pct_of_avg']) for r in rs]; b = [float(r['yield_pct_of_avg']) for r in rs]
    ma, mb = mean(a), mean(b)
    return sum((x - ma) * (y - mb) for x, y in zip(a, b)) / (sum((x - ma) ** 2 for x in a) * sum((y - mb) ** 2 for y in b)) ** .5
def nsw(year, field): return float([r for r in rain if r['state_code'] == 'NSW' and int(r['year']) == year][0][field])

claims = []   # (what the page says, value it says, value from the data, tolerance)
def claim(text, said, got, tol=0.05): claims.append((text, said, got, tol))

# guess game and headline harvests (Mt)
for y, said in ((2016, 31.8), (2019, 14.5), (2022, 40.5), (2002, 10.1), (2006, 10.8), (2025, 36.0), (2026, 29.9)):
    claim(f'national wheat {y}, Mt', said, wheat('AUS', y) / 1000)
claim('2019 is less than half of 2016, % fall', 54, 100 * (1 - wheat('AUS', 2019) / wheat('AUS', 2016)), 0.5)

# El Nino / La Nina
for phase, said, n in (('El Nino', 16.2, 9), ('Neutral', 22.0, 16), ('La Nina', 27.0, 12)):
    ys = [y for y in enso if enso[y] == phase]
    claim(f'{phase} years averaged, Mt', said, mean(wheat('AUS', y) / 1000 for y in ys)); claim(f'number of {phase} years', n, len(ys), 0)

# New South Wales 2019 and 2022
claim('NSW 2019 rain, % of normal', 40.5, nsw(2019, 'rain_cool_pct_of_avg'), 0.6); claim('NSW 2019 yield, % of normal', 41, nsw(2019, 'yield_pct_of_avg'), 0.6)
claim('NSW 2022 rain, % of normal', 170, nsw(2022, 'rain_cool_pct_of_avg'), 0.6); claim('NSW 2022 yield, % of normal', 146, nsw(2022, 'yield_pct_of_avg'), 0.6)
claim('NSW yield 2019, t/ha', 0.8, wheat('NSW', 2019, 'yield_t_ha'), 0.06); claim('NSW yield 2022, t/ha', 3.0, wheat('NSW', 2022, 'yield_t_ha'), 0.06)
claim('NSW yield ratio 2022/2019', 3.5, wheat('NSW', 2022, 'yield_t_ha') / wheat('NSW', 2019, 'yield_t_ha'), 0.1)

# rain against yield, correlation by state
for st, said in (('NSW', .62), ('VIC', .61), ('SA', .59), ('QLD', .48), ('WA', .24)): claim(f'correlation of rain and yield, {st}', said, corr(st), 0.006)

# area sown and yield against the five years before
for y, a, yl in ((2002, -3, -53), (2006, -4, -47), (2019, -14, -27), (2022, 15, 49)):
    claim(f'{y} area sown vs previous five years, %', a, pct_vs_prev(lambda t: wheat('AUS', t, 'area_kha'), y), 0.6)
    claim(f'{y} yield vs previous five years, %', yl, pct_vs_prev(lambda t: wheat('AUS', t, 'yield_t_ha'), y), 0.6)

# diverging bars: production against the five years before
for c, vals in (('wheat', (-55, -50, -38)), ('barley', (-41, -46, 3)), ('canola', (-49, -61, -32))):
    for y, said in zip((2002, 2006, 2019), vals): claim(f'{c} {y} vs previous five years, %', said, pct_vs_prev(lambda t: crop('AUS', c, t), y), 0.6)
claim('barley 2019, Victoria, % vs previous five years', 73, pct_vs_prev(lambda t: crop('VIC', 'barley', t), 2019), 0.6)
claim('barley 2019, NSW, % vs previous five years', -51, pct_vs_prev(lambda t: crop('NSW', 'barley', t), 2019), 0.6)

# farm income, billions in today's dollars
claim('income 2019, $b', 10.3, inc[2019], 0.05); claim('income 2018, $b', 11.0, inc[2018], 0.05)
claim('income 2002 as % of 2001', 45, 100 * inc[2002] / inc[2001], 0.6); claim('income 2006 as % of 2005', 49, 100 * inc[2006] / inc[2005], 0.6)
claim('record income year', 2021, max(inc, key=inc.get), 0); claim('record income, $b', 25.2, inc[2021], 0.05); claim('income 1994, $b', 0.1, inc[1994], 0.05)
claim('record wheat year', 2022, max(range(1989, 2026), key=lambda y: wheat('AUS', y)), 0)

# ranks by wheat grown, mainland states
states = ['WA', 'NSW', 'SA', 'VIC', 'QLD']
def rank(y): return sorted(states, key=lambda s: -wheat(s, y))
claim('WA first in N of 37 seasons', 29, sum(rank(y)[0] == 'WA' for y in range(1989, 2026)), 0)
claim('NSW first in N seasons', 8, sum(rank(y)[0] == 'NSW' for y in range(1989, 2026)), 0)
claim('NSW fourth in 1994, 2018, 2019 (count)', 3, sum(rank(y).index('NSW') == 3 for y in range(1989, 2026)), 0)
for st, said in (('WA', 5.8), ('VIC', 3.7), ('SA', 2.7), ('NSW', 1.8), ('QLD', 0.4)): claim(f'{st} wheat 2019, Mt', said, wheat(st, 2019) / 1000)
for st, said in (('WA', 14.5), ('NSW', 10.6), ('SA', 7.3), ('VIC', 5.4), ('QLD', 2.6)): claim(f'{st} wheat 2022, Mt', said, wheat(st, 2022) / 1000)
for st, said in (('WA', 9.8), ('NSW', 8.1), ('SA', 4.3), ('VIC', 3.9), ('QLD', 1.4)): claim(f'{st} wheat 2015-24 average, Mt', said, mean(wheat(st, y) / 1000 for y in range(2015, 2025)))

# scale for readers in Malaysia (figures from the cited sources, not from the CSVs)
claim('Australia area / Malaysia area', 23.3, 7688287 / 329847, 0.05)
claim('2019 national rain, mm (BoM note in climate_drivers.csv)', 277.6, float(__import__('re').search(r'\(([\d.]+) mm\)', [r for r in drivers if r['year'] == '2019'][0]['note']).group(1)), 0)

bad = 0
for text, said, got, tol in claims:
    ok = abs(said - got) <= tol
    bad += not ok
    print(f"{'ok ' if ok else 'BAD'}  {text:55s} page says {said:>8}   data gives {got:8.2f}")
print(f"\n{len(claims) - bad} of {len(claims)} numbers match the data")
sys.exit(1 if bad else 0)
