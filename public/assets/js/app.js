/**
 * App.js - Main Application Logic
 * 
 * Xử lý: Sidebar toggle, Navigation active state,
 * Toast notifications, API helpers, Modal controls.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Auth guard: redirect về login nếu chưa đăng nhập
    if (!Auth.requireAuth()) return;

    initSidebar();
    initNavigation();
    initUserInfo();
    initPageGreeting();
    initRoleBasedUI();
});

/* ============================================
   SIDEBAR
   ============================================ */

function initSidebar() {
    const hamburger = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }
}

/* ============================================
   NAVIGATION - Active State
   ============================================ */

function initNavigation() {
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    const navItems = document.querySelectorAll('.nav-item[data-page]');

    navItems.forEach(item => {
        const page = item.getAttribute('data-page');
        if (currentPage === page || currentPage.includes(page.replace('.html', ''))) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

/* ============================================
   USER INFO (Sidebar Footer)
   ============================================ */

function initUserInfo() {
    const user = Auth.getUser();
    if (!user) return;

    const nameEl = document.getElementById('sidebarUserName');
    const roleEl = document.getElementById('sidebarUserRole');
    const avatarEl = document.getElementById('sidebarUserAvatar');

    if (nameEl) nameEl.textContent = user.display_name || 'Admin';
    const roleLabels = { 'admin': 'Quản trị viên', 'assistant': 'Trợ lý' };
    if (roleEl) roleEl.textContent = roleLabels[user.role] || 'Nhân viên';
    if (avatarEl) avatarEl.textContent = (user.display_name || 'A').charAt(0).toUpperCase();
}

/* ============================================
   ROLE-BASED PERMISSIONS
   ============================================ */

/**
 * Check if current user is admin
 */
function isAdmin() {
    const user = Auth.getUser();
    return user && user.role === 'admin';
}

/**
 * Get branches the current user is allowed to see
 * Returns empty array for admin (means all branches)
 */
function getPermittedBranches() {
    const user = Auth.getUser();
    if (!user) return [];
    if (user.role === 'admin') return []; // Empty = all
    return user.assigned_branches || [];
}

/**
 * Filter an array of items by permitted branches
 * @param {Array} items - Data items (rooms, contracts, etc.)
 * @param {string} branchField - Field name containing branch value (e.g. 'branch')
 * @returns {Array} Filtered items
 */
function filterByPermittedBranches(items, branchField) {
    const permitted = getPermittedBranches();
    if (permitted.length === 0) return items; // Admin sees all
    return items.filter(item => permitted.includes(item[branchField]));
}

/**
 * Initialize role-based UI: hide elements with .admin-only class for non-admin users
 * Also hides Settings nav link for assistants
 */
function initRoleBasedUI() {
    if (!isAdmin()) {
        // Hide all admin-only elements
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'none';
        });
        // Hide Settings nav link
        const settingsLink = document.querySelector('.nav-item[data-page="settings.html"]');
        if (settingsLink) settingsLink.style.display = 'none';
        // Hide "Hệ thống" section title if settings is the only item
        const sectionTitles = document.querySelectorAll('.nav-section-title');
        sectionTitles.forEach(title => {
            if (title.textContent.trim() === 'Hệ thống') {
                title.style.display = 'none';
            }
        });
    }
}

/**
 * Hiển thị greeting động trên trang dashboard
 */
function initPageGreeting() {
    const user = Auth.getUser();
    if (!user) return;

    const subtitleEl = document.querySelector('.page-subtitle');
    if (subtitleEl) {
        const hour = new Date().getHours();
        let greeting = 'Chào';
        if (hour < 12) greeting = 'Chào buổi sáng';
        else if (hour < 18) greeting = 'Chào buổi chiều';
        else greeting = 'Chào buổi tối';

        subtitleEl.textContent = `${greeting}, ${user.display_name || 'Admin'}! Đây là tình hình nhà trọ hôm nay.`;
    }
}

/* ============================================
   API HELPER
   ============================================ */

const API = {
    baseUrl: '/api',

    /**
     * Gọi API với auth token
     */
    async request(endpoint, options = {}) {
        const token = Auth.getToken();
        const url = `${this.baseUrl}${endpoint}`;

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...options.headers,
            },
            ...options,
        };

        // Nếu body là object thì JSON.stringify
        if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
            config.body = JSON.stringify(config.body);
        }

        // Nếu body là FormData thì bỏ Content-Type (browser tự set)
        if (config.body instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Lỗi ${response.status}`);
            }

            return data;
        } catch (error) {
            // Token hết hạn
            if (error.message.includes('401') || error.message.includes('hết hạn')) {
                Toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
                setTimeout(() => Auth.logout(), 2000);
            }
            throw error;
        }
    },

    get(endpoint) { return this.request(endpoint, { method: 'GET' }); },
    post(endpoint, body) { return this.request(endpoint, { method: 'POST', body }); },
    put(endpoint, body) { return this.request(endpoint, { method: 'PUT', body }); },
    del(endpoint) { return this.request(endpoint, { method: 'DELETE' }); },

    /**
     * Upload file
     */
    upload(endpoint, formData) {
        return this.request(endpoint, { method: 'POST', body: formData });
    }
};

/* ============================================
   TOAST NOTIFICATIONS
   ============================================ */

const Toast = {
    container: null,

    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            this.container.id = 'toastContainer';
            document.body.appendChild(this.container);
        }
    },

    show(message, type = 'info', duration = 4000) {
        this.init();

        const iconNames = {
            success: 'check-circle',
            error: 'x-circle',
            warning: 'alert-triangle',
            info: 'info'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
      <span class="toast-icon"><i data-lucide="${iconNames[type] || iconNames.info}"></i></span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()"><i data-lucide="x"></i></button>
    `;

        this.container.appendChild(toast);
        lucide.createIcons({ nameAttr: 'data-lucide' });

        // Auto remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    success(msg) { this.show(msg, 'success'); },
    error(msg) { this.show(msg, 'error', 6000); },
    warning(msg) { this.show(msg, 'warning'); },
    info(msg) { this.show(msg, 'info'); },
};

