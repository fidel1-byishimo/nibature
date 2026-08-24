require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4000;
const PUBLIC_DIR = path.join(__dirname, 'src');
const DATA_DIR = path.join(__dirname, 'data');
const MAX_BODY_SIZE = 100 * 1024;
const MIME_TYPES = { '.css': 'text/css', '.html': 'text/html', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.js': 'application/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

function send(res, status, body, contentType = 'application/json') {
  res.writeHead(status, { 'Content-Type': `${contentType}; charset=utf-8`, 'X-Content-Type-Options': 'nosniff' });
  res.end(contentType === 'application/json' ? JSON.stringify(body) : body);
}

function cleanText(value, limit) {
  return typeof value === 'string' ? value.trim().replace(/[<>]/g, '').slice(0, limit) : '';
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > MAX_BODY_SIZE) reject(new Error('Request is too large.'));
    });
    req.on('end', () => { try { resolve(JSON.parse(body || '{}')); } catch { reject(new Error('Invalid JSON.')); } });
    req.on('error', reject);
  });
}

function saveRecord(filename, record) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const file = path.join(DATA_DIR, filename);
  let items = [];
  try { items = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* first record or invalid old file */ }
  items.push(record);
  fs.writeFileSync(file, JSON.stringify(items, null, 2));
}

function serveStatic(res, pathname) {
  const relativePath = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).replace(/^[/\\]+/, '');
  const filePath = path.resolve(PUBLIC_DIR, relativePath);
  if (!filePath.startsWith(PUBLIC_DIR)) return send(res, 403, { message: 'Forbidden.' });
  fs.readFile(filePath, (error, content) => {
    if (error) return send(res, 404, { message: 'Page not found.' });
    send(res, 200, content, MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'GET' && url.pathname === '/api/health') return send(res, 200, { status: 'ok' });
  if (req.method === 'POST' && url.pathname === '/api/contact') {
    try {
      const body = await readJson(req);
      const name = cleanText(body.name, 100), email = cleanText(body.email, 254), message = cleanText(body.message, 5000);
      if (!name || !/^\S+@\S+\.\S+$/.test(email) || !message) return send(res, 400, { message: 'Please provide a name, valid email, and message.' });
      saveRecord('contacts.json', { name, email, message, receivedAt: new Date().toISOString() });
      return send(res, 201, { message: 'Thank you — your message has been received.' });
    } catch (error) { return send(res, 400, { message: error.message || 'Unable to process this request.' }); }
  }
  if (req.method === 'POST' && url.pathname === '/api/donation-intentions') {
    try {
      const body = await readJson(req), amount = cleanText(body.amount, 40);
      if (!amount) return send(res, 400, { message: 'Please choose a donation amount.' });
      saveRecord('donation-intentions.json', { amount, receivedAt: new Date().toISOString() });
      return send(res, 201, { message: 'Thank you for your intention to give. Please contact us for secure payment details.' });
    } catch (error) { return send(res, 400, { message: error.message || 'Unable to process this request.' }); }
  }
  if (req.method === 'GET' || req.method === 'HEAD') return serveStatic(res, url.pathname);
  send(res, 405, { message: 'Method not allowed.' });
});

server.listen(PORT, () => console.log(`Nibature Ministries is running at http://localhost:${PORT}`));
