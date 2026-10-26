(function () {
  var S = window.EnergySite;
  var MN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var pct = function (x) { return (x * 100).toFixed(1) + '%'; };
  var pct0 = function (x) { return (x * 100).toFixed(1); };
  var name = function (k) { return MN[+k.slice(5) - 1] + ' ' + k.slice(0, 4); };
  var card = function (title, text, cls) { return '<div class="card finding ' + (cls || '') + '"><h3>' + title + '</h3><p style="color:var(--ink)">' + text + '</p></div>'; };

  Promise.all([S.get('/api/insights'), S.get('/api/data')]).then(function (r) {
    var i = r[0], d = r[1], x = i.extra;
    var tot = d.peakOff.map(function (m) { return m.peak + m.offpeak; });
    var y = i.yearUnits, sc = x.slabCost;
    var findings = [
      card('Regional demand', '<b>' + i.region.top.name + '</b> uses the most power with ' + S.fmt(i.region.top.units) + ' units (' + pct(i.region.topShare) + ' of the total). <b>' + i.region.bottom.name + '</b> uses the least with ' + S.fmt(i.region.bottom.units) + ' units (' + pct(i.region.bottomShare) + ').'),
      card('Who drives billing', i.billByType.map(function (b) { return b.name + ' ' + pct(b.share); }).join(', ') + ' of total billing. Residential consumers bring in the most.', 'o'),
      card('Peak-hour load', 'Peak hours account for <b>' + pct(i.peakShare) + '</b> of all units consumed.', 't'),
      card('Tariff slabs', 'The ' + i.topSlabName + ' slab holds ' + pct(i.topSlabUnitShare) + ' of units and ' + pct(i.billBySlab[0].share) + ' of total billing.', 'g'),
      card('Monthly pattern', 'Adding each calendar month across both years gives a steady ' + S.fmt(Math.min.apply(null, tot)) + ' to ' + S.fmt(Math.max.apply(null, tot)) + ' units. The highest single month is ' + name(i.highest.key) + ' (' + S.fmt(i.highest.units) + ') and the lowest is ' + name(i.lowest.key) + ' (' + S.fmt(i.lowest.units) + ').'),
      card('Year on year', y[0].year + ' and ' + y[1].year + ' are almost identical: ' + S.fmt(y[0].units) + ' vs ' + S.fmt(y[1].units) + ' units.', 'o'),
      card('Cost per unit', 'The average cost is about ₹' + i.avgCostPerUnit.toFixed(2) + ' per unit. Every consumer is between ₹' + i.costMin.toFixed(2) + ' and ₹' + i.costMax.toFixed(2) + '.', 't'),
      card('Top consumers', 'The highest consumer, ' + x.topConsumer.name + ', uses ' + S.fmt(x.topConsumer.units) + ' units, ' + pct0(x.topConsumer.vsAvg) + '% above the consumer average. The lowest, ' + x.bottomConsumer.name + ', is ' + pct0(-x.bottomConsumer.vsAvg) + '% below it, so no single consumer dominates.', 'g')
    ];
    var recs = [
      card('1. Treat peak load as a system-wide matter', 'Peak share stays between ' + pct(x.monthPeak.min) + ' and ' + pct(x.monthPeak.max) + ' in every month, ' + pct(x.regionPeak.min) + ' to ' + pct(x.regionPeak.max) + ' across regions and ' + pct(x.typePeak.min) + ' to ' + pct(x.typePeak.max) + ' across consumer types. Because it is so uniform, peak-reduction efforts would apply across all regions and consumer types rather than to one segment.'),
      card('2. Plan regional supply by number of consumers', 'Average units per reading are similar in every region (' + Math.round(x.regionPerReading.min) + ' to ' + Math.round(x.regionPerReading.max) + '). Regional totals differ mainly because of how many consumers each region has (for example ' + x.topRegionConsumers + ' in ' + i.region.top.name + ' vs ' + x.bottomRegionConsumers + ' in ' + i.region.bottom.name + '), so connection counts are a good guide for capacity planning.', 'o'),
      card('3. Focus efficiency effort on the highest slab', 'The ' + i.topSlabName + ' slab carries ' + pct(i.topSlabUnitShare) + ' of units and ' + pct(i.billBySlab[0].share) + ' of billing, at ₹' + sc[2].costPerUnit.toFixed(2) + ' per unit compared with ₹' + sc[0].costPerUnit.toFixed(2) + ' in the 0-100 slab. Reducing use in high-consumption readings would lower both load and bills the most.', 't'),
      card('4. Use a steady baseline for demand forecasting', 'Monthly totals stay in a narrow band and the two years differ by only ' + pct(Math.abs(y[1].units - y[0].units) / y[0].units) + ', so a simple, stable baseline is a reasonable starting point for planning. More years of data would be needed to confirm seasonal patterns.', 'g')
    ];
    document.getElementById('findings').innerHTML = findings.join('');
    document.getElementById('recs').innerHTML = recs.join('');
  }).catch(function () {
    document.getElementById('findings').innerHTML = '<div class="card">Could not load insights. Is the server running? (npm start)</div>';
  });
})();
