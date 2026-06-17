const state = {
  shareUrl: '',
  selectedFiles: [],
  allItems: [],
  lastSentIds: new Set(),
  lastDeletedIds: new Set(),
  lastWiped: false,
  isFirstItemsUpdate: true,
  suppressUntil: 0,
};

let pendingOperations = 0;
const bufferedEvents = [];
let eventHandler = null;

export function getState() {
  return state;
}

export function setShareUrl(url) {
  state.shareUrl = url;
}

export function setSelectedFiles(files) {
  state.selectedFiles = files;
}

export function setAllItems(items) {
  state.allItems = items;
}

export function addLastSentId(id) {
  state.lastSentIds.add(id);
}

export function addLastDeletedId(id) {
  state.lastDeletedIds.add(id);
}

export function setLastWiped(value) {
  state.lastWiped = value;
}

export function setFirstItemsUpdate(value) {
  state.isFirstItemsUpdate = value;
}

export function suppressNotifications(ms = 1500) {
  state.suppressUntil = Date.now() + ms;
}

export function shouldSuppressNotifications() {
  return Date.now() < state.suppressUntil;
}

export function cleanupStaleIds(validIds) {
  state.lastSentIds.forEach((id) => {
    if (!validIds.has(id)) state.lastSentIds.delete(id);
  });
  state.lastDeletedIds.forEach((id) => {
    if (!validIds.has(id)) state.lastDeletedIds.delete(id);
  });
}

export function startOperation() {
  pendingOperations += 1;
}

export function registerEventHandler(handler) {
  eventHandler = handler;
}

export function endOperation() {
  pendingOperations = Math.max(0, pendingOperations - 1);
  if (pendingOperations === 0 && eventHandler) {
    const events = bufferedEvents.splice(0);
    events.forEach(eventHandler);
  }
}

export function tryBufferEvent(items) {
  if (pendingOperations > 0) {
    bufferedEvents.push(items);
    return true;
  }
  return false;
}
