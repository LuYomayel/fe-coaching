import ReactDOM from 'react-dom/client';
import './index.css';
import './primereact.css';
import '../node_modules/primeflex/primeflex.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

const root = ReactDOM.createRoot(rootElement);
root.render(
  // <React.StrictMode>
  <App />
  // </React.StrictMode>
);

// Registrar el service worker para funcionalidad PWA solo en producción
if (process.env.NODE_ENV === 'production') {
  serviceWorkerRegistration.register({
    onSuccess: (registration: ServiceWorkerRegistration) => {
      console.log('SW registrado exitosamente:', registration);
    },
    onUpdate: (registration: ServiceWorkerRegistration) => {
      console.log('SW actualizado:', registration);
      if (window.confirm('Hay una nueva versión disponible. ¿Deseas actualizar?')) {
        window.location.reload();
      }
    }
  });
} else {
  console.log('Service Worker desactivado en desarrollo');

  // Limpiar service worker y cache existente en desarrollo
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
      for (const registration of registrations) {
        registration.unregister();
        console.log('Service Worker desregistrado');
      }
    });
  }

  // Limpiar cache
  if ('caches' in window) {
    caches.keys().then(function (names) {
      for (const name of names) {
        caches.delete(name);
        console.log('Cache eliminado:', name);
      }
    });
  }
}

reportWebVitals();
