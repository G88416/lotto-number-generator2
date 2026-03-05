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
                .catch((err) => console.error('Persistence error:', err));
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
            const existing = JSON.parse(localStorage.getItem(key)) || [];
            existing.push(data);
            localStorage.setItem(key, JSON.stringify(existing));
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
            const data = JSON.parse(localStorage.getItem(key)) || [];
            const dataWithIds = data.map((item, index) => ({ _docId: index, ...item }));
            callback(dataWithIds);
        });
    } else {
        // Fallback to localStorage
        const key = `charity_${collection}`;
        const data = JSON.parse(localStorage.getItem(key)) || [];
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
        const data = JSON.parse(localStorage.getItem(key)) || [];
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
        const data = JSON.parse(localStorage.getItem(key)) || [];
        if (data[id]) {
            data[id] = { ...data[id], ...updates };
            localStorage.setItem(key, JSON.stringify(data));
        }
        return Promise.resolve();
    }
}
