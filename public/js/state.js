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
