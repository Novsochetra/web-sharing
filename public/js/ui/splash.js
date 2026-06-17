import { wait, typeWriter } from '../utils.js';

const SPLASH_MIN_DURATION = 2500;

const BOOT_LINES = [
  '[SYSTEM] initializing...',
  '[OK] modules loaded',
  '[NET] interface up',
  '[READY] awaiting handshake',
];

const splashScreen = document.getElementById('splash-screen');
const splashLog = document.getElementById('splash-log');
const splashProgressFill = document.getElementById('splash-progress-fill');
const splashProgressText = document.getElementById('splash-progress-text');

let resolveReady = null;
let readyPromise = null;
let dataLoaded = false;
let minDurationElapsed = false;

function checkComplete() {
  if (dataLoaded && minDurationElapsed && typeof resolveReady === 'function') {
    resolveReady();
    resolveReady = null;
  }
}

async function typeBootLines() {
  for (const line of BOOT_LINES) {
    const lineEl = document.createElement('div');
    lineEl.className = 'splash-log-line';
    splashLog.appendChild(lineEl);
    await typeWriter(lineEl, line, { speed: 35, jitter: 10 });
    await wait(180);
  }
}

function animateProgress() {
  const start = performance.now();
  const duration = 1800;

  return new Promise((resolve) => {
    function frame(now) {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const percent = Math.round(progress * 100);
      splashProgressFill.style.width = percent + '%';
      splashProgressText.textContent = percent + '%';

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        resolve();
      }
    }
    requestAnimationFrame(frame);
  });
}

export function initSplash() {
  readyPromise = new Promise((resolve) => {
    resolveReady = resolve;
  });

  typeBootLines();
  animateProgress();

  setTimeout(() => {
    minDurationElapsed = true;
    checkComplete();
  }, SPLASH_MIN_DURATION);

  return readyPromise;
}

export function markDataLoaded() {
  dataLoaded = true;
  checkComplete();
}

export async function completeSplash() {
  await readyPromise;

  splashScreen.classList.add('fade-out');
  await wait(500);

  if (splashScreen.parentNode) {
    splashScreen.parentNode.removeChild(splashScreen);
  }
}
