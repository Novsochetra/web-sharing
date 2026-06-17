const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { MAX_FILE_SIZE, UPLOADS_DIR } = require('../config');
const { loadData, saveData, broadcastItems } = require('../utils/files');

function createStorage() {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    },
  });
}

function createRouter(io) {
  const router = require('express').Router();
  const upload = multer({
    storage: createStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
  });

  router.post('/', upload.array('files', 10), (req, res) => {
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
    broadcastItems(io);
    res.json({ uploadIds });
  });

  return router;
}

module.exports = { createRouter };
