# Patrón de Hooks por Página

## Regla Principal

**Cada página debe tener su propio hook personalizado** que contenga toda la lógica de negocio.

## Estructura

### Nomenclatura

- Página: `HomePage.tsx` → Hook: `useHomePage.ts`
- Página: `ProfilePage.tsx` → Hook: `useProfilePage.ts`
- Página: `SettingsPage.tsx` → Hook: `useSettingsPage.ts`

### Ubicación

- Páginas: `src/pages/`
- Hooks: `src/hooks/`

## Responsabilidades del Hook

1. **Estado Local**
   - Manejar todo el estado de la página con `useState`
   - Estado de loading, errores, datos, etc.

2. **Efectos**
   - Usar `useEffect` para cargas iniciales
   - Suscripciones y limpieza

3. **Llamadas API**
   - Todas las interacciones con el backend
   - Usar el `api-client` para todas las llamadas

4. **Lógica de Negocio**
   - Validaciones
   - Transformaciones de datos
   - Cálculos

## Ejemplo Completo

```typescript
// hooks/useHomePage.ts
import { useState, useEffect } from 'react';
import { apiClient } from '@/services/api-client';

interface Message {
  id: string;
  content: string;
  createdAt: string;
}

export const useHomePage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getMessages();
      setMessages(data);
    } catch (err) {
      setError('Error al cargar mensajes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    try {
      setLoading(true);
      setError(null);
      const newMessage = await apiClient.sendMessage(content);
      setMessages((prev) => [...prev, newMessage]);
    } catch (err) {
      setError('Error al enviar mensaje');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    loadMessages
  };
};
```

```typescript
// pages/HomePage.tsx
import { useHomePage } from '@/hooks/useHomePage';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';

export const HomePage = () => {
  const { messages, loading, error, sendMessage } = useHomePage();

  // Solo lógica de UI aquí
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // ...
  };

  return (
    <div className="container mx-auto p-4">
      {/* UI JSX */}
    </div>
  );
};
```

## Reglas

- ✅ SIEMPRE separar lógica (hook) de presentación (componente)
- ✅ SIEMPRE usar el api-client desde el hook
- ✅ El componente de página debe ser mayormente JSX
- ❌ NO poner lógica de negocio en el componente de página
- ❌ NO llamar a api-client directamente desde el componente
