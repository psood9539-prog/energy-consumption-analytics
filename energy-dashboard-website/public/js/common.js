// Adds the navbar and footer to every page, plus small shared helpers.
(function () {
  var pages = [['index.html', 'Home'], ['about.html', 'About Project'], ['dashboard.html', 'Dashboard'],
    ['insights.html', 'Insights'], ['method.html', 'Data & Method'], ['me.html', 'About Me'], ['contact.html', 'Contact']];
  var current = location.pathname.split('/').pop() || 'index.html';
  var links = pages.map(function (p) {
    return '<li><a href="' + p[0] + '"' + (p[0] === current ? ' class="active"' : '') + '>' + p[1] + '</a></li>';
  }).join('');
  document.getElementById('site-header').innerHTML =
    '<header class="nav"><div class="wrap"><a class="brand" href="index.html"><i>⚡</i>Energy Consumption Analytics</a>' +
    '<button class="menu-btn" id="menuBtn" aria-label="Menu">☰ Menu</button><ul id="menuList">' + links + '</ul></div></header>';
  var foot = pages.map(function (p) { return '<a href="' + p[0] + '">' + p[1] + '</a>'; }).join('');
  document.getElementById('site-footer').innerHTML =
    '<footer><div class="wrap"><div class="row"><div><div class="dev">Developed by Priyal Sood</div>Energy Consumption Analytics · Dashboard project</div><nav>' + foot + '</nav></div>' +
    '<div class="small">Data: Kaggle energy consumption dataset (cleaned file: clean_data.csv, 60,000 readings, Jan 2024 – Dec 2025).</div></div></footer>';
  document.getElementById('menuBtn').addEventListener('click', function () {
    document.getElementById('menuList').classList.toggle('open');
  });
  // Small helpers shared by other scripts (one single global name).
  window.EnergySite = {
    fmt: function (n) {
      var trim = function (s) { return s.indexOf('.') < 0 ? s : s.replace(/0+$/, '').replace(/\.$/, ''); };
      if (n >= 1e6) return trim((n / 1e6).toFixed(n >= 1e7 ? 0 : 2)) + 'M';
      if (n >= 1e3) return trim((n / 1e3).toFixed(n >= 1e5 ? 0 : 2)) + 'K';
      return String(Math.round(n));
    },
    n: function (n) { return Math.round(n).toLocaleString('en-IN'); },
    get: function (url) {
      return fetch(url).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
    }
  };
})();
