const { v4: uuidv4 } = require('uuid');
const { loadData, saveData, broadcastItems } = require('../utils/files');

function createRouter(io) {
  const router = require('express').Router();

  router.post('/', (req, res) => {
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
    broadcastItems(io);
    res.json({ uploadId: id });
  });

  return router;
}

module.exports = { createRouter };
