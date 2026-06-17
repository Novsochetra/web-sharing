import { LABELS } from './constants.js';
import { NotificationManager } from './notifications.js';
import {
  cleanupStaleIds,
  getState,
  registerEventHandler,
  setAllItems,
  setFirstItemsUpdate,
  setLastWiped,
  shouldSuppressNotifications,
  tryBufferEvent,
} from './state.js';
import { deleteText, typeWriter, wait } from './utils.js';
import { initInbox, renderInbox } from './ui/inbox.js';
import { initPreview } from './ui/preview.js';
import { initQr, loadInfo } from './ui/qr.js';
import { initSend } from './ui/send.js';
import { completeSplash, initSplash, markDataLoaded } from './ui/splash.js';

const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const socket = io(token ? { query: { token } } : undefined);

const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.tab-panel');
const subtitle = document.getElementById('subtitle-text');

function initTabs() {
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      panels.forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    });
  });
}

function getItemName(item) {
  return item.type === 'text' ? LABELS.textMessage : item.originalName;
}

function handleItemsUpdated(items) {
  const state = getState();
  const newItems = items || [];
  const oldIds = new Set(state.allItems.map((i) => i.id));
  const newIds = new Set(newItems.map((i) => i.id));

  const addedItems = newItems.filter((i) => !oldIds.has(i.id));
  const removedItems = state.allItems.filter((i) => !newIds.has(i.id));

  const validIds = new Set(newItems.map((i) => i.id));
  cleanupStaleIds(validIds);

  if (!state.isFirstItemsUpdate && !shouldSuppressNotifications()) {
    if (state.allItems.length > 0 && newItems.length === 0) {
      if (!state.lastWiped) {
        NotificationManager.show('warning', LABELS.allItemsWiped);
      }
    } else if (removedItems.length > 0) {
      const removedByOthers = removedItems.filter((i) => !state.lastDeletedIds.has(i.id));
      if (removedByOthers.length > 0) {
        const name =
          removedByOthers.length === 1 ? getItemName(removedByOthers[0]) : removedByOthers.length;
        NotificationManager.show('warning', name + ' ' + LABELS.deleted);
      }
    } else if (addedItems.length > 0) {
      const addedByOthers = addedItems.filter((i) => !state.lastSentIds.has(i.id));
      if (addedByOthers.length > 0) {
        const name =
          addedByOthers.length === 1
            ? getItemName(addedByOthers[0])
            : addedByOthers.length + ' ' + LABELS.newItems;
        NotificationManager.show('info', LABELS.received + ' ' + name);
      }
    }
  }

  setLastWiped(false);
  setFirstItemsUpdate(false);
  setAllItems(newItems);
  renderInbox(newItems);
}

function initSocket() {
  socket.on('items-updated', (items) => {
    if (tryBufferEvent(items)) return;
    handleItemsUpdated(items);
  });
  socket.on('user-connected', () => {
    NotificationManager.show('info', LABELS.newDeviceConnected);
  });
  socket.on('user-disconnected', () => {
    NotificationManager.show('info', LABELS.deviceDisconnected);
  });
}

function buildTitleMessages(info) {
  const endpoint = info.ip + ':' + info.port;
  return [
    '> Connected on ' + endpoint,
    '> Waiting for incoming files...',
    '> Drop files or type a message',
    '> Bridge open on port ' + info.port,
  ];
}

async function runTitleLoop(info) {
  const messages = buildTitleMessages(info);
  let index = 0;

  while (true) {
    const message = messages[index % messages.length];
    await typeWriter(subtitle, message, { speed: 45, jitter: 12 });
    await wait(2400);
    await deleteText(subtitle, { speed: 22 });
    await wait(400);
    index += 1;
  }
}

async function boot() {
  const splashReady = initSplash();
  registerEventHandler(handleItemsUpdated);
  initTabs();
  initQr();
  initSend();
  initInbox();
  initPreview();
  initSocket();

  let info;
  try {
    info = await loadInfo();
  } catch {
    info = { ip: LABELS.localhost, port: '3000' };
  }
  markDataLoaded();
  await splashReady;
  await completeSplash();
  runTitleLoop(info);
}

boot();
