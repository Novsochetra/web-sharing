const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { exec } = require('child_process');
const { PORT, TOKEN, UPLOADS_DIR } = require('./config');
const { ensureUploadsDir } = require('./utils/files');
const { getLocalIP } = require('./utils/ip');
const { requireToken } = require('./middleware/token');
const qrRoute = require('./routes/qrcode');
const infoRoute = require('./routes/info');
const uploadRoute = require('./routes/upload');
const textRoute = require('./routes/text');
const itemsRoute = require('./routes/items');
const downloadRoute = require('./routes/download');
const socketAuth = require('./socket/auth');
const socketEvents = require('./socket/events');

ensureUploadsDir();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(requireToken);

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

app.use('/api/qrcode', qrRoute.createRouter());
app.use('/api/info', infoRoute.createRouter());
app.use('/api/upload', uploadRoute.createRouter(io));
app.use('/api/text', textRoute.createRouter(io));
app.use('/api/items', itemsRoute.createRouter(io));
app.use('/api/download', downloadRoute.createRouter());

io.use(socketAuth.createMiddleware());
socketEvents.register(io);

server.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  const url = `http://${ip}:${PORT}/?token=${TOKEN}`;
  console.log('\n  WebShare is running!\n');
  console.log(`  Open: ${url}\n`);
  console.log('  Share the QR code or URL with nearby devices.\n');

  const cmd =
    process.platform === 'darwin'
      ? `open "${url}"`
      : process.platform === 'win32'
        ? `start "" "${url}"`
        : `xdg-open "${url}"`;
  exec(cmd, () => {});
});
