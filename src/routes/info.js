const { PORT, TOKEN } = require('../config');
const { getLocalIP } = require('../utils/ip');

function createRouter() {
  const router = require('express').Router();

  router.get('/', (_req, res) => {
    res.json({ ip: getLocalIP(), port: PORT, token: TOKEN });
  });

  return router;
}

module.exports = { createRouter };
