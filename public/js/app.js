class GalleryApp {
  constructor() {
    this.token = localStorage.getItem('token');
    this.socket = null;
    this.currentSessionId = null;
    this.selectedFiles = [];
    this.selectedImages = [];
    this.galleryData = {
      items: [],
      hasNextPage: false,
      nextCursor: null,
    };

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkAuth();
  }

  setupEventListeners() {
    // File input change
    document.getElementById('fileInput').addEventListener('change', (e) => {
      this.handleFileSelect(e.target.files);
    });

    // Drag and drop
    const uploadArea = document.getElementById('uploadArea');

    // Use event delegation for click events
    uploadArea.addEventListener('click', (e) => {
      // Check if clicked element is a button with chooseFilesBtn id or the upload area itself
      if (
        e.target.id === 'chooseFilesBtn' ||
        e.target.closest('.upload-content')
      ) {
        document.getElementById('fileInput').click();
      }
    });

    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      this.handleFileSelect(e.dataTransfer.files);
    });

    // Search input debounce
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.searchImages();
      }, 500);
    });
  }
  checkAuth() {
    if (this.token) {
      this.showMainContent();
      this.connectSocket();
      this.loadImages();
    } else {
      this.showAuth();
    }
  }

  showAuth() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('userInfo').classList.add('hidden');
    document.getElementById('mainContent').classList.add('hidden');
  }

  showMainContent() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('userInfo').classList.remove('hidden');
    document.getElementById('mainContent').classList.remove('hidden');
  }

  // Authentication methods
  async login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      this.showToast('Please fill in all fields', 'error');
      return;
    }

    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        this.token = data.token;
        localStorage.setItem('token', this.token);
        this.showToast('Login successful!', 'success');
        this.showMainContent();
        this.connectSocket();
        this.loadImages();

        // Clear form
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
      } else {
        this.showToast(data.message || 'Login failed', 'error');
      }
    } catch (error) {
      this.showToast('Network error. Please try again.', 'error');
      console.error('Login error:', error);
    }
  }

  async register() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    if (!name || !email || !password) {
      this.showToast('Please fill in all fields', 'error');
      return;
    }

    try {
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        this.showToast('Registration successful! Please login.', 'success');
        this.showLogin();

        // Clear form
        document.getElementById('registerName').value = '';
        document.getElementById('registerEmail').value = '';
        document.getElementById('registerPassword').value = '';
      } else {
        this.showToast(data.message || 'Registration failed', 'error');
      }
    } catch (error) {
      this.showToast('Network error. Please try again.', 'error');
      console.error('Registration error:', error);
    }
  }

  logout() {
    this.token = null;
    localStorage.removeItem('token');
    this.disconnectSocket();
    this.showAuth();
    this.galleryData = { items: [], hasNextPage: false, nextCursor: null };
    document.getElementById('gallery').innerHTML = '';
    this.showToast('Logged out successfully', 'success');
  }

  showLogin() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
  }

  showRegister() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
  }

  // Socket connection
  connectSocket() {
    this.socket = io();

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    this.socket.on('uploadProgress', (data) => {
      this.updateProgress(data);
    });

    this.socket.on('fileProcessed', (data) => {
      this.handleFileProcessed(data);
    });

    this.socket.on('sessionCompleted', (data) => {
      this.handleSessionCompleted(data);
    });
  }

  disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // File handling
  handleFileSelect(files) {
    const validFiles = Array.from(files).filter((file) => {
      const isImage = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB

      if (!isImage) {
        this.showToast(`${file.name} is not a valid image file`, 'error');
        return false;
      }

      if (!isValidSize) {
        this.showToast(`${file.name} is too large. Max size is 5MB`, 'error');
        return false;
      }

      return true;
    });

    this.selectedFiles = validFiles;
    this.updateUploadButton();
    this.showSelectedFiles();
  }

  updateUploadButton() {
    const uploadBtn = document.getElementById('uploadBtn');
    uploadBtn.disabled = this.selectedFiles.length === 0;
    uploadBtn.textContent =
      this.selectedFiles.length > 0
        ? `Upload ${this.selectedFiles.length} Images`
        : 'Upload Images';
  }

  showSelectedFiles() {
    const uploadArea = document.getElementById('uploadArea');
    if (this.selectedFiles.length > 0) {
      uploadArea.innerHTML = `
      <div class="upload-content">
        <div class="upload-icon">📁</div>
        <p>${this.selectedFiles.length} files selected</p>
        <button id="chooseFilesBtn">
          Choose Different Files
        </button>
      </div>
    `;

      // Re-attach click event to the new button
      document
        .getElementById('chooseFilesBtn')
        .addEventListener('click', () => {
          document.getElementById('fileInput').click();
        });
    }
  }

  async uploadImages() {
    if (this.selectedFiles.length === 0) return;

    const formData = new FormData();
    this.selectedFiles.forEach((file) => {
      formData.append('images', file);
    });

    // Generate session ID and join socket room
    this.currentSessionId = this.generateSessionId();
    formData.append('sessionId', this.currentSessionId);

    if (this.socket) {
      this.socket.emit('joinUploadSession', {
        sessionId: this.currentSessionId,
      });
      console.log(`Joined upload session: ${this.currentSessionId}`);
    }

    this.showProgressSection();
    this.initializeProgress();

    try {
      const response = await fetch('/images', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        this.showToast('Upload started successfully!', 'success');
        console.log('Upload session started:', result);
      } else {
        this.showToast(result.message || 'Upload failed', 'error');
        this.hideProgressSection();
      }
    } catch (error) {
      this.showToast('Network error during upload', 'error');
      this.hideProgressSection();
      console.error('Upload error:', error);
    }
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  // Progress handling
  showProgressSection() {
    document.getElementById('progressSection').classList.remove('hidden');
  }

  hideProgressSection() {
    document.getElementById('progressSection').classList.add('hidden');
  }

  initializeProgress() {
    const container = document.getElementById('progressContainer');
    container.innerHTML = '';

    this.selectedFiles.forEach((file, index) => {
      const progressItem = document.createElement('div');
      progressItem.className = 'progress-item';
      progressItem.id = `progress-${index}`;

      progressItem.innerHTML = `
                <div class="progress-info">
                    <div class="progress-filename">${file.name}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <div class="progress-status">Waiting...</div>
                </div>
            `;

      container.appendChild(progressItem);
    });
  }

  updateProgress(data) {
    const progressItem = document.getElementById(`progress-${data.fileIndex}`);
    if (!progressItem) return;

    const fill = progressItem.querySelector('.progress-fill');
    const status = progressItem.querySelector('.progress-status');

    fill.style.width = `${data.progress}%`;

    if (data.status === 'processing') {
      status.textContent = `Processing... ${data.progress}%`;
      fill.style.background = '#fbbf24'; // Yellow for processing
    } else if (data.status === 'failed') {
      status.textContent = `Failed: ${data.error}`;
      fill.style.background = '#f56565'; // Red for error
    }
  }

  handleFileProcessed(data) {
    const progressItem = document.getElementById(`progress-${data.fileIndex}`);
    if (!progressItem) return;

    const fill = progressItem.querySelector('.progress-fill');
    const status = progressItem.querySelector('.progress-status');

    fill.style.width = '100%';
    fill.style.background = '#48bb78'; // Green for success
    status.textContent = 'Completed ✓';
  }

  handleSessionCompleted(data) {
    this.showToast(
      `Upload completed! ${data.totalFiles} files processed.`,
      'success',
    );
    // Immediately refresh gallery to show new images
    this.loadImages(); // Refresh gallery

    // Reset upload form
    setTimeout(() => {
      this.hideProgressSection();
      this.resetUploadForm();
    }, 2000);
  }

  resetUploadForm() {
    this.selectedFiles = [];
    document.getElementById('fileInput').value = '';

    const uploadArea = document.getElementById('uploadArea');
    uploadArea.innerHTML = `
    <div class="upload-content">
      <div class="upload-icon">📁</div>
      <p>Drag & drop images here or click to browse</p>
      <button id="chooseFilesBtn">
        Choose Files
      </button>
    </div>
  `;

    // Re-attach click event to the new button
    document.getElementById('chooseFilesBtn').addEventListener('click', () => {
      document.getElementById('fileInput').click();
    });

    this.updateUploadButton();
  }

  // Gallery methods
  async loadImages(reset = true) {
    if (reset) {
      this.galleryData = { items: [], hasNextPage: false, nextCursor: null };
      document.getElementById('gallery').innerHTML = '';
    }

    document.getElementById('loadingIndicator').classList.remove('hidden');

    const params = new URLSearchParams();
    params.append('limit', '8');

    if (this.galleryData.nextCursor) {
      params.append('cursor', this.galleryData.nextCursor);
    }

    const sortValue = document.getElementById('sortSelect').value;
    const [sortBy, order] = sortValue.split('-');
    params.append('sortBy', sortBy);
    params.append('order', order);

    const searchValue = document.getElementById('searchInput').value.trim();
    if (searchValue) {
      params.append('search', searchValue);
    }

    try {
      const response = await fetch(`/images?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        this.galleryData.items.push(...data.items);
        this.galleryData.hasNextPage = data.hasNextPage;
        this.galleryData.nextCursor = data.nextCursor;

        this.renderGallery();
        this.updateLoadMoreButton();
      } else {
        this.showToast(data.message || 'Failed to load images', 'error');
      }
    } catch (error) {
      this.showToast('Network error while loading images', 'error');
      console.error('Load images error:', error);
    } finally {
      document.getElementById('loadingIndicator').classList.add('hidden');
    }
  }

  renderGallery() {
    const gallery = document.getElementById('gallery');

    if (this.galleryData.items.length === 0) {
      gallery.innerHTML =
        '<div class="text-center" style="grid-column: 1 / -1; padding: 40px; color: #666;">No images found</div>';
      return;
    }

    gallery.innerHTML = this.galleryData.items
      .map(
        (image) => `
        <div class="gallery-item" data-image-id="${image.id}">
          <div class="image-container">
            <img src="${image.fileURL}" alt="${image.originalName}" loading="lazy" onclick="app.openModal('${image.fileURL}', '${image.originalName}', '${this.formatFileSize(image.fileSize)}', '${this.formatDate(image.uploadedAt)}')">
            <div class="image-overlay">
              <button class="delete-btn" onclick="app.selectImageForDeletion('${image.id}', event)" title="Delete Image">
                🗑️
              </button>
            </div>
          </div>
          <div class="gallery-item-info">
            <div class="gallery-item-title">${image.originalName}</div>
            <div class="gallery-item-details">
              <span>${this.formatFileSize(image.fileSize)}</span>
              <span>${this.formatDate(image.uploadedAt)}</span>
            </div>
          </div>
        </div>
      `,
      )
      .join('');
  }

  updateLoadMoreButton() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (this.galleryData.hasNextPage) {
      loadMoreBtn.classList.remove('hidden');
    } else {
      loadMoreBtn.classList.add('hidden');
    }
  }

  loadMoreImages() {
    this.loadImages(false);
  }

  searchImages() {
    this.loadImages(true);
  }

  // Modal methods
  openModal(imageUrl, title, size, date) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalDetails = document.getElementById('modalDetails');

    modalImage.src = imageUrl;
    modalTitle.textContent = title;
    modalDetails.innerHTML = `
            <strong>Size:</strong> ${size}<br>
            <strong>Uploaded:</strong> ${date}
        `;

    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('show'), 10);
  }

  closeModal() {
    const modal = document.getElementById('imageModal');
    modal.classList.remove('show');
    setTimeout(() => modal.classList.add('hidden'), 300);
  }

  // Utility methods
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 4000);
  }

  selectImageForDeletion(imageId, event) {
    event.stopPropagation(); // Prevent opening modal

    const imageElement = document.querySelector(`[data-image-id="${imageId}"]`);

    if (this.selectedImages.includes(imageId)) {
      // Deselect
      this.selectedImages = this.selectedImages.filter((id) => id !== imageId);
      imageElement.classList.remove('selected');
    } else {
      // Select
      this.selectedImages.push(imageId);
      imageElement.classList.add('selected');
    }

    this.updateBulkDeleteControls();
  }

  updateBulkDeleteControls() {
    const bulkControls = document.getElementById('bulkDeleteControls');
    const selectedCount = document.getElementById('selectedCount');

    selectedCount.textContent = this.selectedImages.length;

    if (this.selectedImages.length > 0) {
      bulkControls.classList.add('show');
    } else {
      bulkControls.classList.remove('show');
    }
  }

  cancelSelection() {
    this.selectedImages = [];
    document.querySelectorAll('.gallery-item.selected').forEach((item) => {
      item.classList.remove('selected');
    });
    this.updateBulkDeleteControls();
  }

  async deleteSelectedImages() {
    if (this.selectedImages.length === 0) {
      this.showToast('No images selected for deletion', 'error');
      return;
    }

    const confirmDelete = confirm(
      `Are you sure you want to delete ${this.selectedImages.length} image(s)? This action cannot be undone.`,
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch('/images/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          imageIds: this.selectedImages,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        this.showToast(
          `${result.deletedCount} image(s) deleted successfully!`,
          'success',
        );

        // Convert both to strings for consistent comparison
        const deletedIds = this.selectedImages.map((id) => String(id));

        // Remove deleted images from gallery data
        this.galleryData.items = this.galleryData.items.filter(
          (item) => !deletedIds.includes(String(item.id)),
        );

        // Clear selection and re-render gallery
        this.cancelSelection();
        this.renderGallery();
        this.updateLoadMoreButton();
      } else {
        this.showToast(result.message || 'Failed to delete images', 'error');
      }
    } catch (error) {
      this.showToast('Network error while deleting images', 'error');
      console.error('Delete images error:', error);
    }
  }
}

// Global functions for HTML onclick events
let app;

function login() {
  app.login();
}

function register() {
  app.register();
}

function logout() {
  app.logout();
}

function showLogin() {
  app.showLogin();
}

function showRegister() {
  app.showRegister();
}

function uploadImages() {
  app.uploadImages();
}

function loadMoreImages() {
  app.loadMoreImages();
}

function searchImages() {
  app.searchImages();
}

function loadImages() {
  app.loadImages();
}

function closeModal() {
  app.closeModal();
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  app = new GalleryApp();
});

// Close modal when clicking outside
document.addEventListener('click', (e) => {
  const modal = document.getElementById('imageModal');
  if (e.target === modal) {
    app.closeModal();
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    app.closeModal();
  }
});
