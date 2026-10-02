// Service Worker for AquiGastos - Notifications & Offline Cache
const CACHE_NAME = 'aquigastos-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Push Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// Listen for push events if push service is connected
self.addEventListener('push', (event) => {
  let data = { title: 'AquiGastos', body: 'Lembrete de Vencimento' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    data.body = event.data?.text() || data.body;
  }

  const options = {
    body: data.body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    vibrate: [150, 50, 150],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
