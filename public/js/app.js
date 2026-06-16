(function () {
  const socket = io();

  // Tab elements
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.tab-panel');
  const inboxBadge = document.getElementById('inbox-badge');

  // QR elements
  const qrImage = document.getElementById('qr-image');
  const shareUrlEl = document.getElementById('share-url');
  const copyUrlBtn = document.getElementById('copy-url-btn');
  const deviceIp = document.getElementById('device-ip');

  // Send elements
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

  // Inbox elements
  const inboxList = document.getElementById('inbox-list');
  const clearAllBtn = document.getElementById('clear-all-btn');

  // Preview modal
  const previewModal = document.getElementById('preview-modal');
  const previewContent = document.getElementById('preview-content');
  const modalClose = document.getElementById('modal-close');

  let shareUrlStr = '';
  let selectedFiles = [];
  let allItems = [];

  // Tab switching
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      panels.forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    });
  });

  // Load QR + info
  async function loadInfo() {
    try {
      const res = await fetch('/api/qrcode');
      const data = await res.json();
      qrImage.src = data.qrcode;
      shareUrlEl.textContent = data.url;
      shareUrlStr = data.url;
    } catch (_) {
      shareUrlEl.textContent = 'Failed to load';
    }
    try {
      const infoRes = await fetch('/api/info');
      const info = await infoRes.json();
      deviceIp.textContent = info.ip + ':' + info.port;
    } catch (_) {
      deviceIp.textContent = 'localhost';
    }
  }

  copyUrlBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(shareUrlStr).then(() => {
      copyUrlBtn.textContent = 'Copied!';
      setTimeout(() => { copyUrlBtn.textContent = 'Copy URL'; }, 1500);
    }).catch(() => {});
  });

  // Utils
  function formatSize(bytes) {
    if (!bytes || bytes === 0) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }

  function timeAgo(ts) {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    return new Date(ts).toLocaleDateString();
  }

  function getFileIcon(mimeType) {
    if (!mimeType) return '\uD83D\uDCC4';
    if (mimeType.startsWith('image/')) return '\uD83D\uDDBC';
    if (mimeType.startsWith('video/')) return '\uD83C\uDFAC';
    if (mimeType.startsWith('audio/')) return '\uD83C\uDFB5';
    if (mimeType.includes('pdf')) return '\uD83D\uDCDC';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return '\uD83D\uDCE6';
    return '\uD83D\uDCC4';
  }

  function esc(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Render inbox
  function renderInbox(items) {
    if (!items || items.length === 0) {
      inboxList.innerHTML = '<div class="empty-state"><div class="icon">&#128229;</div>Nothing here yet</div>';
    } else {
      inboxList.innerHTML = items.map((item) => renderItem(item)).join('');
    }
    updateBadge(items ? items.length : 0);
  }

  function updateBadge(count) {
    inboxBadge.textContent = count;
    inboxBadge.className = 'tab-badge' + (count > 0 ? ' has-items' : '');
    clearAllBtn.style.display = count > 0 ? '' : 'none';
  }

  function renderItem(item) {
    const name = item.type === 'text'
      ? truncate(item.textContent || '', 50)
      : item.originalName;
    const meta = item.type === 'text'
      ? timeAgo(item.timestamp)
      : formatSize(item.size) + ' &middot; ' + timeAgo(item.timestamp);

    let thumb;
    if (item.type === 'file' && item.mimeType && item.mimeType.startsWith('image/')) {
      thumb = '<img src="/uploads/' + item.storedFilename + '" alt="' + esc(item.originalName) + '">';
    } else {
      thumb = '<span class="' + (item.type === 'text' ? 'text-icon' : 'file-icon') + '">' +
        (item.type === 'text' ? '\uD83D\uDCDD' : getFileIcon(item.mimeType)) + '</span>';
    }

    let actions = '';
    if (item.type === 'file') {
      actions += '<button class="btn btn-download" data-action="download" data-id="' + item.id + '">Download</button>';
      if (item.mimeType && (item.mimeType.startsWith('image/') || item.mimeType.startsWith('video/') || item.mimeType.startsWith('audio/'))) {
        actions += '<button class="btn btn-ghost" data-action="preview" data-id="' + item.id + '">Preview</button>';
      }
    } else {
      actions += '<button class="btn btn-ghost" data-action="toggle-text" data-id="' + item.id + '">Show Text</button>';
    }
    actions += '<button class="btn btn-delete" data-action="delete" data-id="' + item.id + '">Delete</button>';

    let textBlock = '';
    if (item.type === 'text') {
      textBlock = '<div class="text-preview" id="text-' + item.id + '">' + esc(item.textContent) + '</div>';
    }

    return '<div class="item" id="item-' + item.id + '">' +
      '<div class="item-icon">' + thumb + '</div>' +
      '<div class="item-info"><div class="name">' + esc(name) + '</div><div class="meta">' + meta + '</div>' + textBlock + '</div>' +
      '<div class="item-actions">' + actions + '</div>' +
      '</div>';
  }

  function truncate(str, max) {
    if (!str) return '';
    return str.replace(/\n/g, ' ').substring(0, max) + (str.length > max ? '...' : '');
  }

  // Inbox actions (delegation)
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
        btn.textContent = el.classList.contains('show') ? 'Hide Text' : 'Show Text';
      }
    } else if (action === 'delete') {
      deleteItem(id);
    }
  });

  async function deleteItem(id) {
    await fetch('/api/items/' + id, { method: 'DELETE' });
  }

  function openPreview(id) {
    const item = allItems.find((i) => i.id === id);
    if (!item || item.type !== 'file') return;

    const mime = item.mimeType || '';
    let inner = '';
    if (mime.startsWith('image/')) {
      inner = '<img src="/uploads/' + item.storedFilename + '" alt="' + esc(item.originalName) + '">';
    } else if (mime.startsWith('video/')) {
      inner = '<video controls autoplay style="max-width:90vw;max-height:80vh;"><source src="/uploads/' + item.storedFilename + '" type="' + mime + '"></video>';
    } else if (mime.startsWith('audio/')) {
      inner = '<audio controls style="margin:40px;" autoplay><source src="/uploads/' + item.storedFilename + '" type="' + mime + '"></audio>';
    }
    if (inner) {
      previewContent.innerHTML = inner;
      previewModal.style.display = 'flex';
    }
  }

  modalClose.addEventListener('click', () => {
    previewModal.style.display = 'none';
    previewContent.innerHTML = '';
  });
  previewModal.addEventListener('click', (e) => {
    if (e.target === previewModal) {
      previewModal.style.display = 'none';
      previewContent.innerHTML = '';
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      previewModal.style.display = 'none';
      previewContent.innerHTML = '';
    }
  });

  // Clear all
  clearAllBtn.addEventListener('click', async () => {
    if (!confirm('Delete all received items?')) return;
    await fetch('/api/items', { method: 'DELETE' });
  });

  // --- Send logic ---

  uploadZone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    const files = Array.from(fileInput.files);
    if (files.length > 0) {
      selectedFiles = files;
      renderFileList();
    }
  });

  uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('dragover'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      selectedFiles = files;
      renderFileList();
    }
  });

  fileList.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.entry-remove');
    if (!removeBtn) return;
    selectedFiles.splice(parseInt(removeBtn.dataset.index), 1);
    renderFileList();
    if (selectedFiles.length === 0) fileInput.value = '';
  });

  function renderFileList() {
    if (selectedFiles.length === 0) {
      fileList.innerHTML = '';
      return;
    }
    fileList.innerHTML = selectedFiles.map((f, i) =>
      '<div class="file-entry"><span>\uD83D\uDCC4</span>' +
      '<span class="entry-name">' + esc(f.name) + '</span>' +
      '<span class="entry-size">' + formatSize(f.size) + '</span>' +
      '<button class="entry-remove" data-index="' + i + '">&times;</button></div>'
    ).join('');
  }

  function setStatus(type, msg) {
    statusMsg.className = 'status-msg ' + (type || '');
    statusMsg.textContent = msg || '';
    statusMsg.style.display = type ? 'block' : 'none';
  }

  function setLoading(loading) {
    sendBtn.disabled = loading;
    sendSpinner.style.display = loading ? 'inline-block' : 'none';
    sendBtnText.textContent = loading ? 'Sending...' : 'Send';
  }

  function clearForm() {
    selectedFiles = [];
    fileInput.value = '';
    textInput.value = '';
    renderFileList();
    uploadProgress.classList.remove('show');
    progressFill.style.width = '0%';
  }

  sendBtn.addEventListener('click', async () => {
    const hasFiles = selectedFiles.length > 0;
    const hasText = textInput.value.trim().length > 0;

    if (!hasFiles && !hasText) {
      setStatus('error', 'Select files or type a message');
      return;
    }

    setLoading(true);
    setStatus('', '');

    if (hasFiles) {
      const formData = new FormData();
      selectedFiles.forEach((f) => formData.append('files', f));
      uploadProgress.classList.add('show');

      try {
        await uploadWithProgress(formData);
      } catch (err) {
        setStatus('error', err.message || 'Upload failed');
        setLoading(false);
        uploadProgress.classList.remove('show');
        return;
      }
    }

    if (hasText) {
      try {
        await fetch('/api/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: textInput.value.trim() }),
        });
      } catch (err) {
        setStatus('error', 'Failed to send text');
        setLoading(false);
        uploadProgress.classList.remove('show');
        return;
      }
    }

    clearForm();
    setLoading(false);
    setStatus('success', 'Sent!');
  });

  function uploadWithProgress(formData) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload');

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          progressFill.style.width = pct + '%';
          progressText.textContent = 'Uploading... ' + pct + '%';
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error('Upload failed (status ' + xhr.status + ')'));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error')));
      xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));
      xhr.send(formData);
    });
  }

  // Socket.io
  socket.on('items-updated', (items) => {
    allItems = items || [];
    renderInbox(allItems);
  });

  // Init
  loadInfo();
})();
