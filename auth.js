// Authentication and Authorization Helper

// Role permissions configuration
const ROLE_PERMISSIONS = {
    admin: {
        name: 'Admin',
        pages: ['members', 'visitors', 'analytics', 'events', 'tithes', 'admin', 'attendance', 'prayers', 'sermons', 'volunteers', 'media', 'settings'],
        canEdit: true,
        canDelete: true
    },
    genesis: {
        name: 'Genesis Service',
        pages: ['members', 'visitors', 'tithes', 'attendance', 'events', 'media'],
        canEdit: true,
        canDelete: true
    },
    branch: {
        name: 'Branch Co',
        pages: ['members', 'visitors', 'tithes', 'attendance'],
        canEdit: true,
        canDelete: true
    },
    pastor: {
        name: 'Pastors Info',
        pages: ['members', 'visitors', 'analytics', 'events', 'tithes', 'admin', 'attendance', 'prayers', 'sermons', 'volunteers', 'media', 'settings'],
        canEdit: false,
        canDelete: false
    }
};

// Check if user is authenticated
function checkAuth() {
    const session = localStorage.getItem('userSession');
    const currentPage = window.location.pathname;
    
    if (!session) {
        // Not logged in, redirect to login page
        if (!currentPage.includes('login.html')) {
            window.location.href = currentPage.includes('/pages/') ? '../login.html' : 'login.html';
        }
        return null;
    }
    
    try {
        const userSession = JSON.parse(session);
        return userSession;
    } catch (e) {
        // Invalid session, clear and redirect
        localStorage.removeItem('userSession');
        window.location.href = currentPage.includes('/pages/') ? '../login.html' : 'login.html';
        return null;
    }
}

// Check if user has access to a specific page
function checkPageAccess(pageName) {
    const userSession = checkAuth();
    if (!userSession) return false;
    
    const permissions = ROLE_PERMISSIONS[userSession.role];
    if (!permissions) return false;
    
    return permissions.pages.includes(pageName);
}

// Check if user can edit
function canEdit() {
    const userSession = checkAuth();
    if (!userSession) return false;
    
    const permissions = ROLE_PERMISSIONS[userSession.role];
    return permissions ? permissions.canEdit : false;
}

// Check if user can delete
function canDelete() {
    const userSession = checkAuth();
    if (!userSession) return false;
    
    const permissions = ROLE_PERMISSIONS[userSession.role];
    return permissions ? permissions.canDelete : false;
}

// Get current user info
function getCurrentUser() {
    const session = localStorage.getItem('userSession');
    if (!session) return null;
    
    try {
        return JSON.parse(session);
    } catch (e) {
        return null;
    }
}

// Filter navigation based on user role
function filterNavigation() {
    const userSession = getCurrentUser();
    if (!userSession) return;
    
    const permissions = ROLE_PERMISSIONS[userSession.role];
    if (!permissions) return;
    
    const navLinks = document.querySelectorAll('nav ul li');
    
    navLinks.forEach(li => {
        const link = li.querySelector('a');
        if (!link) return;
        
        const href = link.getAttribute('href');
        if (!href) return;
        
        // Extract page name from href
        let pageName = href.replace(/^(\.\.\/)?pages\//, '').replace('.html', '');
        
        // Handle index.html as dashboard
        if (pageName === 'index' || pageName === '../index' || pageName === '') {
            pageName = 'dashboard';
        }
        
        // Dashboard is always accessible
        if (pageName === 'dashboard' || pageName === '') {
            return;
        }
        
        // Check if user has access to this page
        if (!permissions.pages.includes(pageName)) {
            li.style.display = 'none';
        }
    });
}

// Disable edit/delete buttons based on permissions
function applyEditPermissions() {
    const editAllowed = canEdit();
    const deleteAllowed = canDelete();
    
    if (!editAllowed || !deleteAllowed) {
        // Disable submit buttons on forms if editing not allowed
        if (!editAllowed) {
            const forms = document.querySelectorAll('form');
            forms.forEach(form => {
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn && !submitBtn.id.includes('export') && !submitBtn.id.includes('import')) {
                    submitBtn.disabled = true;
                    submitBtn.style.opacity = '0.5';
                    submitBtn.style.cursor = 'not-allowed';
                    submitBtn.title = 'You do not have permission to add/edit items';
                }
            });
            
            // Disable input fields
            const inputs = document.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if (!input.id.includes('search') && !input.id.includes('filter')) {
                    input.disabled = true;
                    input.style.opacity = '0.7';
                }
            });
        }
    }
}

