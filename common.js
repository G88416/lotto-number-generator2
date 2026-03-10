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

/**
 * Parse a CSV string into an array of objects using the first row as headers.
 * Handles quoted fields and embedded commas/newlines.
 * @param {string} text - Raw CSV text
 * @returns {Array<Object>}
 */
function parseCSVText(text) {
    const lines = text.split(/\r?\n/);
    const nonEmpty = lines.filter(l => l.trim() !== '');
    if (nonEmpty.length < 2) return [];
    const headers = parseCSVRow(nonEmpty[0]).map(h => h.trim());
    return nonEmpty.slice(1).map(line => {
        const values = parseCSVRow(line);
        const obj = {};
        headers.forEach((h, i) => { obj[h] = (values[i] || '').trim(); });
        return obj;
    }).filter(row => Object.values(row).some(v => v !== ''));
}

/**
 * Split a single CSV row into fields, respecting quoted strings.
 * @param {string} row
 * @returns {string[]}
 */
function parseCSVRow(row) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '"') {
            if (inQuotes && row[i + 1] === '"') { current += '"'; i++; }
            else { inQuotes = !inQuotes; }
        } else if (ch === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current);
    return result;
}

/**
 * Extract rows from the first HTML <table> found in an HTML string.
 * Used to process Word-document tables converted to HTML by mammoth.js.
 * @param {string} html
 * @returns {Array<Object>}
 */
function parseHtmlTableRows(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    const table = div.querySelector('table');
    if (!table) return [];
    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length < 2) return [];
    const headers = Array.from(rows[0].querySelectorAll('th, td')).map(c => c.textContent.trim());
    return rows.slice(1).map(row => {
        const cells = Array.from(row.querySelectorAll('th, td'));
        const obj = {};
        headers.forEach((h, i) => { obj[h] = cells[i] ? cells[i].textContent.trim() : ''; });
        return obj;
    }).filter(row => Object.values(row).some(v => v !== ''));
}

/**
 * Parse an uploaded file (.csv, .xlsx, .xls, .docx) and return rows as plain objects.
 * Requires SheetJS (window.XLSX) for Excel and mammoth (window.mammoth) for Word files.
 * @param {File} file
 * @param {function(Array<Object>|null, string|null)} callback  (rows, errorMessage)
 */
function parseUploadedFile(file, callback) {
    const name = (file.name || '').toLowerCase();
    if (name.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try { callback(parseCSVText(e.target.result), null); }
            catch (err) { callback(null, 'CSV parse error: ' + err.message); }
        };
        reader.onerror = () => callback(null, 'Failed to read the CSV file.');
        reader.readAsText(file);
    } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        if (typeof window.XLSX === 'undefined') {
            callback(null, 'Excel library (SheetJS) is not loaded. Please refresh and try again.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const wb = window.XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
                const sheet = wb.Sheets[wb.SheetNames[0]];
                const rows = window.XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
                callback(rows.map(r => {
                    const clean = {};
                    Object.entries(r).forEach(([k, v]) => {
                        clean[String(k).trim()] = (v == null || typeof v === 'object') ? '' : String(v).trim();
                    });
                    return clean;
                }), null);
            } catch (err) { callback(null, 'Excel parse error: ' + err.message); }
        };
        reader.onerror = () => callback(null, 'Failed to read the Excel file.');
        reader.readAsArrayBuffer(file);
    } else if (name.endsWith('.docx')) {
        if (typeof window.mammoth === 'undefined') {
            callback(null, 'Word library (mammoth.js) is not loaded. Please refresh and try again.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            window.mammoth.convertToHtml({ arrayBuffer: e.target.result })
                .then(result => {
                    const rows = parseHtmlTableRows(result.value);
                    if (rows.length === 0) {
                        callback(null, 'No table found in the Word document. Please ensure data is in a table.');
                    } else {
                        callback(rows, null);
                    }
                })
                .catch(err => callback(null, 'Word parse error: ' + err.message));
        };
        reader.onerror = () => callback(null, 'Failed to read the Word document.');
        reader.readAsArrayBuffer(file);
    } else {
        callback(null, 'Unsupported file type. Please upload a .csv, .xlsx, .xls, or .docx file.');
    }
}

