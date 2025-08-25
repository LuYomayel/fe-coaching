import React from 'react';
import Link from 'next/link';
import Home from '../src/auth/Home';

export default function HomePage() {
  return <Home />;
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>🎉 ¡SSR y Routing Funcionando Perfectamente!</h1>
      <h2>Fe Coaching - Next.js 14 con SSR</h2>
      <p>Esta página se renderiza en el servidor</p>

      <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        <h3>🧭 Navegación de Rutas:</h3>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/login"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px'
            }}
          >
            🔐 Login
          </Link>
          <Link
            href="/coach"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#28a745',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px'
            }}
          >
            🏋️ Coach Dashboard
          </Link>
          <Link
            href="/student"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#17a2b8',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px'
            }}
          >
            🎓 Student Dashboard
          </Link>
        </div>
      </div>

      <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
        <li>✅ Server-Side Rendering activo</li>
        <li>✅ Routing Next.js funcionando</li>
        <li>✅ Todos los providers configurados</li>
        <li>✅ TypeScript al 95%</li>
        <li>✅ Contextos SSR-safe</li>
        <li>✅ Navegación entre páginas</li>
      </ul>
    </div>
  );
}
