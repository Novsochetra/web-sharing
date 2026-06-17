import { NOTIFICATION_PREFIXES, NOTIFICATION_TITLES } from './constants.js';
import { esc } from './utils.js';

const container = document.createElement('div');
container.className = 'notification-container';
document.body.appendChild(container);

const MAX_VISIBLE = 5;
const DEFAULT_DURATION = 4000;
let notifications = [];
let idCounter = 0;

function create(type, message, duration) {
  const id = ++idCounter;
  const notif = document.createElement('div');
  notif.className = 'notification ' + type;
  notif.id = 'notif-' + id;
  const prefix = NOTIFICATION_PREFIXES[type] || '[INFO]';
  const title = NOTIFICATION_TITLES[type] || 'INFO';
  notif.innerHTML =
    '<div class="notif-header">' +
    '<span class="notif-prefix">' +
    prefix +
    '</span>' +
    '<span class="notif-title">' +
    title +
    '</span>' +
    '<button class="notif-close" data-id="' +
    id +
    '">[×]</button>' +
    '</div>' +
    '<div class="notif-body">' +
    esc(message) +
    '</div>' +
    '<div class="notif-progress"><div class="notif-progress-fill"></div></div>';
  return { id, el: notif, duration };
}

function remove(id, skipAnim) {
  const idx = notifications.findIndex((n) => n.id === id);
  if (idx === -1) return;
  const n = notifications[idx];
  clearTimeout(n.timer);
  notifications.splice(idx, 1);
  if (skipAnim) {
    n.el.remove();
  } else {
    n.el.classList.remove('show');
    n.el.classList.add('hide');
    setTimeout(() => n.el.remove(), 400);
  }
}

container.addEventListener('click', (e) => {
  const closeBtn = e.target.closest('.notif-close');
  if (closeBtn) {
    remove(parseInt(closeBtn.dataset.id, 10));
  }
});

export const NotificationManager = {
  show(type, message, duration = DEFAULT_DURATION) {
    const n = create(type, message, duration);
    if (notifications.length >= MAX_VISIBLE) {
      const old = notifications.shift();
      remove(old.id, true);
    }
    notifications.push(n);
    container.appendChild(n.el);
    requestAnimationFrame(() => {
      n.el.classList.add('show');
    });

    const fill = n.el.querySelector('.notif-progress-fill');
    let startTime = null;
    function animateProgress(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const pct = Math.min(100, (elapsed / duration) * 100);
      fill.style.width = pct + '%';
      if (pct < 100) {
        requestAnimationFrame(animateProgress);
      }
    }
    requestAnimationFrame(animateProgress);
    n.timer = setTimeout(() => remove(n.id), duration);
  },
  remove,
};