/**
 * Find a value in a row object using a list of possible header aliases (case-insensitive).
 * @param {Object} row
 * @param {string[]} aliases
 * @returns {string}
 */
function getRowField(row, aliases) {
    for (const alias of aliases) {
        for (const [key, val] of Object.entries(row)) {
            if (key.toLowerCase().trim() === alias.toLowerCase()) return String(val || '').trim();
        }
    }
    return '';
}

const DEFAULT_MINISTRY_NAMES = [
    'WOG',
    'Mens',
    'Young Adults',
    'Youth',
    'Woman of Virtue',
    'Woman of Galilee'
];

function normalizeMinistryKey(value) {
    return String(value || '').trim().toLowerCase();
}

function getDefaultMinistries() {
    return DEFAULT_MINISTRY_NAMES.map((name, index) => ({
        name,
        leader: '',
        description: `${name} ministry`,
        sortOrder: index
    }));
}

function sortMinistries(items) {
    return [...(items || [])].sort((a, b) => {
        const orderA = Number.isFinite(a && a.sortOrder) ? a.sortOrder : Number.MAX_SAFE_INTEGER;
        const orderB = Number.isFinite(b && b.sortOrder) ? b.sortOrder : Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) return orderA - orderB;
        return String((a && a.name) || '').localeCompare(String((b && b.name) || ''));
    });
}

function ensureDefaultMinistries() {
    const defaults = getDefaultMinistries();
    const localKey = 'charity_ministries';
    const mergeDefaults = (items) => {
        const existing = Array.isArray(items) ? items : [];
        const seen = new Set(existing.map(item => normalizeMinistryKey(item && item.name)));
        const missing = defaults.filter(item => !seen.has(normalizeMinistryKey(item.name)));
        return existing.concat(missing);
    };

    if (typeof db !== 'undefined' && db && typeof firebase !== 'undefined' && firebase.firestore) {
        return db.collection('ministries').get().then((snapshot) => {
            const existingDocs = snapshot.docs.map(doc => ({ _docId: doc.id, id: doc.id, ...doc.data() }));
            const merged = mergeDefaults(existingDocs);
            const existingNames = new Set(existingDocs.map(item => normalizeMinistryKey(item.name || item.id)));
            const missing = defaults.filter(item => !existingNames.has(normalizeMinistryKey(item.name)));
            if (missing.length === 0) return merged;

            return Promise.all(missing.map((item) => {
                const docId = normalizeMinistryKey(item.name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `ministry-${item.sortOrder}`;
                return db.collection('ministries').doc(docId).set({
                    ...item,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            })).then(() => merged);
        }).catch(() => {
            const merged = mergeDefaults(safeJsonParse(localStorage.getItem(localKey), [], localKey));
            localStorage.setItem(localKey, JSON.stringify(merged));
            return merged.map((item, index) => ({ _docId: index, id: index, ...item }));
        });
    }

    const merged = mergeDefaults(safeJsonParse(localStorage.getItem(localKey), [], localKey));
    localStorage.setItem(localKey, JSON.stringify(merged));
    return Promise.resolve(merged.map((item, index) => ({ _docId: index, id: index, ...item })));
}

/**
 * Read locally-managed application users from localStorage.
 * These are users created via Settings → User Management when Firebase is
 * unavailable or the admin is authenticated through the demo fallback.
 * NOTE: passwords are stored in plaintext for demo purposes only; this
 * approach is consistent with the hardcoded DEMO_USERS in login.html but
 * should not be used in a production environment.
 * @returns {Array} Array of user objects
 */
function getLocalAppUsers() {
    try {
        return JSON.parse(localStorage.getItem('localAppUsers')) || [];
    } catch (e) {
        console.warn('Failed to parse localAppUsers from localStorage:', e.message);
        return [];
    }
}
