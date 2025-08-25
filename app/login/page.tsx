import React from 'react';

export default function LoginPage() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>🔐 Página de Login</h1>
      <p>Esta es la página de login renderizada con SSR</p>
      <div style={{ marginTop: '2rem' }}>
        <p>✅ Routing funcionando correctamente</p>
        <p>✅ SSR activo en /login</p>
      </div>
    </div>
  );
}
