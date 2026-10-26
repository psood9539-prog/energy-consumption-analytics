(function () {
  var S = window.EnergySite;
  S.get('/api/summary').then(function (s) {
    var cards = [['Units consumed', S.fmt(s.totalUnits), ''], ['Total bill', S.fmt(s.totalBill), '₹'],
      ['Avg bill per reading', S.fmt(s.avgBillPerReading), '₹'], ['Active consumers', s.activeConsumers, ''],
      ['Peak share', s.peakShare.toFixed(2), 'of all units']];
    document.getElementById('kpis').innerHTML = cards.map(function (c) {
      return '<div class="card kpi"><div class="label">' + c[0] + '</div><div class="value">' + (c[2] === '₹' ? '₹' : '') + c[1] + '</div>' +
        (c[2] && c[2] !== '₹' ? '<small>' + c[2] + '</small>' : '') + '</div>';
    }).join('');
  }).catch(function () {
    document.getElementById('kpis').innerHTML = '<div class="card" style="grid-column:1/-1">Could not load numbers. Is the server running? (npm start)</div>';
  });
})();
