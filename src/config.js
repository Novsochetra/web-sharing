const path = require('path');
const crypto = require('crypto');

if (process.pkg && !process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

const PORT = process.env.PORT || 3000;
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE, 10) || 500 * 1024 * 1024;
const TOKEN = crypto.randomBytes(8).toString('hex');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads', TOKEN);
const DATA_FILE = path.join(UPLOADS_DIR, 'data.json');

module.exports = {
  PORT,
  MAX_FILE_SIZE,
  TOKEN,
  UPLOADS_DIR,
  DATA_FILE,
};
