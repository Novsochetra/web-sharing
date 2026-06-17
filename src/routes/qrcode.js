const QRCode = require('qrcode');
const { PORT, TOKEN } = require('../config');
const { getLocalIP } = require('../utils/ip');

function createRouter() {
  const router = require('express').Router();

  router.get('/', async (_req, res) => {
    try {
      const ip = getLocalIP();
      const url = `http://${ip}:${PORT}/?token=${TOKEN}`;
      const qrcode = await QRCode.toDataURL(url, { width: 320, margin: 2 });
      res.json({ url, qrcode });
    } catch {
      res.status(500).json({ error: 'Failed to generate QR code' });
    }
  });

  return router;
}

module.exports = { createRouter };