/* ============================================
   MODAL CONTROLS
   ============================================ */

const Modal = {
    open(id) {
        const overlay = document.getElementById(id);
        if (overlay) {
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    close(id) {
        const overlay = document.getElementById(id);
        if (overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    /**
     * Đóng modal khi click overlay
     */
    initCloseOnOverlay() {
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        });
    }
};

/* ============================================
   CONFIRM DIALOG
   ============================================ */

function confirmAction(message, title = 'Xác nhận') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay confirm-dialog active';
        overlay.innerHTML = `
      <div class="modal">
        <div class="modal-body" style="padding: 32px;">
          <div class="confirm-icon danger"><i data-lucide="alert-triangle"></i></div>
          <h3>${title}</h3>
          <p>${message}</p>
          <div style="display: flex; gap: 10px; justify-content: center;">
            <button class="btn btn-outline" id="confirmCancel">Hủy</button>
            <button class="btn btn-danger" id="confirmOk">Xác nhận</button>
          </div>
        </div>
      </div>
    `;

        document.body.appendChild(overlay);
        lucide.createIcons({ nameAttr: 'data-lucide' });

        overlay.querySelector('#confirmCancel').addEventListener('click', () => {
            overlay.remove();
            resolve(false);
        });

        overlay.querySelector('#confirmOk').addEventListener('click', () => {
            overlay.remove();
            resolve(true);
        });
    });
}

/* ============================================
   UTILITY: Format money VNĐ
   ============================================ */

function formatMoney(amount) {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/* ============================================
   LOGOUT HANDLER
   ============================================ */

function handleLogout() {
    confirmAction('Bạn có chắc muốn đăng xuất?', 'Đăng xuất').then(ok => {
        if (ok) Auth.logout();
    });
}
