require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 4000;
const PUBLIC_DIR = path.join(__dirname, 'src');
const DATA_DIR = process.env.STORAGE_DIR || path.join(__dirname, 'storage');
const MAX_BODY_SIZE = 7 * 1024 * 1024;
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const GALLERY_FILE = path.join(DATA_DIR, 'gallery.json');
const MIME_TYPES = { '.css': 'text/css', '.html': 'text/html', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.js': 'application/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' };

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

function readGallery() {
  try { return JSON.parse(fs.readFileSync(GALLERY_FILE, 'utf8')); } catch { return []; }
}

function writeGallery(items) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(GALLERY_FILE, JSON.stringify(items, null, 2));
}

function isAdmin(req) {
  const configuredUser = process.env.ADMIN_USERNAME;
  const configuredPassword = process.env.ADMIN_PASSWORD;
  const header = req.headers.authorization || '';
  if (!configuredUser || !configuredPassword || !header.startsWith('Basic ')) return false;
  const supplied = Buffer.from(header.slice(6), 'base64').toString('utf8');
  const expected = `${configuredUser}:${configuredPassword}`;
  const suppliedBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(expected);
  return suppliedBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(suppliedBuffer, expectedBuffer);
}

function requireAdmin(req, res) {
  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
    return send(res, 503, { message: 'Set ADMIN_USERNAME and ADMIN_PASSWORD in the hosting environment before using Burakeye.' });
  }
  if (isAdmin(req)) return true;
  res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8', 'WWW-Authenticate': 'Basic realm="Burakeye"', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify({ message: 'Administrator sign-in required.' }));
  return false;
}

function saveGalleryUpload(dataUrl, caption) {
  const matched = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl || '');
  if (!matched) throw new Error('Choose a JPG, PNG, or WebP image.');
  const image = Buffer.from(matched[2], 'base64');
  if (!image.length || image.length > 5 * 1024 * 1024) throw new Error('Images must be 5 MB or smaller.');
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[matched[1]];
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${extension}`;
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), image);
  const item = { id: crypto.randomUUID(), src: `uploads/${filename}`, alt: cleanText(caption, 160) || 'Nibature Ministries activity', caption: cleanText(caption, 160) || 'Ministry activity' };
  const gallery = readGallery();
  gallery.unshift(item);
  writeGallery(gallery);
  return item;
}

function serveStatic(res, pathname) {
  if (pathname.startsWith('/uploads/')) {
    const uploadPath = path.resolve(UPLOAD_DIR, decodeURIComponent(pathname.slice('/uploads/'.length)));
    if (!uploadPath.startsWith(UPLOAD_DIR)) return send(res, 403, { message: 'Forbidden.' });
    return fs.readFile(uploadPath, (error, content) => {
      if (error) return send(res, 404, { message: 'Image not found.' });
      send(res, 200, content, MIME_TYPES[path.extname(uploadPath).toLowerCase()] || 'application/octet-stream');
    });
  }
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
  if (req.method === 'GET' && url.pathname === '/api/gallery') return send(res, 200, { items: readGallery() });
  if (req.method === 'GET' && url.pathname === '/api/admin/gallery') {
    if (!requireAdmin(req, res)) return;
    return send(res, 200, { items: readGallery() });
  }
  if (req.method === 'POST' && url.pathname === '/api/contact') {
    try {
      const body = await readJson(req);
      const name = cleanText(body.name, 100), email = cleanText(body.email, 254), message = cleanText(body.message, 5000);
      if (!name || !/^\S+@\S+\.\S+$/.test(email) || !message) return send(res, 400, { message: 'Please provide a name, valid email, and message.' });
      saveRecord('contacts.json', { name, email, message, receivedAt: new Date().toISOString() });
      return send(res, 201, { message: 'Thank you — your message has been received.' });
    } catch (error) { return send(res, 400, { message: error.message || 'Unable to process this request.' }); }
  }
  if (req.method === 'POST' && url.pathname === '/api/admin/gallery') {
    if (!requireAdmin(req, res)) return;
    try {
      const body = await readJson(req);
      return send(res, 201, { item: saveGalleryUpload(body.image, body.caption) });
    } catch (error) { return send(res, 400, { message: error.message || 'Unable to upload this image.' }); }
  }
  if (req.method === 'DELETE' && url.pathname.startsWith('/api/admin/gallery/')) {
    if (!requireAdmin(req, res)) return;
    const id = decodeURIComponent(url.pathname.slice('/api/admin/gallery/'.length));
    const gallery = readGallery();
    const item = gallery.find((entry) => entry.id === id);
    if (!item) return send(res, 404, { message: 'Gallery image not found.' });
    const remaining = gallery.filter((entry) => entry.id !== id);
    writeGallery(remaining);
    const uploadPath = path.resolve(UPLOAD_DIR, path.basename(item.src));
    if (uploadPath.startsWith(UPLOAD_DIR) && fs.existsSync(uploadPath)) fs.unlinkSync(uploadPath);
    return send(res, 200, { message: 'Gallery image deleted.' });
  }
  if (req.method === 'GET' || req.method === 'HEAD') return serveStatic(res, url.pathname);
  send(res, 405, { message: 'Method not allowed.' });
});

server.listen(PORT, () => console.log(`Nibature Ministries is running at http://localhost:${PORT}`));
