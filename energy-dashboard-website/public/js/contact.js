(function () {
  var form = document.getElementById('cform');
  var result = document.getElementById('result');
  function check(v) {
    var e = {};
    if (v.name.length < 2 || v.name.length > 80) e.name = 'Name must be 2 to 80 characters.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) e.email = 'Please enter a valid email address.';
    if (v.message.length < 10 || v.message.length > 1000) e.message = 'Message must be 10 to 1000 characters.';
    return e;
  }
  function show(e) {
    ['name', 'email', 'message'].forEach(function (k) { document.getElementById('e-' + k).textContent = e[k] || ''; });
  }
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    result.innerHTML = '';
    var v = { name: form.name.value.trim(), email: form.email.value.trim(), message: form.message.value.trim() };
    var e = check(v); show(e);
    if (Object.keys(e).length) return;
    fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(v) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j.ok) { result.innerHTML = '<div class="ok">Thank you! Your message was saved.</div>'; form.reset(); }
        else { show(j.errors || {}); if (j.errors && j.errors.form) result.textContent = j.errors.form; }
      }).catch(function () { result.textContent = 'Could not reach the server.'; });
  });
})();
