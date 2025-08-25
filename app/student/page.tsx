import React from 'react';

export default function StudentPage() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>🎓 Dashboard del Estudiante</h1>
      <p>Panel de control para alumnos</p>
      <div style={{ marginTop: '2rem' }}>
        <p>✅ Ruta: /student</p>
        <p>✅ SSR funcionando</p>
        <p>✅ Renderizado en servidor</p>
      </div>
    </div>
  );
}
