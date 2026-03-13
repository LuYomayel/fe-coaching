interface IServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
}

export interface IBeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function register(_config?: IServiceWorkerConfig): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
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

      if (navigator.serviceWorker.controller) {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    });
  }
}

function _registerValidSW(swUrl: string, config?: IServiceWorkerConfig): void {
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

function _checkValidServiceWorker(swUrl: string, config?: IServiceWorkerConfig): void {
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

export function unregister(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error: Error) => {
        console.error(error.message);
      });
  }
}

export function showInstallPrompt(): Promise<IBeforeInstallPromptEvent> {
  return new Promise((resolve) => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      resolve(e as IBeforeInstallPromptEvent);
    });
  });
}

export function installPWA(
  deferredPrompt: IBeforeInstallPromptEvent | null
): Promise<{ outcome: 'accepted' | 'dismissed' }> | undefined {
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
  return undefined;
}

export function requestNotificationPermission(): Promise<NotificationPermission> {
  if ('Notification' in window) {
    return Notification.requestPermission().then((permission) => {
      console.log('Permiso de notificaciones:', permission);
      return permission;
    });
  }
  return Promise.resolve('denied');
}

export function subscribeUserToPush(registration: ServiceWorkerRegistration): Promise<PushSubscription> {
  const applicationServerPublicKey = 'TU_CLAVE_PUBLICA_VAPID';

  const subscribeOptions: PushSubscriptionOptionsInit = {
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(applicationServerPublicKey).buffer as ArrayBuffer
  };

  return registration.pushManager.subscribe(subscribeOptions).then((pushSubscription) => {
    console.log('Usuario suscrito a push:', pushSubscription);
    return pushSubscription;
  });
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Keep references to suppress unused warnings - these are internal helpers
void _checkValidServiceWorker;
void _registerValidSW;
