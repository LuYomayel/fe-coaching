# Patrón API Client

## Estructura del API Client

El archivo `src/services/api-client.ts` debe seguir este patrón:

### Características Principales

1. **Manejo Centralizado de Errores**
   - Interceptar todas las respuestas
   - Transformar errores HTTP en errores legibles
   - Logging de errores

2. **Métodos por Funcionalidad**
   - NO exponer directamente `get`, `post`, `put`, `patch`, `delete`
   - Crear métodos específicos como `sendMessage()`, `getUsers()`, etc.
   - Cada método encapsula el verbo HTTP y el endpoint

3. **Configuración de Headers**
   - Headers comunes automáticos
   - Inyección de token de autenticación
   - Content-Type apropiado

### Ejemplo de Implementación

```typescript
// api-client.ts
class ApiClient {
  private baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    try {
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: body ? JSON.stringify(body) : undefined
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${method} ${endpoint}]:`, error);
      throw error;
    }
  }

  // Métodos específicos por funcionalidad
  async sendMessage(content: string) {
    return this.request('POST', '/messages', { content });
  }

  async getUsers() {
    return this.request('GET', '/users');
  }
}

export const apiClient = new ApiClient();
```

### Uso desde Hooks

```typescript
// hooks/useHomePage.ts
import { apiClient } from '@/services/api-client';

export const useHomePage = () => {
  const sendMessage = async (content: string) => {
    try {
      const result = await apiClient.sendMessage(content);
      // Manejar resultado
    } catch (error) {
      // Manejar error
    }
  };

  return { sendMessage };
};
```

## Reglas Importantes

- ❌ NO llamar directamente a `fetch` desde hooks o componentes
- ❌ NO exponer métodos genéricos `post()`, `get()`, etc.
- ✅ SIEMPRE crear métodos específicos en el api-client
- ✅ SIEMPRE manejar errores en el api-client
- ✅ SIEMPRE usar tipos TypeScript para respuestas
