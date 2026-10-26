
(function () {
  var form = document.getElementById('cform');
  var result = document.getElementById('result');

  if (!form || !result) return;

  function check(v) {
    var e = {};

    if (v.name.length < 2 || v.name.length > 80) {
      e.name = 'Name must be 2 to 80 characters.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) {
      e.email = 'Please enter a valid email address.';
    }

    if (v.message.length < 10 || v.message.length > 1000) {
      e.message = 'Message must be 10 to 1000 characters.';
    }

    return e;
  }

  function show(e) {
    ['name', 'email', 'message'].forEach(function (k) {
      var el = document.getElementById('e-' + k);
      if (el) el.textContent = e[k] || '';
    });
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    result.textContent = '';

    var v = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      message: form.message.value.trim()
    };

    var e = check(v);
    show(e);

    if (Object.keys(e).length) return;

    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(v)
    })
      .then(function (r) {
        return r.json().then(function (j) {
          if (!r.ok) {
            throw new Error(j.message || 'Submission failed.');
          }
          return j;
        });
      })
      .then(function (j) {
        if (j.success || j.ok) {
          result.textContent =
            j.message || 'Thank you! Your message was received.';
          form.reset();
        } else {
          result.textContent =
            j.message || 'Could not send your message.';
          show(j.errors || {});
        }
      })
      .catch(function (err) {
        result.textContent =
          err.message || 'Could not reach the server.';
      });
  });
})();
