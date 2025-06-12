const CACHE_NAME = 'easetrain-v1.0.0';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icono.png',
  '/logo192.png',
  '/logo512.png'
];

// Instalación del service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Cache abierto');
      return cache.addAll(urlsToCache);
    })
  );
});

// Activación del service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar peticiones de red
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - devolver respuesta del cache
      if (response) {
        return response;
      }

      return fetch(event.request)
        .then((response) => {
          // Verificar si recibimos una respuesta válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // IMPORTANTE: Clonar la respuesta
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Si falla fetch y no hay cache, mostrar página offline
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        });
    })
  );
});

// Manejar notificaciones push (opcional)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación de EaseTrain',
    icon: '/icono.png',
    badge: '/icono.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver detalles',
        icon: '/icono.png'
      },
      {
        action: 'close',
        title: 'Cerrar notificación',
        icon: '/icono.png'
      }
    ]
  };

  event.waitUntil(self.registration.showNotification('EaseTrain', options));
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    // Abrir la aplicación
    event.waitUntil(clients.openWindow('/'));
  }
});
