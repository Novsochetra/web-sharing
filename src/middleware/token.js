const { TOKEN } = require('../config');
const { parseCookies } = require('../utils/cookies');

const ACCESS_DENIED_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Access Denied</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0f1117;color:#e4e6ed}.box{text-align:center;padding:40px}h1{font-size:2rem;font-weight:700;margin-bottom:8px}p{color:#8b8fa3;font-size:0.9rem}</style>
</head><body><div class="box"><h1>Access Denied</h1><p>Invalid or missing token. Scan the QR code or use the full URL.</p></div></body></html>`;

const STATIC_EXTS = [
  '.css',
  '.js',
  '.map',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
];

function requireToken(req, res, next) {
  if (req.path.startsWith('/socket.io/')) return next();

  if (STATIC_EXTS.some((ext) => req.path.toLowerCase().endsWith(ext))) return next();

  const cookies = parseCookies(req.headers.cookie || '');
  const fromCookie = cookies.token;
  const fromQuery = req.query.token;
  const valid = fromCookie === TOKEN || fromQuery === TOKEN;

  if (valid) {
    if (fromCookie !== TOKEN) {
      res.cookie('token', TOKEN, { httpOnly: true, path: '/', sameSite: 'lax' });
    }
    return next();
  }

  res.status(403).type('html').send(ACCESS_DENIED_HTML);
}

module.exports = { requireToken };
