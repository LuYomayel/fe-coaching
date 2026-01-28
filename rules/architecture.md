# Arquitectura del Proyecto

## Principios Fundamentales

### 1. Estructura de Páginas
- Cada página en `src/pages/` debe tener su propio hook personalizado
- Patrón: Para `HomePage.tsx`, crear `useHomePage.ts`
- Los hooks de página manejan toda la lógica de estado y efectos
- Los componentes de página solo renderizan UI

### 2. API Client
- Todas las llamadas HTTP deben pasar por `src/services/api-client.ts`
- El api-client maneja:
  - Manejo centralizado de excepciones
  - Interceptores de autenticación
  - Headers comunes
  - Transformación de errores
- Los hooks llaman a métodos específicos del api-client (ej: `api.sendMessage()`)
- Cada método del api-client encapsula el verbo HTTP correspondiente

### 3. Estilos
- **SOLO Tailwind CSS** para todos los estilos
- **PROHIBIDO** crear archivos `.css` adicionales
- Usar clases de utilidad de Tailwind directamente en JSX
- Para estilos complejos, usar `@apply` en archivos existentes si es absolutamente necesario

### 4. Componentes Compartidos
- Todos los componentes reutilizables en `src/components/shared/`
- Componentes a crear: Input, Button, Dropdown, Card, Dialog, Modal, etc.
- Cada componente debe:
  - Estar tipado con TypeScript
  - Usar solo Tailwind para estilos
  - Ser completamente reutilizable
  - Tener props bien definidas

### 5. Autenticación
- Usar `AuthContext` para manejo de sesión
- El contexto debe manejar:
  - Login/Logout
  - Persistencia de token
  - Refresh de token si es necesario
  - Estado de autenticación
  - Usuario actual

### 6. Validaciones
- **SIEMPRE usar Zod** con schemas para todas las validaciones
- Los schemas deben estar en `src/schemas/` organizados por dominio
- Usar `safeParse()` para validación sin lanzar errores
- Inferir tipos TypeScript con `z.infer<typeof schema>`
- **PROHIBIDO** validar manualmente con regex o if/else

### 7. Idioma de la Interfaz
- **TODOS los textos visibles** deben estar en **ESPAÑOL**
- El código (variables, funciones, comentarios) debe estar en **INGLÉS**
- Esto incluye: títulos, labels, placeholders, botones, mensajes de error, textos de ayuda
- **Aunque se reciban screenshots en inglés, SIEMPRE traducir al español**

## Estructura de Directorios

```
src/
├── pages/              # Páginas de la aplicación
├── hooks/              # Hooks personalizados (uno por página mínimo)
├── components/
│   └── shared/        # Componentes reutilizables
├── services/
│   └── api-client.ts  # Cliente API centralizado
├── context/           # Contextos de React (AuthContext, etc.)
├── schemas/           # Schemas de validación Zod
├── types/             # Tipos TypeScript compartidos
└── utils/             # Utilidades generales
```

## Reglas de Desarrollo

1. **NO** crear archivos CSS adicionales
2. **SIEMPRE** usar el api-client para llamadas HTTP
3. **SIEMPRE** crear un hook para cada página
4. **SIEMPRE** usar componentes shared en lugar de HTML nativo
5. **SIEMPRE** tipar todo con TypeScript
6. **SIEMPRE** usar Zod schemas para validaciones (NO validar manualmente)
7. **SIEMPRE** mostrar texto visible en ESPAÑOL (código en inglés)

