const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

const PORT = process.env.PORT || 3000;
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 500 * 1024 * 1024;
const TOKEN = crypto.randomBytes(8).toString('hex');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const UPLOADS_DIR = path.join(__dirname, 'uploads', TOKEN);
const DATA_FILE = path.join(UPLOADS_DIR, 'data.json');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (_) {}
  return { items: [] };
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

function broadcastItems() {
  io.emit('items-updated', loadData().items);
}

function parseCookies(header) {
  const map = {};
  if (!header) return map;
  header.split(';').forEach((c) => {
    const [n, ...v] = c.trim().split('=');
    if (n) map[n] = decodeURIComponent(v.join('='));
  });
  return map;
}

const ACCESS_DENIED_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Access Denied</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0f1117;color:#e4e6ed}.box{text-align:center;padding:40px}h1{font-size:2rem;font-weight:700;margin-bottom:8px}p{color:#8b8fa3;font-size:0.9rem}</style>
</head><body><div class="box"><h1>Access Denied</h1><p>Invalid or missing token. Scan the QR code or use the full URL.</p></div></body></html>`;

function requireToken(req, res, next) {
  if (req.path.startsWith('/socket.io/')) return next();

  const staticExts = ['.css', '.js', '.map', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot'];
  if (staticExts.some(ext => req.path.toLowerCase().endsWith(ext))) return next();

  const cookies = parseCookies(req.headers.cookie || '');
  const fromCookie = cookies.token;
  const fromQuery = req.query.token;
  const valid = (fromCookie === TOKEN) || (fromQuery === TOKEN);

  if (valid) {
    if (fromCookie !== TOKEN) {
      res.cookie('token', TOKEN, { httpOnly: true, path: '/', sameSite: 'lax' });
    }
    return next();
  }

  res.status(403).type('html').send(ACCESS_DENIED_HTML);
}

app.use(requireToken);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
});

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

// QR code
app.get('/api/qrcode', async (_req, res) => {
  try {
    const ip = getLocalIP();
    const url = `http://${ip}:${PORT}/?token=${TOKEN}`;
    const qrDataUrl = await QRCode.toDataURL(url, { width: 320, margin: 2 });
    res.json({ url, qrcode: qrDataUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Server info
app.get('/api/info', (_req, res) => {
  res.json({ ip: getLocalIP(), port: PORT, token: TOKEN });
});

// Upload files
app.post('/api/upload', upload.array('files', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const data = loadData();
  const uploadIds = [];

  req.files.forEach((file) => {
    const id = path.parse(file.filename).name;
    data.items.push({
      id,
      type: 'file',
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      storedFilename: file.filename,
      textContent: null,
      timestamp: Date.now(),
    });
    uploadIds.push(id);
  });

  saveData(data);
  broadcastItems();
  res.json({ uploadIds });
});

// Send text
app.post('/api/text', (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'No text provided' });
  }

  const id = uuidv4();
  const data = loadData();
  data.items.push({
    id,
    type: 'text',
    originalName: null,
    size: Buffer.byteLength(text, 'utf8'),
    mimeType: 'text/plain',
    storedFilename: null,
    textContent: text.trim(),
    timestamp: Date.now(),
  });

  saveData(data);
  broadcastItems();
  res.json({ uploadId: id });
});

// List all items
app.get('/api/items', (_req, res) => {
  res.json(loadData().items);
});

// Download file
app.get('/api/download/:id', (req, res) => {
  const { id } = req.params;
  const data = loadData();
  const item = data.items.find((i) => i.id === id && i.type === 'file');

  if (!item) {
    return res.status(404).json({ error: 'File not found' });
  }

  const filePath = path.join(UPLOADS_DIR, item.storedFilename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File missing on disk' });
  }

  res.download(filePath, item.originalName);
});

// Delete single item
app.delete('/api/items/:id', (req, res) => {
  const { id } = req.params;
  const data = loadData();
  const idx = data.items.findIndex((i) => i.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const item = data.items[idx];
  if (item.type === 'file' && item.storedFilename) {
    const filePath = path.join(UPLOADS_DIR, item.storedFilename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  data.items.splice(idx, 1);
  saveData(data);
  broadcastItems();
  res.json({ success: true });
});

// Clear all items
app.delete('/api/items', (_req, res) => {
  if (fs.existsSync(UPLOADS_DIR)) {
    fs.readdirSync(UPLOADS_DIR).forEach((f) => {
      if (f !== 'data.json') fs.unlinkSync(path.join(UPLOADS_DIR, f));
    });
  }

  saveData({ items: [] });
  broadcastItems();
  res.json({ success: true });
});

io.use((socket, next) => {
  const cookies = parseCookies(socket.handshake.headers.cookie || '');
  if (cookies.token === TOKEN) return next();

  const queryToken = socket.handshake.query.token;
  if (queryToken === TOKEN) return next();

  next(new Error('Unauthorized'));
});

io.on('connection', (socket) => {
  socket.emit('items-updated', loadData().items);
  socket.broadcast.emit('user-connected');

  socket.on('disconnect', () => {
    socket.broadcast.emit('user-disconnected');
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  const url = `http://${ip}:${PORT}/?token=${TOKEN}`;
  console.log(`\n  WebShare is running!\n`);
  console.log(`  Open: ${url}\n`);
  console.log(`  Share the QR code or URL with nearby devices.\n`);

  const { exec } = require('child_process');
  const cmd = process.platform === 'darwin'
    ? `open "${url}"`
    : process.platform === 'win32'
      ? `start "" "${url}"`
      : `xdg-open "${url}"`;
  exec(cmd, () => {});
});
