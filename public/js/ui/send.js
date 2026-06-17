import { sendText, uploadFiles } from '../api.js';
import { LABELS } from '../constants.js';
import {
  addLastSentId,
  endOperation,
  getState,
  setSelectedFiles,
  startOperation,
  suppressNotifications,
} from '../state.js';
import { esc, formatSize } from '../utils.js';

const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const textInput = document.getElementById('text-input');
const sendBtn = document.getElementById('send-btn');
const sendBtnText = document.getElementById('send-btn-text');
const sendSpinner = document.getElementById('send-spinner');
const statusMsg = document.getElementById('status-msg');
const uploadProgress = document.getElementById('upload-progress');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');

function setStatus(type, msg) {
  statusMsg.className = 'status-msg ' + (type || '');
  statusMsg.textContent = msg || '';
  statusMsg.style.display = type ? 'block' : 'none';
}

function setLoading(loading) {
  sendBtn.disabled = loading;
  sendSpinner.style.display = loading ? 'inline-block' : 'none';
  sendBtnText.textContent = loading ? LABELS.executing : LABELS.executeSend;
}

function clearForm() {
  setSelectedFiles([]);
  fileInput.value = '';
  textInput.value = '';
  renderFileList();
  uploadProgress.classList.remove('show');
  progressFill.style.width = '0%';
}

function renderFileList() {
  const files = getState().selectedFiles;
  if (files.length === 0) {
    fileList.innerHTML = '';
    return;
  }
  fileList.innerHTML = files
    .map(
      (f, i) =>
        '<div class="file-entry"><span>\uD83D\uDCC4</span>' +
        '<span class="entry-name">' +
        esc(f.name) +
        '</span>' +
        '<span class="entry-size">' +
        formatSize(f.size) +
        '</span>' +
        '<button class="entry-remove" data-index="' +
        i +
        '">&times;</button></div>'
    )
    .join('');
}

function onUploadProgress(pct) {
  progressFill.style.width = pct + '%';
  progressText.textContent = LABELS.uploadProgress + ' ' + pct + '%';
}

async function handleSend() {
  const files = getState().selectedFiles;
  const text = textInput.value.trim();
  const hasFiles = files.length > 0;
  const hasText = text.length > 0;

  if (!hasFiles && !hasText) {
    setStatus('error', LABELS.selectFilesOrText);
    return;
  }

  startOperation();
  setLoading(true);
  setStatus('', '');

  try {
    if (hasFiles) {
      uploadProgress.classList.add('show');
      const result = await uploadFiles(files, onUploadProgress);
      if (result && result.uploadIds) {
        result.uploadIds.forEach((id) => addLastSentId(id));
      }
      suppressNotifications();
    }

    if (hasText) {
      const result = await sendText(text);
      if (result && result.uploadId) {
        addLastSentId(result.uploadId);
      }
      suppressNotifications();
    }

    clearForm();
  } catch {
    // keep loading state as-is; errors are silent for now
  } finally {
    uploadProgress.classList.remove('show');
    setLoading(false);
    endOperation();
  }
}

export function initSend() {
  uploadZone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    const files = Array.from(fileInput.files);
    if (files.length > 0) {
      setSelectedFiles(files);
      renderFileList();
    }
  });

  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles(files);
      renderFileList();
    }
  });

  fileList.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.entry-remove');
    if (!removeBtn) return;

    const files = getState().selectedFiles;
    files.splice(parseInt(removeBtn.dataset.index, 10), 1);
    setSelectedFiles(files);
    renderFileList();
    if (files.length === 0) fileInput.value = '';
  });

  sendBtn.addEventListener('click', handleSend);
}
