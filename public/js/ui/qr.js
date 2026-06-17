import { fetchQrCode, fetchInfo } from '../api.js';
import { setShareUrl, getState } from '../state.js';
import { LABELS } from '../constants.js';

const qrImage = document.getElementById('qr-image');
const shareUrlEl = document.getElementById('share-url');
const copyUrlBtn = document.getElementById('copy-url-btn');
const deviceIp = document.getElementById('device-ip');

export async function loadInfo() {
  try {
    const data = await fetchQrCode();
    qrImage.src = data.qrcode;
    shareUrlEl.textContent = data.url;
    setShareUrl(data.url);
  } catch {
    shareUrlEl.textContent = LABELS.failedToLoad;
  }

  try {
    const info = await fetchInfo();
    deviceIp.textContent = info.ip + ':' + info.port;
  } catch {
    deviceIp.textContent = LABELS.localhost;
  }
}

function fallbackCopy(text, done) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  ta.style.top = '-9999px';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand('copy');
    done();
  } catch {
    // ignore copy errors
  }
  document.body.removeChild(ta);
}

function canUseClipboard() {
  return (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  );
}

function copyUrl() {
  const text = getState().shareUrl;
  if (!text) return;

  const done = () => {
    copyUrlBtn.textContent = LABELS.copied;
    setTimeout(() => {
      copyUrlBtn.textContent = LABELS.copyUrl;
    }, 1500);
  };

  if (canUseClipboard()) {
    navigator.clipboard
      .writeText(text)
      .then(done)
      .catch(() => fallbackCopy(text, done));
  } else {
    fallbackCopy(text, done);
  }
}

export function initQr() {
  copyUrlBtn.addEventListener('click', copyUrl);
}
