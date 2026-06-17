import { getState } from '../state.js';
import { esc } from '../utils.js';

const previewModal = document.getElementById('preview-modal');
const previewContent = document.getElementById('preview-content');
const modalClose = document.getElementById('modal-close');

export function openPreview(id) {
  const item = getState().allItems.find((i) => i.id === id);
  if (!item || item.type !== 'file') return;

  const mime = item.mimeType || '';
  let inner = '';
  if (mime.startsWith('image/')) {
    inner = '<img src="/uploads/' + item.storedFilename + '" alt="' + esc(item.originalName) + '">';
  } else if (mime.startsWith('video/')) {
    inner =
      '<video controls autoplay style="max-width:90vw;max-height:80vh;">' +
      '<source src="/uploads/' +
      item.storedFilename +
      '" type="' +
      mime +
      '"></video>';
  } else if (mime.startsWith('audio/')) {
    inner =
      '<audio controls style="margin:40px;" autoplay>' +
      '<source src="/uploads/' +
      item.storedFilename +
      '" type="' +
      mime +
      '"></audio>';
  }

  if (inner) {
    previewContent.innerHTML = inner;
    previewModal.style.display = 'flex';
  }
}

function closePreview() {
  previewModal.style.display = 'none';
  previewContent.innerHTML = '';
}

export function initPreview() {
  modalClose.addEventListener('click', closePreview);
  previewModal.addEventListener('click', (e) => {
    if (e.target === previewModal) closePreview();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePreview();
  });
}
