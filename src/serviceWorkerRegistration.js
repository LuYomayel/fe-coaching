// serviceWorkerRegistration.js

export function register(_config) {
  // Por defecto, desregistrar service workers y limpiar cache
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // Desregistrar todos los service workers
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration
            .unregister()
            .then((success) => {
              if (success) {
                console.log('Service Worker desregistrado exitosamente');
              }
            })
            .catch((error) => {
              console.error('Error al desregistrar service worker:', error);
            });
        }
      });

      // Limpiar todos los caches
      if ('caches' in window) {
        caches
          .keys()
          .then((cacheNames) => {
            return Promise.all(
              cacheNames.map((cacheName) => {
                console.log('Eliminando cache:', cacheName);
                return caches.delete(cacheName);
              })
            );
          })
          .then(() => {
            console.log('Todos los caches han sido eliminados');
          })
          .catch((error) => {
            console.error('Error al eliminar caches:', error);
          });
      }

      // Si hay un service worker activo, recargar la página después de limpiar
      if (navigator.serviceWorker.controller) {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    });
  }
}

function _registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('Service Worker registrado exitosamente:', registration);

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log(
                'Nuevo contenido disponible y será usado cuando todas las ' + 'pestañas de esta página estén cerradas.'
              );

              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              console.log('Contenido cacheado para uso offline.');

              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('Error durante el registro del service worker:', error);
    });
}

function _checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' }
  })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (response.status === 404 || (contentType != null && contentType.indexOf('javascript') === -1)) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        _registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('No hay conexión a internet. La app está funcionando en modo offline.');
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

// Función para mostrar notificación de instalación
export function showInstallPrompt() {
  let deferredPrompt;

  return new Promise((resolve) => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      resolve(deferredPrompt);
    });
  });
}

// Función para instalar la PWA
export function installPWA(deferredPrompt) {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    return deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('Usuario aceptó instalar la PWA');
      } else {
        console.log('Usuario rechazó instalar la PWA');
      }
      return choiceResult;
    });
  }
}

// Función para solicitar permisos de notificaciones
export function requestNotificationPermission() {
  if ('Notification' in window) {
    return Notification.requestPermission().then((permission) => {
      console.log('Permiso de notificaciones:', permission);
      return permission;
    });
  }
  return Promise.resolve('denied');
}

// Función para suscribirse a notificaciones push
export function subscribeUserToPush(registration) {
  const applicationServerPublicKey = 'TU_CLAVE_PUBLICA_VAPID'; // Deberás obtener esta clave

  const subscribeOptions = {
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(applicationServerPublicKey)
  };

  return registration.pushManager.subscribe(subscribeOptions).then((pushSubscription) => {
    console.log('Usuario suscrito a push:', pushSubscription);
    return pushSubscription;
  });
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
