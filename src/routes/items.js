const path = require('path');
const fs = require('fs');
const { UPLOADS_DIR } = require('../config');
const { loadData, saveData, broadcastItems } = require('../utils/files');

function createRouter(io) {
  const router = require('express').Router();

  router.get('/', (_req, res) => {
    res.json(loadData().items);
  });

  router.delete('/:id', (req, res) => {
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
    broadcastItems(io);
    res.json({ success: true });
  });

  router.delete('/', (_req, res) => {
    if (fs.existsSync(UPLOADS_DIR)) {
      fs.readdirSync(UPLOADS_DIR).forEach((f) => {
        if (f !== 'data.json') fs.unlinkSync(path.join(UPLOADS_DIR, f));
      });
    }

    saveData({ items: [] });
    broadcastItems(io);
    res.json({ success: true });
  });

  return router;
}

module.exports = { createRouter };
