// Reads data/clean_data.csv and calculates everything the dashboard shows.
const fs = require('fs');
const path = require('path');

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function loadRows() {
  const text = fs.readFileSync(path.join(__dirname, '..', 'data', 'clean_data.csv'), 'utf8').replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/).filter(Boolean);
  const head = lines[0].split(',');
  const idx = (n) => head.indexOf(n);
  const I = { date: idx('Reading_Date'), units: idx('Units_Consumed'), peak: idx('Peak_Units'), off: idx('OffPeak_Units'),
    bill: idx('Total_Bill'), cons: idx('Consumer_ID'), type: idx('Consumer_Type'), region: idx('Region_Name'), slab: idx('Tariff_Slab') };
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const c = lines[i].split(',');
    rows.push({ date: c[I.date], year: c[I.date].slice(0, 4), month: parseInt(c[I.date].slice(5, 7), 10),
      units: +c[I.units], peak: +c[I.peak], off: +c[I.off], bill: +c[I.bill],
      consumer: c[I.cons], type: c[I.type], region: c[I.region], slab: c[I.slab] });
  }
  return rows;
}

function filterRows(rows, f) {
  return rows.filter((r) =>
    (!f.region || r.region === f.region) && (!f.type || r.type === f.type) &&
    (!f.slab || r.slab === f.slab) && (!f.year || r.year === f.year));
}

function sumBy(rows, keyFn, valFn) {
  const m = new Map();
  rows.forEach((r) => { const k = keyFn(r); m.set(k, (m.get(k) || 0) + valFn(r)); });
  return m;
}
const sortedEntries = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]);

function buildData(all, f) {
  const rows = filterRows(all, f);
  const units = rows.reduce((s, r) => s + r.units, 0);
  const bill = rows.reduce((s, r) => s + r.bill, 0);
  const peak = rows.reduce((s, r) => s + r.peak, 0);
  const summary = {
    readings: rows.length, totalUnits: units, totalBill: bill,
    avgBillPerReading: rows.length ? bill / rows.length : 0,
    activeConsumers: new Set(rows.map((r) => r.consumer)).size,
    peakShare: units ? peak / units : 0,
    avgCostPerUnit: units ? bill / units : 0
  };
  const monthlyMap = sumBy(rows, (r) => r.date.slice(0, 7), (r) => r.units);
  const monthly = [...monthlyMap.entries()].sort().map(([k, v]) => ({ key: k, units: v }));
  const typeSplit = sortedEntries(sumBy(rows, (r) => r.type, (r) => r.units)).map(([k, v]) => ({ name: k, units: v }));
  const peakMap = sumBy(rows, (r) => r.month, (r) => r.peak);
  const offMap = sumBy(rows, (r) => r.month, (r) => r.off);
  const peakOff = MONTHS.map((m, i) => ({ month: m, peak: peakMap.get(i + 1) || 0, offpeak: offMap.get(i + 1) || 0 }));
  const byRegion = sortedEntries(sumBy(rows, (r) => r.region, (r) => r.units)).map(([k, v]) => ({ name: k, units: v }));
  const bySlab = sortedEntries(sumBy(rows, (r) => r.slab, (r) => r.units)).map(([k, v]) => ({ name: k, units: v }));
  const topConsumers = sortedEntries(sumBy(rows, (r) => r.consumer, (r) => r.units)).slice(0, 10).map(([k, v]) => ({ name: k, units: v }));
  const uniq = (fn) => [...new Set(all.map(fn))].sort();
  const filters = { regions: uniq((r) => r.region), types: uniq((r) => r.type), slabs: uniq((r) => r.slab), years: uniq((r) => r.year) };
  return { summary, monthly, typeSplit, peakOff, byRegion, bySlab, topConsumers, filters };
}

