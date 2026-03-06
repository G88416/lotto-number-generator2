// Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDIPGXu6QAIgSTNxgqOyRabOfwJ_uG_JYU",
    authDomain: "cms-charity.web.app",
    databaseURL: "https://cms-charity-default-rtdb.firebaseio.com",
    projectId: "cms-charity",
    storageBucket: "cms-charity.firebasestorage.app",
    messagingSenderId: "117716657336",
    appId: "1:117716657336:web:72082a130aac91d19fc04d",
    measurementId: "G-LJELJJYW9R"
};

// Initialize Firebase (will be used in individual pages)
let db = null;
let auth = null;
let analytics = null;
let functions = null;
let firebaseInitialized = false;
const JSON_ERROR_SNIPPET_MAX_LENGTH = 300;
const JSON_ERROR_SNIPPET_ELLIPSIS_OFFSET = 297;

/**
 * Safely parse JSON with a fallback value for invalid content or non-string input.
 * Returns the fallback when input is not a non-empty string or JSON parsing fails.
 * @param {string} raw
 * @param {*} fallback
 * @param {string|{label?: string, status?: number, contentType?: string}} [labelOrOptions]
 * @returns {*}
 */
function logJsonParseWarning(options, message, snippet, hint) {
    const label = options && options.label ? options.label : '';
    const target = label ? ` for ${label}` : '';
    const hintText = hint ? ` ${hint}` : '';
    console.warn(`Unable to parse JSON${target}${hintText}:`, message);
    if (options && typeof options.status === 'number') {
        console.warn('Status:', options.status);
    }
    if (options && 'contentType' in options) {
        const contentType = options.contentType ? options.contentType : '(not provided)';
        console.warn('Content-Type:', contentType);
    }
    console.warn(`Raw response (first ${JSON_ERROR_SNIPPET_MAX_LENGTH} chars):`, snippet);
}

function safeJsonParse(raw, fallback, labelOrOptions) {
    const options = typeof labelOrOptions === 'string'
        ? { label: labelOrOptions }
        : (labelOrOptions || {});
    if (typeof raw !== 'string') return fallback;
    const normalized = raw.trim();
    if (normalized === '') return fallback;
    const lowerPreview = normalized.toLowerCase();
    const looksLikeMarkup = lowerPreview.startsWith('<!doctype')
        || lowerPreview.startsWith('<?xml')
        || lowerPreview.startsWith('<html')
        || /^<\s*[a-z][a-z0-9-]*[\s>]/.test(lowerPreview);
    const snippet = normalized.length > JSON_ERROR_SNIPPET_MAX_LENGTH
        ? `${normalized.slice(0, JSON_ERROR_SNIPPET_ELLIPSIS_OFFSET)}...`
        : normalized;
    if (looksLikeMarkup) {
        logJsonParseWarning(options, 'Response appears to be XML/HTML instead of JSON.', snippet, '(content looks like XML/HTML)');
        return fallback;
    }
    try {
        return JSON.parse(normalized);
    } catch (err) {
        logJsonParseWarning(options, err.message, snippet, '');
        return fallback;
    }
}

/**
 * Read a fetch Response or axios response, log diagnostics, and safely parse JSON.
 * @param {Response|{data?: *, status?: number, headers?: Object}} response
 * @param {*} fallback
 * @param {string} [label]
 * @returns {Promise<*>}
 */
const INVALID_RESPONSE_MESSAGE = 'readJsonResponse expects a fetch Response or axios response.';

function getResponseContentType(response) {
    if (!response || !response.headers) return null;
    if (typeof response.headers.get === 'function') {
        return response.headers.get('content-type');
    }
    if (typeof response.headers === 'object' && response.headers['content-type']) {
        return response.headers['content-type'];
    }
    return null;
}

async function readJsonResponse(response, fallback, label) {
    if (!response) {
        console.warn(INVALID_RESPONSE_MESSAGE);
        return fallback;
    }
    const contentType = getResponseContentType(response);
    if (typeof response.text === 'function') {
        const text = await response.text();
        return safeJsonParse(text, fallback, {
            label,
            status: response.status,
            contentType
        });
    }
    if (Object.prototype.hasOwnProperty.call(response, 'data')) {
        const data = response.data;
        if (typeof data === 'string') {
            return safeJsonParse(data, fallback, {
                label,
                status: response.status,
                contentType
            });
        }
        return data == null ? fallback : data;
    }
    console.warn(INVALID_RESPONSE_MESSAGE);
    return fallback;
}

