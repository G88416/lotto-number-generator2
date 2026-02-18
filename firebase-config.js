// Firebase Configuration
// Replace these values with your actual Firebase project credentials
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase (will be used in individual pages)
let db = null;
let auth = null;
let firebaseInitialized = false;

function initializeFirebase() {
    if (typeof firebase !== 'undefined' && !firebaseInitialized) {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        auth = firebase.auth();
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
        });
    } else {
        // Fallback to localStorage
        const key = `charity_${collection}`;
        const existing = JSON.parse(localStorage.getItem(key)) || [];
        existing.push(data);
        localStorage.setItem(key, JSON.stringify(existing));
        return Promise.resolve();
    }
}

function loadFromFirebase(collection, callback) {
    if (db) {
        db.collection(collection).onSnapshot((snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Sort by createdAt if available, otherwise by document ID
            data.sort((a, b) => {
                if (a.createdAt && b.createdAt) {
                    return b.createdAt.seconds - a.createdAt.seconds;
                }
                return 0;
            });
            callback(data);
        });
    } else {
        // Fallback to localStorage
        const key = `charity_${collection}`;
        const data = JSON.parse(localStorage.getItem(key)) || [];
        // Add numeric IDs for localStorage items
        const dataWithIds = data.map((item, index) => ({ ...item, id: index }));
        callback(dataWithIds);
    }
}

function deleteFromFirebase(collection, id) {
    if (db && id && typeof id === 'string' && !id.match(/^\d+$/)) {
        // Firebase document ID (not a numeric index)
        return db.collection(collection).doc(id).delete();
    } else {
        // Fallback to localStorage or numeric ID
        const key = `charity_${collection}`;
        const data = JSON.parse(localStorage.getItem(key)) || [];
        const numericId = typeof id === 'number' ? id : parseInt(id);
        const filtered = data.filter((item, index) => index !== numericId);
        localStorage.setItem(key, JSON.stringify(filtered));
        return Promise.resolve();
    }
}

function updateInFirebase(collection, id, updates) {
    if (db && id) {
        return db.collection(collection).doc(id).update(updates);
    } else {
        // Fallback to localStorage
        const key = `charity_${collection}`;
        const data = JSON.parse(localStorage.getItem(key)) || [];
        if (data[id]) {
            data[id] = { ...data[id], ...updates };
            localStorage.setItem(key, JSON.stringify(data));
        }
        return Promise.resolve();
    }
}
