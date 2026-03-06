// Authentication and Authorization Helper
// Roles are resolved from Firebase ID token custom claims (authoritative).
// Firestore appUsers and localStorage session are used as fallbacks for
// migration compatibility and demo / offline mode.

// Role permissions configuration
const ROLE_PERMISSIONS = {
    admin: {
        name: 'Admin',
        pages: ['members', 'visitors', 'analytics', 'events', 'tithes', 'finance', 'admin', 'attendance', 'prayers', 'sermons', 'volunteers', 'media', 'settings'],
        canEdit: true,
        canDelete: true
    },
    genesis: {
        name: 'Genesis Service',
        pages: ['members', 'visitors', 'tithes', 'finance', 'attendance', 'events', 'media'],
        canEdit: true,
        canDelete: true
    },
    branch: {
        name: 'Branch Co',
        pages: ['members', 'visitors', 'tithes', 'finance', 'attendance'],
        canEdit: true,
        canDelete: true
    },
    pastor: {
        name: 'Pastors Info',
        pages: ['members', 'visitors', 'analytics', 'events', 'tithes', 'finance', 'admin', 'attendance', 'prayers', 'sermons', 'volunteers', 'media', 'settings'],
        canEdit: false,
        canDelete: false
    }
};

/** Valid application roles – used for claim validation. */
const VALID_ROLES = ['admin', 'genesis', 'branch', 'pastor'];

// Module-level cache populated once Firebase auth resolves.
// Role is read from Firebase ID token custom claims (authoritative source).
let _currentUserData = null;

// -- Role resolution helpers --------------------------------------------------

/**
 * Read the user's role from Firebase ID token custom claims.
 * Supports { role: 'admin' } and boolean { admin: true } claim shapes.
 * Returns the role string, or null if no valid claim is present.
 */
async function _getRoleFromToken(firebaseUser) {
    try {
        const result = await firebaseUser.getIdTokenResult();
        const c = result.claims;
        // String claim: token.role == 'admin'
        if (c.role && ROLE_PERMISSIONS[c.role]) return c.role;
        // Boolean claims: token.admin == true
        for (const r of VALID_ROLES) {
            if (c[r] === true) return r;
        }
    } catch (e) {
        console.warn('[auth] Could not read ID token claims:', e.message);
    }
    return null;
}

/**
 * Read the user's role from the Firestore appUsers profile.
 * Used as a fallback during migration (before custom claims are set).
 * Returns the role string, or null if not found / Firestore unavailable.
 */
async function _getRoleFromFirestore(uid) {
    if (typeof db === 'undefined' || !db) return null;
    try {
        const doc = await db.collection('appUsers').doc(uid).get();
        if (doc.exists) {
            const r = doc.data().role;
            if (r && ROLE_PERMISSIONS[r]) return r;
        }
    } catch (e) {
        console.warn('[auth] Could not read Firestore profile:', e.message);
    }
    return null;
}

// -- Public API ---------------------------------------------------------------

/**
 * Get the currently authenticated user data.
 * Prefers the Firebase-resolved cache (_currentUserData); falls back to the
 * localStorage session for demo / offline mode.
 */
function getCurrentUser() {
    if (_currentUserData) return _currentUserData;
    // Fallback: localStorage session (demo or offline)
    try {
        const raw = localStorage.getItem('userSession');
        if (raw) {
            const s = JSON.parse(raw);
            if (s && s.role && ROLE_PERMISSIONS[s.role]) return s;
        }
    } catch (_) { /* ignore */ }
    return null;
}

/**
 * Synchronous auth check. Returns current user data or null.
 * When Firebase auth is being resolved asynchronously this may return null
 * briefly; access control is enforced inside the async onAuthStateChanged
 * callback in initAuth().
 */
function checkAuth() {
    return getCurrentUser();
}

/** Returns true if the current user can access the given page. */
function checkPageAccess(pageName) {
    const user = getCurrentUser();
    if (!user) return false;
    const perms = ROLE_PERMISSIONS[user.role];
    return perms ? perms.pages.includes(pageName) : false;
}

/** Returns true if the current user has edit permission. */
function canEdit() {
    const user = getCurrentUser();
    if (!user) return false;
    const perms = ROLE_PERMISSIONS[user.role];
    return perms ? perms.canEdit : false;
}

/** Returns true if the current user has delete permission. */
function canDelete() {
    const user = getCurrentUser();
    if (!user) return false;
    const perms = ROLE_PERMISSIONS[user.role];
    return perms ? perms.canDelete : false;
}

// -- UI helpers ---------------------------------------------------------------

