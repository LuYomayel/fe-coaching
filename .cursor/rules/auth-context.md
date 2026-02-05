# AuthContext - Manejo de Autenticación

## Propósito

El `AuthContext` maneja todo lo relacionado con la sesión del usuario de forma centralizada y segura.

## Responsabilidades

1. **Estado de Autenticación**
   - Usuario actual
   - Token de acceso
   - Estado de loading
   - Verificación de autenticación

2. **Operaciones**
   - Login
   - Logout
   - Refresh de token (opcional)
   - Persistencia de sesión

3. **Protección**
   - Validación de token
   - Manejo de expiración
   - Limpieza de sesión

## Implementación Completa

```typescript
// context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/services/api-client';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar autenticación al montar
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Validar token con el backend
      const userData = await apiClient.validateToken();
      setUser(userData);
    } catch (error) {
      console.error('Error validando token:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiClient.login(email, password);

      // Guardar token
      localStorage.setItem('auth_token', response.token);

      // Guardar usuario
      setUser(response.user);
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};
```

## Uso en Componentes

```typescript
// pages/LoginPage.tsx
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LoginPage = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      // Manejar error
    }
  };

  return (
    // UI de login
  );
};
```

```typescript
// Mostrar información del usuario
import { useAuth } from '@/context/AuthContext';

export const UserProfile = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center gap-4">
      <span className="text-gray-700">{user?.name}</span>
      <button onClick={logout} className="text-red-600">
        Cerrar Sesión
      </button>
    </div>
  );
};
```

## Mejores Prácticas

1. **Persistencia Segura**
   - Usar localStorage para el token
   - Considerar httpOnly cookies para mayor seguridad en producción

2. **Validación de Token**
   - Validar token al cargar la app
   - Verificar expiración
   - Renovar token si es posible

3. **Manejo de Errores**
   - Limpiar sesión en caso de error
   - Redirigir a login si el token es inválido

4. **Loading States**
   - Mostrar loading mientras se valida la sesión
   - Evitar flashes de contenido no autorizado

## Reglas

- ✅ SIEMPRE envolver la app con `AuthProvider`
- ✅ Usar `useAuth()` para acceder al contexto
- ✅ Validar token al cargar la aplicación
- ✅ Limpiar localStorage en logout
- ❌ NO acceder directamente a localStorage desde componentes
- ❌ NO manejar autenticación fuera del AuthContext
