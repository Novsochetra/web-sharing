const { TOKEN } = require('../config');
const { parseCookies } = require('../utils/cookies');

function createMiddleware() {
  return (socket, next) => {
    const cookies = parseCookies(socket.handshake.headers.cookie || '');
    if (cookies.token === TOKEN) return next();

    const queryToken = socket.handshake.query.token;
    if (queryToken === TOKEN) return next();

    next(new Error('Unauthorized'));
  };
}

module.exports = { createMiddleware };
