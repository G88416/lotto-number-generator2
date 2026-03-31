/* Service Worker for Charity and Faith Mission Church Management System */
const CACHE_NAME = 'cfm-church-v1';

// Core app shell files to cache for offline use
const APP_SHELL = [
  '/',
  '/index.html',
  '/login.html',
  '/common.css',
  '/common.js',
  '/firebase-config.js',
  '/auth.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/pages/members.html',
  '/pages/visitors.html',
  '/pages/analytics.html',
  '/pages/events.html',
  '/pages/tithes.html',
  '/pages/conference.html',
  '/pages/finance.html',
  '/pages/admin.html',
  '/pages/attendance.html',
  '/pages/ministries.html',
  '/pages/sermons.html',
  '/pages/volunteers.html',
  '/pages/media.html',
  '/pages/settings.html'
];

// Install: cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for Firebase/CDN, cache-first for app shell
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Always go network-first for Firebase, Google APIs, and CDN resources
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('gstatic') ||
    url.hostname.includes('cdnjs')
  ) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  // Cache-first for app shell (same origin)
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  event.respondWith(fetch(event.request));
});