/** Hide nav links the current user cannot access. */
function filterNavigation() {
    const user = getCurrentUser();
    if (!user) return;
    const perms = ROLE_PERMISSIONS[user.role];
    if (!perms) return;
    document.querySelectorAll('nav ul li').forEach(li => {
        const link = li.querySelector('a');
        if (!link) return;
        const href = link.getAttribute('href');
        if (!href) return;
        let pageName = href.replace(/^(\.\.\/)?pages\//, '').replace('.html', '');
        if (pageName === 'index' || pageName === '../index' || pageName === '') pageName = 'dashboard';
        if (pageName === 'dashboard' || pageName === '') return;
        if (!perms.pages.includes(pageName)) li.style.display = 'none';
    });
}

/** Disable form inputs / submit buttons when the user cannot edit. */
function applyEditPermissions() {
    if (!canEdit()) {
        document.querySelectorAll('form').forEach(form => {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn && !submitBtn.id.includes('export') && !submitBtn.id.includes('import')) {
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.5';
                submitBtn.style.cursor = 'not-allowed';
                submitBtn.title = 'You do not have permission to add/edit items';
            }
        });
        document.querySelectorAll('input, select, textarea').forEach(input => {
            if (!input.id.includes('search') && !input.id.includes('filter')) {
                input.disabled = true;
                input.style.opacity = '0.7';
            }
        });
    }
}

const BUTTON_SCAN_DELAY = 200;

/** Collect buttons from a DOM node for permission checks. */
function collectButtons(node) {
    if (!node || node.nodeType !== 1) return [];
    const isButton = typeof node.matches === 'function'
        ? node.matches('button')
        : node.tagName === 'BUTTON';
    return isButton ? [node] : Array.from(node.querySelectorAll('button'));
}

/** Observe DOM mutations and disable delete buttons when the user cannot delete. */
function protectDeleteButtons() {
    if (!canDelete()) {
        const disableBtn = btn => {
            if (btn.textContent.includes('Delete') || btn.textContent.includes('🗑️') ||
                (btn.onclick && btn.onclick.toString().includes('delete'))) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
                btn.title = 'You do not have permission to delete items';
                btn.onclick = null;
            }
        };
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    collectButtons(node).forEach(disableBtn);
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => {
            document.querySelectorAll('button').forEach(disableBtn);
        }, BUTTON_SCAN_DELAY);
    }
}

/** Disable edit buttons when the user cannot edit. */
function protectEditButtons() {
    if (!canEdit()) {
        const disableBtn = btn => {
            const action = btn.dataset ? btn.dataset.action : '';
            if (btn.classList.contains('edit-action') || btn.classList.contains('edit-user-btn') ||
                (action && action.includes('edit'))) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
                btn.title = 'You do not have permission to edit items';
                btn.onclick = null;
            }
        };
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    collectButtons(node).forEach(disableBtn);
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => {
            document.querySelectorAll('button').forEach(disableBtn);
        }, BUTTON_SCAN_DELAY);
    }
}

/** Show the logged-in user's name and role in the page header. */
function updateHeaderWithUser() {
    const user = getCurrentUser();
    if (!user) return;
    const header = document.querySelector('header div');
    if (header && !header.querySelector('.user-info')) {
        const userInfo = document.createElement('p');
        userInfo.className = 'user-info';
        userInfo.style.cssText = 'font-size:13px;opacity:0.85;margin-top:5px;';
        const roleName = ROLE_PERMISSIONS[user.role] ? ROLE_PERMISSIONS[user.role].name : user.role;
        userInfo.textContent = `Logged in as: ${user.name} (${roleName})`;
        header.appendChild(userInfo);
    }
}

/** Apply all UI modifications after auth resolves. */
function _applyAuthUI() {
    filterNavigation();
    updateHeaderWithUser();
    applyEditPermissions();
    protectEditButtons();
    protectDeleteButtons();
}

/** Redirect to the login page. */
function _redirectToLogin() {
    const p = window.location.pathname;
    window.location.href = p.includes('/pages/') ? '../login.html' : 'login.html';
}

// -- Main init ----------------------------------------------------------------

/**
 * initAuth – called once when auth.js loads.
 *
 * When Firebase is available:
 *   1. Waits for onAuthStateChanged.
 *   2. Reads the user's role from Firebase ID token custom claims (authoritative).
 *   3. Falls back to Firestore appUsers profile (migration / transition).
 *   4. Falls back to localStorage session (demo / offline mode).
 *   5. Caches result in _currentUserData.
 *   6. Enforces page-level access control and applies UI modifications.
 *
 * When Firebase is not available (demo / offline):
 *   Uses the localStorage session directly.
 */