// Numbers used on the Insights page (always calculated on ALL data).
function buildInsights(all) {
  const d = buildData(all, {});
  const t = d.summary.totalUnits;
  const bill = d.summary.totalBill;
  const billByType = sortedEntries(sumBy(all, (r) => r.type, (r) => r.bill)).map(([k, v]) => ({ name: k, bill: v, share: v / bill }));
  const billBySlab = sortedEntries(sumBy(all, (r) => r.slab, (r) => r.bill)).map(([k, v]) => ({ name: k, bill: v, share: v / bill }));
  const yearUnits = sortedEntries(sumBy(all, (r) => r.year, (r) => r.units)).sort();
  const m = d.monthly;
  const hi = m.reduce((a, b) => (b.units > a.units ? b : a));
  const lo = m.reduce((a, b) => (b.units < a.units ? b : a));
  const cb = sumBy(all, (r) => r.consumer, (r) => r.bill);
  const cu = sumBy(all, (r) => r.consumer, (r) => r.units);
  const perConsumer = [...cb.keys()].map((c) => cb.get(c) / cu.get(c));
  const slabUnits = d.bySlab[0];
  // Extra facts used for the data-supported recommendations.
  const grp = (keyFn) => {
    const g = {};
    all.forEach((r) => { const k = keyFn(r); const o = g[k] || (g[k] = { units: 0, peak: 0, bill: 0, n: 0, cons: new Set() }); o.units += r.units; o.peak += r.peak; o.bill += r.bill; o.n++; o.cons.add(r.consumer); });
    return Object.entries(g).map(([name, o]) => ({ name, units: o.units, peakShare: o.peak / o.units, perReading: o.units / o.n, costPerUnit: o.bill / o.units, consumers: o.cons.size }));
  };
  const rg = grp((r) => r.region), tg = grp((r) => r.type), mg = grp((r) => r.month), sg = grp((r) => r.slab);
  const range = (a, k) => ({ min: Math.min(...a.map((x) => x[k])), max: Math.max(...a.map((x) => x[k])) });
  const cons = sortedEntries(sumBy(all, (r) => r.consumer, (r) => r.units));
  const avgCons = t / cons.length;
  const byUnitsC = (a) => a.slice().sort((x, y) => y.units - x.units);
  return {
    extra: {
      regionPeak: range(rg, 'peakShare'), typePeak: range(tg, 'peakShare'), monthPeak: range(mg, 'peakShare'),
      regionPerReading: range(rg, 'perReading'), typePerReading: range(tg, 'perReading'),
      topRegionConsumers: byUnitsC(rg)[0].consumers, bottomRegionConsumers: byUnitsC(rg)[rg.length - 1].consumers,
      slabCost: sg.map((x) => ({ name: x.name, costPerUnit: x.costPerUnit })).sort((a, b) => a.name.localeCompare(b.name)),
      topConsumer: { name: cons[0][0], units: cons[0][1], vsAvg: cons[0][1] / avgCons - 1 },
      bottomConsumer: { name: cons[cons.length - 1][0], units: cons[cons.length - 1][1], vsAvg: cons[cons.length - 1][1] / avgCons - 1 }
    },
    totalUnits: t, region: { top: d.byRegion[0], bottom: d.byRegion[d.byRegion.length - 1], topShare: d.byRegion[0].units / t, bottomShare: d.byRegion[d.byRegion.length - 1].units / t },
    billByType, billBySlab, peakShare: d.summary.peakShare, topSlabUnitShare: slabUnits.units / t, topSlabName: slabUnits.name,
    monthlyMin: Math.min(...m.map((x) => x.units)), monthlyMax: Math.max(...m.map((x) => x.units)), highest: hi, lowest: lo,
    yearUnits: yearUnits.map(([y, u]) => ({ year: y, units: u })),
    avgCostPerUnit: d.summary.avgCostPerUnit, costMin: Math.min(...perConsumer), costMax: Math.max(...perConsumer)
  };
}

module.exports = { loadRows, buildData, buildInsights };
