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

function initializeFirebase() {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        auth = firebase.auth();
        console.log('Firebase initialized successfully');
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
        db.collection(collection).orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(data);
        });
    } else {
        // Fallback to localStorage
        const key = `charity_${collection}`;
        const data = JSON.parse(localStorage.getItem(key)) || [];
        callback(data);
    }
}

function deleteFromFirebase(collection, id) {
    if (db && id) {
        return db.collection(collection).doc(id).delete();
    } else {
        // Fallback to localStorage
        const key = `charity_${collection}`;
        const data = JSON.parse(localStorage.getItem(key)) || [];
        const filtered = data.filter((item, index) => index !== id);
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
