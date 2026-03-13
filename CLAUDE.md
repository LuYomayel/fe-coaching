# Project Rules

## Reglas Principales

### SIEMPRE
1. **No crear archivos .css** - Usar SOLO archivos CSS existentes (`index.css`, `App.css`, `primereact.css`, `Home.css`, `LogoLoader.css`, `GlobalSpinner.css`). NO crear archivos `.css` adicionales bajo ningún motivo.
2. **Hook por Página** - Cada página debe tener su propio hook personalizado (`useHomePage.ts` para `HomePage.tsx`).
3. **API Client** - Usar `src/services/api-client.ts` para TODAS las llamadas HTTP. NO llamar directamente a `fetch`.
4. **Componentes Shared** - Usar componentes de `src/components/shared/` en lugar de HTML nativo.
5. **TypeScript Estricto** - Tipar absolutamente TODO. NO usar `any` excepto casos extremos. Tipos compartidos en `/src/types`, tipos locales en el mismo archivo.
6. **Zod Schemas** - Usar Zod con schemas para TODAS las validaciones. SIEMPRE mostrar errores específicos de Zod en toast al usuario. validateForm debe retornar `{ isValid, errors }`.
7. **Internacionalización** - TODO el texto visible debe usar react-intl (`useIntl`, `FormattedMessage`). El código (variables, funciones) en inglés.

### NUNCA
1. NO crear archivos `.css` adicionales
2. NO llamar directamente a `fetch` desde hooks o componentes
3. NO poner lógica de negocio en componentes de página
4. NO usar HTML nativo cuando existe un componente shared
5. NO acceder directamente a localStorage (usar contextos)
6. NO validar manualmente con regex o if/else (usar Zod schemas)
7. NO usar `any` - Siempre tipar correctamente. Buscar tipos en `/src/types` primero
8. NO dejar parámetros, retornos o estados sin tipo explícito
9. NO ignorar errores de validación - SIEMPRE mostrar errores específicos de Zod al usuario en toast

## Estructura del Proyecto

```
src/
├── pages/              # Páginas (solo UI/JSX)
├── hooks/              # Hooks personalizados (uno por página mínimo)
├── components/
│   ├── shared/         # Componentes reutilizables
│   ├── coach/          # Componentes específicos de coach
│   ├── client/         # Componentes específicos de cliente
│   ├── dialogs/        # Diálogos modales
│   ├── home/           # Landing page components
│   ├── plans/          # Plan components
│   └── workout/        # Workout components
├── services/
│   └── api-client.ts   # Cliente API centralizado
├── contexts/           # Contextos (ThemeContext, UserContext, etc.)
├── schemas/            # Schemas de validación Zod
├── types/              # Tipos TypeScript compartidos
├── i18n/               # Internacionalización (es, en, pt)
├── stores/             # Zustand stores
└── utils/              # Utilidades generales
```

## Patrón Página + Hook

- Páginas: solo UI/JSX, sin lógica de negocio
- Hooks: toda la lógica, llamadas API, estado, validaciones
- Ejemplo: `CoachHome.tsx` usa `useCoachHome.ts`

## UI Design Direction
- The UI is being progressively redesigned to a **minimalist iOS-style** aesthetic.
- Design principles: clean whitespace, rounded corners (16px+), subtle shadows, soft colors, glassmorphism effects.
- Typography: modern sans-serif (Inter or similar).
- No heavy borders, no harsh contrasts, prefer soft transitions and blur effects.
- Prefer CSS custom properties (variables) for theming changes.

## Stack Tecnológico
- React 18 + TypeScript
- PrimeReact + PrimeFlex (UI components & utilities)
- Zustand (exercises store) + Context API (theme, user, toast, language)
- react-intl (i18n: es, en, pt)
- Zod (validación)
- react-router v6 (routing)
