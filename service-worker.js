const CACHE_CORE = "rd-core-v1";
const CACHE_DOCS = "rd-docs-v1";
const CORE_ASSETS = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "manifest.json",
  "content/registry.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/splash-1024.png"
];

let lastCheck = null;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_CORE).then(cache => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => ![CACHE_CORE, CACHE_DOCS].includes(k)).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // Network-first for registry, cache-first for static
    if (url.pathname.endsWith("registry.json")) {
      e.respondWith(networkThenCache(req, CACHE_CORE));
    } else {
      e.respondWith(cacheThenNetwork(req, CACHE_CORE));
    }
  } else {
    // Documents (PDF etc.): cache-first
    e.respondWith(cacheThenNetwork(req, CACHE_DOCS));
  }
});

self.addEventListener("message", async (event) => {
  const data = event.data || {};
  if (data.action === "cache") {
    try {
      const res = await fetch(data.url, {mode:"no-cors"});
      const cache = await caches.open(CACHE_DOCS);
      await cache.put(data.url, res);
      lastCheck = new Date().toISOString();
      notifyClients({type:"cache-status", url:data.url, cached:true});
      notifyClients({type:"last-check", when:lastCheck});
    } catch (e) {
      notifyClients({type:"cache-status", url:data.url, cached:false});
    }
  } else if (data.action === "uncache") {
    const cache = await caches.open(CACHE_DOCS);
    await cache.delete(data.url);
    notifyClients({type:"cache-status", url:data.url, cached:false});
  } else if (data.action === "report-last-check") {
    notifyClients({type:"last-check", when:lastCheck});
  }
});

function notifyClients(msg){
  self.clients.matchAll({includeUncontrolled:true, type:"window"}).then(clients => {
    clients.forEach(c => c.postMessage(msg));
  });
}

async function cacheThenNetwork(req, cacheName){
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) {
    // Update in background
    fetch(req).then(res => cache.put(req, res.clone())).catch(()=>{});
    return cached;
  }
  const res = await fetch(req);
  cache.put(req, res.clone());
  return res;
}

async function networkThenCache(req, cacheName){
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    cache.put(req, res.clone());
    lastCheck = new Date().toISOString();
    notifyClients({type:"last-check", when:lastCheck});
    return res;
  } catch (e) {
    const cached = await cache.match(req);
    if (cached) return cached;
    throw e;
  }
}
