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
1. NO enviar el ID del usuario autenticado (coachId, userId) como parámetro en llamadas API - el backend lo obtiene del JWT token. Sí se puede enviar el ID de OTRA entidad (ej: clientId de un alumno)
2. NO crear archivos `.css` adicionales
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

## UI Design Direction - iOS Style System

The UI follows a **minimalist iOS-style** aesthetic. All new frontend development MUST follow these guidelines.

### Design Principles
- Clean whitespace, rounded corners, subtle shadows, soft colors, glassmorphism effects
- Typography: Inter font, tight letter-spacing (`-0.01em` to `-0.03em`), font-weight 600-800 for headings
- No heavy borders, no harsh contrasts, prefer soft transitions and blur effects
- Use CSS custom properties (variables) defined in `index.css` for ALL theming

### CSS Custom Properties (use these, do NOT hardcode colors)
```css
/* Radius */
--ios-radius-sm: 8px;   --ios-radius-md: 12px;
--ios-radius-lg: 16px;  --ios-radius-xl: 20px;  --ios-radius-pill: 9999px;

/* Shadows */
--ios-shadow-sm / --ios-shadow-md / --ios-shadow-lg / --ios-shadow-xl

/* Colors (auto dark-mode via body.dark) */
--ios-bg / --ios-card-bg / --ios-card-border / --ios-card-shadow
--ios-text / --ios-text-secondary / --ios-text-tertiary
--ios-divider / --ios-surface-subtle / --ios-surface-muted
--ios-glass-bg / --ios-glass-border (for glassmorphism)
--ios-input-border / --ios-input-border-hover

/* Transitions */
--ios-transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
--ios-transition-fast: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
```

### Brand Colors (OK to hardcode these)
- **Primary**: `#6366f1` (indigo)
- **Success**: `#22c55e` (green)
- **Warning**: `#f59e0b` (amber) / `#f97316` (orange)
- **Danger**: `#ef4444` (red)

### Component Patterns
- **Cards**: `background: var(--ios-card-bg)`, `border-radius: var(--ios-radius-lg)`, `border: 1px solid var(--ios-card-border)`, `box-shadow: var(--ios-card-shadow)`
- **Glass bars** (sticky footers, floating bars): `background: var(--ios-glass-bg)`, `backdrop-filter: blur(24px)`, `border: 1px solid var(--ios-glass-border)`, `box-shadow: var(--ios-shadow-xl)`
- **Input labels**: uppercase, `font-size: 0.72rem`, `font-weight: 600`, `letter-spacing: 0.03em`, `color: var(--ios-text-secondary)`
- **Badges/Pills**: `border-radius: var(--ios-radius-pill)`, `background: rgba(99,102,241,0.1)`, `color: #6366f1`
- **Status indicators**: colored left-border (3px) + subtle background tint (`rgba(color, 0.1)`)

### Responsive Breakpoints
- `768px` — tablet/mobile split (PrimeFlex `md:`)
- `480px` — extra-small screens (full-screen dialogs)
- Use `clamp()` for responsive font sizes: e.g., `clamp(0.88rem, 2.5vw, 1rem)`
- Mobile padding: `0.5rem–0.75rem` (not `1.5rem`)
- Use `dvh` instead of `vh` for mobile-safe viewport heights

### Page Layout Convention
- Max width: `720px–900px`, centered with `margin: 0 auto`
- Page padding: `0.75rem`
- Sticky/fixed bars: `position: fixed`, `bottom: 0.75rem`, centered with `left: 50%; transform: translateX(-50%)`
- Add `paddingBottom: '5rem'` to page content when using fixed bottom bars

## Stack Tecnológico
- React 18 + TypeScript
- PrimeReact + PrimeFlex (UI components & utilities)
- Zustand (exercises store) + Context API (theme, user, toast, language)
- react-intl (i18n: es, en, pt)
- Zod (validación)
- react-router v6 (routing)