// Protect delete buttons
function protectDeleteButtons() {
    const deleteAllowed = canDelete();
    
    if (!deleteAllowed) {
        // Use mutation observer to watch for dynamically added delete buttons
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Check for delete buttons
                        const deleteButtons = node.querySelectorAll ? 
                            node.querySelectorAll('button') : 
                            (node.tagName === 'BUTTON' ? [node] : []);
                        
                        deleteButtons.forEach(btn => {
                            if (btn.textContent.includes('Delete') || btn.textContent.includes('🗑️') || btn.onclick && btn.onclick.toString().includes('delete')) {
                                btn.disabled = true;
                                btn.style.opacity = '0.5';
                                btn.style.cursor = 'not-allowed';
                                btn.title = 'You do not have permission to delete items';
                                btn.onclick = null;
                            }
                        });
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Also check existing buttons
        setTimeout(() => {
            const allButtons = document.querySelectorAll('button');
            allButtons.forEach(btn => {
                if (btn.textContent.includes('Delete') || btn.textContent.includes('🗑️')) {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                    btn.style.cursor = 'not-allowed';
                    btn.title = 'You do not have permission to delete items';
                    btn.onclick = null;
                }
            });
        }, 500);
    }
}

// Update header to show current user
function updateHeaderWithUser() {
    const userSession = getCurrentUser();
    if (!userSession) return;
    
    const header = document.querySelector('header div');
    if (header) {
        const existingUserInfo = header.querySelector('.user-info');
        if (!existingUserInfo) {
            const userInfo = document.createElement('p');
            userInfo.className = 'user-info';
            userInfo.style.fontSize = '13px';
            userInfo.style.opacity = '0.85';
            userInfo.style.marginTop = '5px';
            userInfo.textContent = `Logged in as: ${userSession.name} (${ROLE_PERMISSIONS[userSession.role].name})`;
            header.appendChild(userInfo);
        }
    }
}

// Initialize authentication on page load
function initAuth() {
    // Check if we're on the login page
    if (window.location.pathname.includes('login.html')) {
        return; // Don't check auth on login page
    }

    // When Firebase Authentication is configured, listen for auth state changes.
    // This ensures sessions created via Firebase are invalidated if the Firebase
    // user signs out (e.g., on another device or from the Firebase Console).
    if (typeof auth !== 'undefined' && auth && firebaseInitialized) {
        auth.onAuthStateChanged((user) => {
            const session = JSON.parse(localStorage.getItem('userSession') || 'null');
            if (!user && session && session.firebaseUid) {
                // Firebase reports the user is signed out but localStorage still has a
                // Firebase-backed session — clear it and redirect to login.
                localStorage.removeItem('userSession');
                const currentPage = window.location.pathname;
                window.location.href = currentPage.includes('/pages/') ? '../login.html' : 'login.html';
            }
        });
    }
    
    // Check authentication
    const userSession = checkAuth();
    if (!userSession) return;
    
    // Get current page name
    const currentPath = window.location.pathname;
    let pageName = '';
    
    if (currentPath.includes('/pages/')) {
        pageName = currentPath.split('/pages/')[1].replace('.html', '');
    } else if (currentPath.includes('index.html') || currentPath.endsWith('/')) {
        pageName = 'dashboard';
    }
    
    // Check if user has access to current page
    if (pageName && pageName !== 'dashboard') {
        const hasAccess = checkPageAccess(pageName);
        if (!hasAccess) {
            alert('You do not have permission to access this page.');
            window.location.href = currentPath.includes('/pages/') ? '../index.html' : 'index.html';
            return;
        }
    }
    
    // Apply UI modifications
    // Wait for DOM to be fully loaded before applying UI modifications
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            filterNavigation();
            updateHeaderWithUser();
            applyEditPermissions();
            protectDeleteButtons();
        });
    } else {
        filterNavigation();
        updateHeaderWithUser();
        applyEditPermissions();
        protectDeleteButtons();
    }
}

// Run auth check when script loads
initAuth();
