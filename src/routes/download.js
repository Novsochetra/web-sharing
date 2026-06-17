const path = require('path');
const fs = require('fs');
const { UPLOADS_DIR } = require('../config');
const { loadData } = require('../utils/files');

function createRouter() {
  const router = require('express').Router();

  router.get('/:id', (req, res) => {
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

  return router;
}

module.exports = { createRouter };
