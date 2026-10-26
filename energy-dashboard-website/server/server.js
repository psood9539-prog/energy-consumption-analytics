// Simple full-stack server using ONLY built-in Node.js modules.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { loadRows, buildData, buildInsights } = require('./data');

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, '..', 'public');
const MESSAGES_FILE = path.join(__dirname, '..', 'data', 'messages.json');

const rows = loadRows();
console.log('Loaded ' + rows.length + ' rows from data/clean_data.csv');

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json' };

function sendJSON(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

function validateContact(b) {
  const errors = {};
  const name = String(b.name || '').trim();
  const email = String(b.email || '').trim();
  const message = String(b.message || '').trim();
  if (name.length < 2 || name.length > 80) errors.name = 'Name must be 2 to 80 characters.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 120) errors.email = 'Please enter a valid email address.';
  if (message.length < 10 || message.length > 1000) errors.message = 'Message must be 10 to 1000 characters.';
  return { errors, clean: { name, email, message } };
}

function saveMessage(msg) {
  let list = [];
  try { list = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8')); } catch (e) { list = []; }
  list.push(Object.assign({ id: list.length + 1, savedAt: new Date().toISOString() }, msg));
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(list, null, 2));
}

function handleApi(req, res, url) {
  const q = Object.fromEntries(url.searchParams);
  if (req.method === 'GET' && url.pathname === '/api/data') return sendJSON(res, 200, buildData(rows, q));
  if (req.method === 'GET' && url.pathname === '/api/summary') return sendJSON(res, 200, buildData(rows, q).summary);
  if (req.method === 'GET' && url.pathname === '/api/insights') return sendJSON(res, 200, buildInsights(rows));
  if (req.method === 'POST' && url.pathname === '/api/contact') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 20000) req.destroy(); });
    req.on('end', () => {
      let parsed;
      try { parsed = JSON.parse(body); } catch (e) { return sendJSON(res, 400, { ok: false, errors: { form: 'Invalid request.' } }); }
      const { errors, clean } = validateContact(parsed);
      if (Object.keys(errors).length) return sendJSON(res, 400, { ok: false, errors });
      try { saveMessage(clean); } catch (e) { return sendJSON(res, 500, { ok: false, errors: { form: 'Could not save message.' } }); }
      sendJSON(res, 200, { ok: true });
    });
    return;
  }
  sendJSON(res, 404, { error: 'Not found' });
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) return handleApi(req, res, url);
  if (req.method !== 'GET') { res.writeHead(405); return res.end('Method not allowed'); }
  let p = decodeURIComponent(url.pathname);
  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(PUBLIC, p));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('404 Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(buf);
  });
}).listen(PORT, '0.0.0.0', () => {
  console.log('Website running at http://localhost:' + PORT);
  console.log('On your phone (same Wi-Fi): http://YOUR-LAPTOP-IP:' + PORT);
});
