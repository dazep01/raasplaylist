/**
 * Raa's PlayList - Service Worker
 * Update CACHE_NAME setiap kali kamu melakukan perubahan besar pada index.html
 */
const CACHE_NAME = 'raaplayer-v1.2'; // Ubah versi ini (v1.3, v1.4, dst) agar user mendapat update
const ASSETS = [
  '/',
  'index.html',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://unpkg.com/@phosphor-icons/web'
];

// 1. Install Service Worker
self.addEventListener('install', (event) => {
  // Paksa SW yang baru untuk segera aktif tanpa menunggu tab ditutup
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching assets...');
      return cache.addAll(ASSETS);
    })
  );
});

// 2. Aktivasi & Pembersihan Cache Lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Menghapus cache lama:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      // Mengambil alih kontrol semua halaman yang terbuka segera
      return self.clients.claim();
    })
  );
});

// 3. Strategi Fetch: Stale-While-Revalidate
// Memberikan response instan dari cache, tapi tetap update cache dari network
self.addEventListener('fetch', (event) => {
  // Hanya tangani request GET (standard untuk aset)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Jika response valid, simpan/update ke cache
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Jika gagal koneksi (offline), tetap gunakan cache jika ada
      });

      // Kembalikan versi cache (cepat) atau tunggu network (jika belum ada di cache)
      return cachedResponse || fetchPromise;
    })
  );
});
