import { LABELS } from './constants.js';

export async function fetchQrCode() {
  const res = await fetch('/api/qrcode');
  return res.json();
}

export async function fetchInfo() {
  const res = await fetch('/api/info');
  return res.json();
}

export function uploadFiles(files, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress(pct);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data);
        } catch {
          resolve({});
        }
      } else {
        reject(new Error(`${LABELS.uploadFailed} ${xhr.status})`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error(LABELS.networkError)));
    xhr.addEventListener('abort', () => reject(new Error(LABELS.uploadAborted)));
    xhr.send(formData);
  });
}

export async function sendText(text) {
  const response = await fetch('/api/text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return response.json();
}

export async function deleteItem(id) {
  await fetch('/api/items/' + id, { method: 'DELETE' });
}

export async function clearAllItems() {
  await fetch('/api/items', { method: 'DELETE' });
}
