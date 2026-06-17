import { deleteItem, clearAllItems } from '../api.js';
import { LABELS } from '../constants.js';
import { addLastDeletedId, setLastWiped, suppressNotifications } from '../state.js';
import { esc, formatSize, getFileIcon, timeAgo, truncate } from '../utils.js';
import { openPreview } from './preview.js';

const inboxList = document.getElementById('inbox-list');
const inboxBadge = document.getElementById('inbox-badge');
const clearAllBtn = document.getElementById('clear-all-btn');

export function updateBadge(count) {
  inboxBadge.textContent = count;
  inboxBadge.className = 'tab-badge' + (count > 0 ? ' has-items' : '');
  clearAllBtn.style.display = count > 0 ? '' : 'none';
}

function renderItem(item) {
  const name = item.type === 'text' ? truncate(item.textContent || '', 50) : item.originalName;
  const meta =
    item.type === 'text'
      ? timeAgo(item.timestamp)
      : formatSize(item.size) + ' &middot; ' + timeAgo(item.timestamp);

  let thumb;
  if (item.type === 'file' && item.mimeType && item.mimeType.startsWith('image/')) {
    thumb = '<img src="/uploads/' + item.storedFilename + '" alt="' + esc(item.originalName) + '">';
  } else {
    thumb =
      '<span class="' +
      (item.type === 'text' ? 'text-icon' : 'file-icon') +
      '">' +
      (item.type === 'text' ? '\uD83D\uDCDD' : getFileIcon(item.mimeType)) +
      '</span>';
  }

  let actions = '';
  if (item.type === 'file') {
    actions +=
      '<button class="btn btn-download btn-icon" data-action="download" data-id="' +
      item.id +
      '" title="Download">[↓]</button>';
    if (
      item.mimeType &&
      (item.mimeType.startsWith('image/') ||
        item.mimeType.startsWith('video/') ||
        item.mimeType.startsWith('audio/'))
    ) {
      actions +=
        '<button class="btn btn-ghost btn-icon" data-action="preview" data-id="' +
        item.id +
        '" title="Preview">[◉]</button>';
    }
  } else {
    actions +=
      '<button class="btn btn-ghost" data-action="toggle-text" data-id="' +
      item.id +
      '">' +
      LABELS.show +
      '</button>';
  }
  actions +=
    '<button class="btn btn-delete btn-icon" data-action="delete" data-id="' +
    item.id +
    '" title="Delete">[×]</button>';

  let textBlock = '';
  if (item.type === 'text') {
    textBlock =
      '<div class="text-preview" id="text-' + item.id + '">' + esc(item.textContent) + '</div>';
  }

  return (
    '<div class="item" id="item-' +
    item.id +
    '">' +
    '<div class="item-icon">' +
    thumb +
    '</div>' +
    '<div class="item-info"><div class="name">' +
    esc(name) +
    '</div><div class="meta">' +
    meta +
    '</div>' +
    textBlock +
    '</div>' +
    '<div class="item-actions">' +
    actions +
    '</div>' +
    '</div>'
  );
}

export function renderInbox(items) {
  if (!items || items.length === 0) {
    inboxList.innerHTML =
      '<div class="empty-state"><div class="icon">&#128229;</div>Nothing here yet</div>';
  } else {
    inboxList.innerHTML = items.map((item) => renderItem(item)).join('');
  }
  updateBadge(items ? items.length : 0);
}

export async function removeItem(id) {
  addLastDeletedId(id);
  suppressNotifications();
  await deleteItem(id);
}

export async function wipeAll() {
  if (!confirm(LABELS.wipeConfirm)) return;
  setLastWiped(true);
  suppressNotifications();
  await clearAllItems();
}

export function initInbox() {
  clearAllBtn.addEventListener('click', wipeAll);

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const id = btn.dataset.id;

    if (action === 'download') {
      window.open('/api/download/' + id, '_blank');
    } else if (action === 'preview') {
      openPreview(id);
    } else if (action === 'toggle-text') {
      const el = document.getElementById('text-' + id);
      if (el) {
        el.classList.toggle('show');
        btn.textContent = el.classList.contains('show') ? LABELS.hide : LABELS.show;
      }
    } else if (action === 'delete') {
      removeItem(id);
    }
  });
}