function initAuth() {
    // Skip auth check on the login page — handles both /login.html and /login (cleanUrls).
    const pathname = window.location.pathname;
    if (pathname.includes('login.html') || pathname === '/login' || pathname.endsWith('/login')) return;

    if (typeof auth !== 'undefined' && auth && firebaseInitialized) {
        auth.onAuthStateChanged(async (firebaseUser) => {
            if (!firebaseUser) {
                // No Firebase session. Fall back to localStorage for demo / offline
                // users who have no Firebase Auth account (no firebaseUid stored).
                // Firebase-authenticated users (firebaseUid present) must have an
                // active Firebase session; if it is gone they are signed out.
                try {
                    const raw = localStorage.getItem('userSession');
                    if (raw) {
                        const s = JSON.parse(raw);
                        if (s && s.role && ROLE_PERMISSIONS[s.role] && !s.firebaseUid) {
                            _currentUserData = s;
                            const path = window.location.pathname;
                            let pageName = '';
                            if (path.includes('/pages/')) {
                                pageName = path.split('/pages/')[1].replace('.html', '');
                            } else if (path.includes('index.html') || path.endsWith('/') || path === '/index' || path.endsWith('/index')) {
                                pageName = 'dashboard';
                            }
                            if (pageName && pageName !== 'dashboard' && !checkPageAccess(pageName)) {
                                alert('You do not have permission to access this page.');
                                window.location.href = path.includes('/pages/') ? '../index.html' : 'index.html';
                                return;
                            }
                            if (document.readyState === 'loading') {
                                document.addEventListener('DOMContentLoaded', _applyAuthUI);
                            } else {
                                _applyAuthUI();
                            }
                            return;
                        }
                    }
                } catch (_) { /* ignore */ }
                _currentUserData = null;
                _redirectToLogin();
                return;
            }

            // 1. Firebase custom claims – authoritative role source
            let role = await _getRoleFromToken(firebaseUser);

            // 2. Firestore appUsers profile – transition fallback
            if (!role) role = await _getRoleFromFirestore(firebaseUser.uid);

            // 3. localStorage session – demo / offline fallback
            if (!role) {
                try {
                    const s = JSON.parse(localStorage.getItem('userSession') || 'null');
                    if (s && s.role && ROLE_PERMISSIONS[s.role]) role = s.role;
                } catch (_) { /* ignore */ }
            }

            if (!role) {
                alert('Your account role is not configured. Contact an administrator.');
                auth.signOut();
                _redirectToLogin();
                return;
            }

            // Build display fields from Firebase profile + cached session
            let name = firebaseUser.displayName || '';
            let username = '';
            try {
                const s = JSON.parse(localStorage.getItem('userSession') || 'null');
                if (s) {
                    if (!name) name = s.name || '';
                    username = s.username || '';
                }
            } catch (_) { /* ignore */ }
            if (!username && firebaseUser.email) username = firebaseUser.email.split('@')[0];

            _currentUserData = {
                uid: firebaseUser.uid,
                firebaseUid: firebaseUser.uid,
                username,
                name,
                role
            };

            // Enforce page-level access
            const path = window.location.pathname;
            let pageName = '';
            if (path.includes('/pages/')) {
                pageName = path.split('/pages/')[1].replace('.html', '');
            } else if (path.includes('index.html') || path.endsWith('/') || path === '/index' || path.endsWith('/index')) {
                pageName = 'dashboard';
            }
            if (pageName && pageName !== 'dashboard') {
                const perms = ROLE_PERMISSIONS[role];
                if (!perms || !perms.pages.includes(pageName)) {
                    alert('You do not have permission to access this page.');
                    window.location.href = path.includes('/pages/') ? '../index.html' : 'index.html';
                    return;
                }
            }

            // Apply UI modifications
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', _applyAuthUI);
            } else {
                _applyAuthUI();
            }
        });
        return;
    }

    // Demo / offline mode – synchronous localStorage check
    try {
        const raw = localStorage.getItem('userSession');
        if (!raw) { _redirectToLogin(); return; }
        const userSession = JSON.parse(raw);
        if (!userSession || !userSession.role || !ROLE_PERMISSIONS[userSession.role]) {
            localStorage.removeItem('userSession');
            _redirectToLogin();
            return;
        }
        _currentUserData = userSession;

        const path = window.location.pathname;
        let pageName = '';
        if (path.includes('/pages/')) {
            pageName = path.split('/pages/')[1].replace('.html', '');
        } else if (path.includes('index.html') || path.endsWith('/') || path === '/index' || path.endsWith('/index')) {
            pageName = 'dashboard';
        }
        if (pageName && pageName !== 'dashboard' && !checkPageAccess(pageName)) {
            alert('You do not have permission to access this page.');
            window.location.href = path.includes('/pages/') ? '../index.html' : 'index.html';
            return;
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', _applyAuthUI);
        } else {
            _applyAuthUI();
        }
    } catch (e) {
        localStorage.removeItem('userSession');
        _redirectToLogin();
    }
}

// Run auth check when script loads
initAuth();
