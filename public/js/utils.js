export function formatSize(bytes) {
  if (!bytes || bytes === 0) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

export function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  return new Date(ts).toLocaleDateString();
}

export function getFileIcon(mimeType) {
  if (!mimeType) return '\uD83D\uDCC4';
  if (mimeType.startsWith('image/')) return '\uD83D\uDDBC';
  if (mimeType.startsWith('video/')) return '\uD83C\uDFAC';
  if (mimeType.startsWith('audio/')) return '\uD83C\uDFB5';
  if (mimeType.includes('pdf')) return '\uD83D\uDCDC';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) {
    return '\uD83D\uDCE6';
  }
  return '\uD83D\uDCC4';
}

export function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function truncate(str, max) {
  if (!str) return '';
  return str.replace(/\n/g, ' ').substring(0, max) + (str.length > max ? '...' : '');
}
