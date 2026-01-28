# Configuración de Ruteo en React

## Librería: React Router

Usamos `react-router-dom` para el manejo de rutas en React (no Next.js).

## Instalación

```bash
npm install react-router-dom
npm install -D @types/react-router-dom
```

## Estructura de Rutas

### Archivo Principal: `src/App.tsx`

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Páginas
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Rutas protegidas */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          
          {/* Ruta 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

### Componente de Ruta Protegida

```typescript
// components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      Cargando...
    </div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

## Navegación Programática

```typescript
import { useNavigate } from 'react-router-dom';

export const useHomePage = () => {
  const navigate = useNavigate();

  const goToProfile = () => {
    navigate('/profile');
  };

  const goBack = () => {
    navigate(-1);
  };

  return { goToProfile, goBack };
};
```

## Links en Componentes

```typescript
import { Link } from 'react-router-dom';

export const Navigation = () => {
  return (
    <nav className="flex gap-4">
      <Link to="/" className="text-blue-600 hover:underline">
        Home
      </Link>
      <Link to="/profile" className="text-blue-600 hover:underline">
        Profile
      </Link>
    </nav>
  );
};
```

## Reglas

- ✅ Usar `BrowserRouter` como wrapper principal
- ✅ Definir todas las rutas en `App.tsx`
- ✅ Usar `ProtectedRoute` para rutas que requieren autenticación
- ✅ Usar `Link` de react-router en lugar de `<a>`
- ✅ Usar `useNavigate` para navegación programática
- ❌ NO usar window.location o manipulación manual de la URL

