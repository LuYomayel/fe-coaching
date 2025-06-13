import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './primereact.css';
import '../node_modules/primeflex/primeflex.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
  <App />
  // </React.StrictMode>
);

// Registrar el service worker para funcionalidad PWA solo en producción
if (process.env.NODE_ENV === 'production') {
  serviceWorkerRegistration.register({
    onSuccess: (registration) => {
      console.log('SW registrado exitosamente:', registration);
    },
    onUpdate: (registration) => {
      console.log('SW actualizado:', registration);
      // Aquí podrías mostrar una notificación al usuario sobre la actualización
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
      for (let registration of registrations) {
        registration.unregister();
        console.log('Service Worker desregistrado');
      }
    });
  }

  // Limpiar cache
  if ('caches' in window) {
    caches.keys().then(function (names) {
      for (let name of names) {
        caches.delete(name);
        console.log('Cache eliminado:', name);
      }
    });
  }
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
