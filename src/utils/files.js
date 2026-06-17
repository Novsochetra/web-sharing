const fs = require('fs');
const { DATA_FILE, UPLOADS_DIR } = require('../config');

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch {
    // ignore read/parse errors
  }
  return { items: [] };
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function broadcastItems(io) {
  io.emit('items-updated', loadData().items);
}

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

module.exports = {
  loadData,
  saveData,
  broadcastItems,
  ensureUploadsDir,
};