if (typeof window !== 'undefined') {
    window.safeJsonParse = safeJsonParse;
    window.readJsonResponse = readJsonResponse;
}

function initializeFirebase() {
    if (typeof firebase !== 'undefined' && !firebaseInitialized) {
        firebase.initializeApp(firebaseConfig);
        db = typeof firebase.firestore === 'function' ? firebase.firestore() : null;
        auth = typeof firebase.auth === 'function' ? firebase.auth() : null;
        if (auth && firebase.auth && firebase.auth.Auth && firebase.auth.Auth.Persistence) {
            auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
                .then(() => {
                    console.log('Firebase auth persistence set to local');
                })
                .catch((err) => console.error('Failed to set Firebase auth persistence to LOCAL:', err));
        }
        // Firebase Functions SDK is only loaded on pages that need it (login, settings).
        functions = typeof firebase.functions === 'function' ? firebase.functions() : null;
        if (typeof firebase.analytics === 'function') {
            analytics = firebase.analytics();
        }
        firebaseInitialized = true;
        console.log('Firebase initialized successfully');
    } else if (firebaseInitialized) {
        console.log('Firebase already initialized');
    } else {
        console.warn('Firebase SDK not loaded. Using localStorage fallback.');
    }
}

// Utility functions for Firebase/localStorage hybrid
function saveToFirebase(collection, data) {
    if (db) {
        return db.collection(collection).add({
            ...data,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).catch((error) => {
            console.warn('Firestore save failed, using localStorage fallback:', error.message);
            const key = `charity_${collection}`;
            const existing = safeJsonParse(localStorage.getItem(key), [], key);
            existing.push(data);
            localStorage.setItem(key, JSON.stringify(existing));
        });
    } else {
        // Fallback to localStorage
        const key = `charity_${collection}`;
        const existing = safeJsonParse(localStorage.getItem(key), [], key);
        existing.push(data);
        localStorage.setItem(key, JSON.stringify(existing));
        return Promise.resolve();
    }
}

function loadFromFirebase(collection, callback) {
    if (db) {
        db.collection(collection).onSnapshot((snapshot) => {
            const data = snapshot.docs.map(doc => ({ _docId: doc.id, id: doc.id, ...doc.data() }));
            // Sort by createdAt if available, otherwise by document ID
            data.sort((a, b) => {
                if (a.createdAt && b.createdAt) {
                    return b.createdAt.seconds - a.createdAt.seconds;
                }
                return 0;
            });
            callback(data);
        }, (error) => {
            console.warn('Firestore load failed, using localStorage fallback:', error.message);
            const key = `charity_${collection}`;
            const data = safeJsonParse(localStorage.getItem(key), [], key);
            const dataWithIds = data.map((item, index) => ({ _docId: index, ...item }));
            callback(dataWithIds);
        });
    } else {
        // Fallback to localStorage
        const key = `charity_${collection}`;
        const data = safeJsonParse(localStorage.getItem(key), [], key);
        // _docId is the numeric index used for deletion; id comes from stored data
        const dataWithIds = data.map((item, index) => ({ _docId: index, ...item }));
        callback(dataWithIds);
    }
}

function deleteFromFirebase(collection, id) {
    if (db && id && typeof id === 'string' && !id.match(/^\d+$/)) {
        // Firebase document ID (not a numeric index)
        return db.collection(collection).doc(id).delete().catch((error) => {
            console.warn('Firestore delete failed:', error.message);
        });
    } else {
        // Fallback to localStorage or numeric ID
        const key = `charity_${collection}`;
        const data = safeJsonParse(localStorage.getItem(key), [], key);
        const numericId = typeof id === 'number' ? id : parseInt(id);
        const filtered = data.filter((item, index) => index !== numericId);
        localStorage.setItem(key, JSON.stringify(filtered));
        return Promise.resolve();
    }
}

function updateInFirebase(collection, id, updates) {
    if (db && id) {
        return db.collection(collection).doc(id).update(updates).catch((error) => {
            console.warn('Firestore update failed:', error.message);
        });
    } else {
        // Fallback to localStorage
        const key = `charity_${collection}`;
        const data = safeJsonParse(localStorage.getItem(key), [], key);
        if (data[id]) {
            data[id] = { ...data[id], ...updates };
            localStorage.setItem(key, JSON.stringify(data));
        }
        return Promise.resolve();
    }
}
