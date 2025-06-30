importScripts("https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js");

// Saat service worker di-install
self.addEventListener("install", (event) => {
  console.log("Service Worker: Terpasang");
  // Lewati waiting hanya saat install pertama kali, bukan saat update
  if (!self.registration.active) {
    self.skipWaiting();
  }
});

// Saat service worker di-activate
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Aktif");
  // Tidak langsung claim client agar tidak menyebabkan refresh otomatis
  // event.waitUntil(self.clients.claim());
});

// Inject manifest di sini (Workbox akan mengganti ini saat build)
self.__WB_MANIFEST;

if (workbox) {
  console.log("Workbox berhasil dimuat");

  // Precaching: cache file inti aplikasi (app shell)
  workbox.precaching.precacheAndRoute([
    { url: "/", revision: "1" },
    { url: "/index.html", revision: "1" },
    { url: "/manifest.json", revision: "1" },
    { url: "/images/logo.png", revision: "1" },
    { url: "/images/story.svg", revision: "1" },
    { url: "/images/logo-192x192.png", revision: "1" },
    { url: "/images/logo-512x512.png", revision: "1" },
    { url: "/images/offline.svg", revision: "1" },
    { url: "/app.bundle.js", revision: "1" },
    { url: "/sw.js", revision: "1" },
  ]);

  // Cache file CSS dan JS dengan strategi stale-while-revalidate
  workbox.routing.registerRoute(
    ({ request }) => request.destination === "style" || request.destination === "script",
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: "static-resources",
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 hari
        }),
      ],
    })
  );

  // Cache gambar dengan strategi cache-first
  workbox.routing.registerRoute(
    ({ request }) => request.destination === "image",
    new workbox.strategies.CacheFirst({
      cacheName: "images",
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 hari
        }),
      ],
    })
  );

  // Cache font dari CDN dengan stale-while-revalidate
  workbox.routing.registerRoute(
    ({ url }) => url.origin === "https://fonts.googleapis.com" || url.origin === "https://fonts.gstatic.com" || url.origin === "https://cdnjs.cloudflare.com",
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: "fonts-stylesheets",
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 tahun
        }),
      ],
    })
  );

  // Cache API dengan strategi network-first
  workbox.routing.registerRoute(
    ({ url }) => url.origin === "https://story-api.dicoding.dev",
    new workbox.strategies.NetworkFirst({
      cacheName: "api-responses",
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24, // 1 hari
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // Fallback untuk permintaan navigasi: selalu kembalikan index.html
  workbox.routing.registerRoute(
    ({ request }) => request.mode === "navigate",
    async () => {
      try {
        return await workbox.strategies
          .NetworkFirst({
            cacheName: "pages",
            plugins: [
              new workbox.expiration.ExpirationPlugin({
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 hari
              }),
            ],
          })
          .handle({ request: new Request("/index.html") });
      } catch (error) {
        return caches.match("/index.html");
      }
    }
  );
}

// Handler fallback custom jika permintaan gagal
workbox.routing.setCatchHandler(async ({ event }) => {
  if (event.request.destination === "document") {
    // Jika gagal navigasi, fallback ke index.html
    if (event.request.mode === "navigate") {
      return caches.match("/index.html");
    }
    return caches.match("/index.html");
  }

  if (event.request.destination === "image") {
    // Jika gambar gagal dimuat, tampilkan gambar offline
    return caches.match("/images/offline.svg");
  }

  return Response.error();
});

// Event push notification (notifikasi dari server)
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push diterima");

  const dataJson = event.data.json();
  const notification = {
    title: dataJson.title || "Notifikasi Baru",
    options: {
      body: dataJson.message || "Ada sesuatu yang baru!",
      icon: "images/story.svg",
      badge: "images/logo.png",
      data: {
        url: dataJson.url || "/",
      },
    },
  };

  event.waitUntil(self.registration.showNotification(notification.title, notification.options));
});

// Event klik pada notifikasi push
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((windowClients) => {
        // Jika sudah ada tab dengan url yang sama, fokuskan
        for (const client of windowClients) {
          if (client.url.includes(urlToOpen) && "focus" in client) {
            return client.focus();
          }
        }
        // Jika belum ada, buka tab baru
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
