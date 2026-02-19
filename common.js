// Shared utility functions for Charity and Faith Mission Management System

/**
 * Display a non-blocking toast notification.
 * @param {string} message - The message to display
 * @param {'success'|'error'|'info'|'warning'} type - The notification type
 * @param {number} duration - Duration in ms before auto-dismiss (default 3500)
 */
function showToast(message, type = 'success', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span class="toast-msg">${escapeHtml(message)}</span>`;

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('toast-show'));
    });

    setTimeout(() => {
        toast.classList.remove('toast-show');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, duration);
}

/**
 * Escape HTML special characters to prevent XSS.
 * @param {*} value - The value to escape
 * @returns {string} - Escaped string
 */
function escapeHtml(value) {
    if (value == null) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Format a date string into a readable local date.
 * @param {string} dateStr - ISO date string (YYYY-MM-DD or full ISO)
 * @returns {string} - Formatted date
 */
function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        // Handle Firestore timestamp objects
        if (dateStr && typeof dateStr === 'object' && dateStr.seconds) {
            return new Date(dateStr.seconds * 1000).toLocaleDateString(undefined, {
                year: 'numeric', month: 'short', day: 'numeric'
            });
        }
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    } catch (e) {
        return dateStr;
    }
}

/**
 * Perform logout, signing out from Firebase if available.
 * @param {string} loginPath - Path to the login page
 */
function performLogout(loginPath) {
    if (confirm('Are you sure you want to logout?')) {
        if (typeof auth !== 'undefined' && auth) {
            auth.signOut().then(() => {
                localStorage.removeItem('userSession');
                window.location.href = loginPath;
            }).catch(() => {
                localStorage.removeItem('userSession');
                window.location.href = loginPath;
            });
        } else {
            localStorage.removeItem('userSession');
            window.location.href = loginPath;
        }
    }
}

/**
 * Set up the logout button click handler.
 * Automatically determines the login path based on current location.
 */
function setupLogout() {
    const btn = document.getElementById('logout');
    if (!btn) return;
    const isInPages = window.location.pathname.includes('/pages/');
    const loginPath = isInPages ? '../login.html' : 'login.html';
    btn.addEventListener('click', () => performLogout(loginPath));
}

/**
 * Update a table's record-count badge.
 * @param {string} badgeId - ID of the badge element
 * @param {number} count - Number of records
 */
function updateRecordCount(badgeId, count) {
    const el = document.getElementById(badgeId);
    if (el) el.textContent = count + (count === 1 ? ' record' : ' records');
}

/**
 * Filter table rows based on a search query.
 * @param {string} query - Search term
 * @param {string} tbodySelector - CSS selector for the table tbody
 */
function filterTableRows(query, tbodySelector) {
    const term = query.toLowerCase().trim();
    const rows = document.querySelectorAll(`${tbodySelector} tr`);
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = (!term || text.includes(term)) ? '' : 'none';
    });
}
