function parseCookies(header) {
  const map = {};
  if (!header) return map;
  header.split(';').forEach((c) => {
    const [n, ...v] = c.trim().split('=');
    if (n) map[n] = decodeURIComponent(v.join('='));
  });
  return map;
}

module.exports = { parseCookies };
