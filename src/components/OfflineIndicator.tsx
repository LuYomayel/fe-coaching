import { useState, useEffect } from 'react';
import { Message } from 'primereact/message';
import { Badge } from 'primereact/badge';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Mostrar mensaje inicial si está offline
    if (!navigator.onLine) {
      setShowOfflineMessage(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showOfflineMessage && isOnline) {
    return null;
  }

  return (
    <div
      className="offline-indicator"
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 9999,
        maxWidth: '300px'
      }}
    >
      {!isOnline ? (
        <Message severity="warn" text="Sin conexión - Funcionando en modo offline" style={{ width: '100%' }} />
      ) : (
        <Message severity="success" text="Conexión restaurada" style={{ width: '100%' }} />
      )}

      <div className="p-mt-2 p-text-center">
        <Badge value={isOnline ? 'Online' : 'Offline'} severity={isOnline ? 'success' : 'warning'} />
      </div>
    </div>
  );
};

export default OfflineIndicator;
