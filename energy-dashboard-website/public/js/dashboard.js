(function () {
  var S = window.EnergySite;
  var charts = {};
  var ids = { region: 'f-region', type: 'f-type', slab: 'f-slab', year: 'f-year' };
  var BLUE = '#1e88e5', NAVY = '#1a2f9e', ORANGE = '#ef6c3a', YELLOW = '#efe29a', LIGHT = '#6a9de0';

  function q() {
    var p = new URLSearchParams();
    Object.keys(ids).forEach(function (k) { var v = document.getElementById(ids[k]).value; if (v) p.set(k, v); });
    return p.toString();
  }
  function fillSelect(id, list) {
    var sel = document.getElementById(id);
    if (sel.options.length > 1) return;
    list.forEach(function (v) { var o = document.createElement('option'); o.value = v; o.textContent = v; sel.appendChild(o); });
  }
  function draw(key, canvasId, config) {
    if (charts[key]) charts[key].destroy();
    charts[key] = new Chart(document.getElementById(canvasId), config);
  }
  function axisTitle(t) { return { display: true, text: t }; }
  var unitsTick = function (v) { return S.fmt(v); };
  var tipUnits = { callbacks: { label: function (c) { return ' ' + S.n(c.parsed.x !== undefined && c.chart.options.indexAxis === 'y' ? c.parsed.x : c.parsed.y) + ' units'; } } };
  var monthLabel = function (k) { var m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; return m[+k.slice(5) - 1] + ' ' + k.slice(2, 4); };

  function kpis(s) {
    var c = [['Units consumed', S.fmt(s.totalUnits)], ['Sum of total bill', '₹' + S.fmt(s.totalBill)], ['Avg bill per reading', '₹' + S.fmt(s.avgBillPerReading)],
      ['Active consumers', s.activeConsumers], ['Peak share', s.peakShare.toFixed(2)]];
    document.getElementById('kpis').innerHTML = c.map(function (x) {
      return '<div class="card kpi"><div class="label">' + x[0] + '</div><div class="value">' + x[1] + '</div></div>';
    }).join('');
  }

  function render(d) {
    kpis(d.summary);
    var hbar = function (list, color, ylab) {
      return { type: 'bar', data: { labels: list.map(function (x) { return x.name; }), datasets: [{ data: list.map(function (x) { return x.units; }), backgroundColor: color }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: tipUnits },
          scales: { x: { title: axisTitle('Total units'), ticks: { callback: unitsTick } }, y: { title: axisTitle(ylab) } } } };
    };
    draw('monthly', 'c-monthly', { type: 'line', data: { labels: d.monthly.map(function (x) { return monthLabel(x.key); }),
      datasets: [{ data: d.monthly.map(function (x) { return x.units; }), borderColor: BLUE, backgroundColor: 'rgba(30,136,229,.3)', fill: true, tension: .35, pointRadius: 2 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: tipUnits },
        scales: { x: { title: axisTitle('Month') }, y: { title: axisTitle('Total units'), ticks: { callback: unitsTick } } } } });
    draw('type', 'c-type', { type: 'doughnut', data: { labels: d.typeSplit.map(function (x) { return x.name; }),
      datasets: [{ data: d.typeSplit.map(function (x) { return x.units; }), backgroundColor: [BLUE, NAVY, ORANGE] }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'right' },
        tooltip: { callbacks: { label: function (c) { var t = c.dataset.data.reduce(function (a, b) { return a + b; }, 0); return ' ' + c.label + ': ' + S.n(c.parsed) + ' units (' + (c.parsed / t * 100).toFixed(2) + '%)'; } } } } } });
    draw('peak', 'c-peak', { type: 'bar', data: { labels: d.peakOff.map(function (x) { return x.month; }), datasets: [
      { label: 'Peak units', data: d.peakOff.map(function (x) { return x.peak; }), backgroundColor: YELLOW },
      { label: 'Off-peak units', data: d.peakOff.map(function (x) { return x.offpeak; }), backgroundColor: ORANGE }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { tooltip: { callbacks: { label: function (c) { return ' ' + c.dataset.label + ': ' + S.n(c.parsed.y); } } } },
        scales: { x: { stacked: true, title: axisTitle('Month') }, y: { stacked: true, title: axisTitle('Units'), ticks: { callback: unitsTick } } } } });
    draw('region', 'c-region', hbar(d.byRegion, LIGHT, 'Region'));
    draw('slab', 'c-slab', { type: 'bar', data: { labels: d.bySlab.map(function (x) { return x.name; }), datasets: [{ data: d.bySlab.map(function (x) { return x.units; }), backgroundColor: '#3d85c6' }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: tipUnits },
        scales: { x: { title: axisTitle('Tariff slab') }, y: { title: axisTitle('Total units'), ticks: { callback: unitsTick } } } } });
    draw('top', 'c-top', hbar(d.topConsumers, '#f0a060', 'Consumer ID'));
  }

  function load() {
    var status = document.getElementById('status');
    status.hidden = false; status.innerHTML = '<div class="spinner"></div>Loading dashboard data…';
    S.get('/api/data?' + q()).then(function (d) {
      fillSelect(ids.region, d.filters.regions); fillSelect(ids.type, d.filters.types);
      fillSelect(ids.slab, d.filters.slabs); fillSelect(ids.year, d.filters.years);
      status.hidden = true;
      if (typeof Chart === 'undefined') {
        kpis(d.summary);
        status.hidden = false; status.textContent = 'Charts could not load (Chart.js needs internet). The key numbers above are still correct.';
        return;
      }
      document.getElementById('charts').hidden = false;
      render(d);
    }).catch(function () {
      status.textContent = 'Could not load data. Is the server running? (npm start)';
    });
  }
  Object.keys(ids).forEach(function (k) { document.getElementById(ids[k]).addEventListener('change', load); });
  document.getElementById('reset').addEventListener('click', function () {
    Object.keys(ids).forEach(function (k) { document.getElementById(ids[k]).value = ''; }); load();
  });
  load();
})();
