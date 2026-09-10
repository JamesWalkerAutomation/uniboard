// sw v6 — network-first, офлайн-fallback
var C = 'ub6';
var SHELL = ['./', './index.html', './app.js',
  './manifest.webmanifest', './icon.svg'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(C).then(function (c) {
    return c.addAll(SHELL);
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) {
      return k !== C;
    }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var u = new URL(e.request.url);
  if (u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(function (r) {
    var c = r.clone();
    caches.open(C).then(function (cc) {
      cc.put(e.request, c);
    });
    return r;
  }).catch(function () {
    return caches.match(e.request).then(function (m) {
      return m || caches.match('./index.html');
    });
  }));
});
