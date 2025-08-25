# Migración Completa de React a Next.js

## ✅ Cambios Realizados

### 1. Configuración Base

- ✅ Actualizado `package.json` con dependencias de Next.js
- ✅ Creado `next.config.js` con configuración personalizada
- ✅ Actualizado `tsconfig.json` para Next.js
- ✅ Creado `next-env.d.ts` para tipos de Next.js

### 2. Estructura de Carpetas (App Router)

- ✅ Creado directorio `app/` con las siguientes rutas:
  - `app/page.tsx` - Página principal (Home/Login)
  - `app/login/page.tsx` - Página de login
  - `app/coach/page.tsx` - Dashboard del coach
  - `app/coach/profile/page.tsx` - Perfil del coach
  - `app/coach/plans/page.tsx` - Planes del coach
  - `app/student/page.tsx` - Dashboard del estudiante
  - `app/student/profile/page.tsx` - Perfil del estudiante
  - `app/student/calendar/page.tsx` - Calendario del estudiante
  - `app/plans/create/page.tsx` - Crear planes
  - `app/plans/create-and-assign/page.tsx` - Crear y asignar planes
  - `app/plans/edit-template/[planId]/page.tsx` - Editar plantilla de plan
  - `app/plans/edit/[planId]/page.tsx` - Editar plan
  - `app/plans/[planId]/[studentId]/page.tsx` - Detalles del plan
  - `app/plans/start-session/[planId]/page.tsx` - Iniciar sesión de entrenamiento
  - `app/students/[studentId]/details/page.tsx` - Detalles del estudiante
  - `app/client-dashboard/[clientId]/page.tsx` - Dashboard del cliente
  - `app/manage-students/page.tsx` - Gestionar estudiantes
  - `app/unauthorized/page.tsx` - Página no autorizada
  - `app/verify-email/page.tsx` - Verificar email
  - `app/complete-coach-profile/page.tsx` - Completar perfil del coach
  - `app/forgot-password/page.tsx` - Olvidé contraseña
  - `app/reset-password/page.tsx` - Resetear contraseña
  - `app/not-subscribed/page.tsx` - No suscrito
  - `app/settings/page.tsx` - Configuración

### 3. Layout Principal

- ✅ Creado `app/layout.tsx` que reemplaza `App.tsx`
- ✅ Incluye todos los providers (Language, Theme, Toast, User, etc.)
- ✅ Mantiene la estructura de sidebar y navegación

### 4. Componentes Actualizados

- ✅ `src/auth/PrivateRoute.tsx` - Actualizado para usar `useRouter` de Next.js
- ✅ `src/auth/Home.tsx` - Actualizado para usar `useRouter` de Next.js

## 🔄 Pasos Restantes para Completar la Migración

### 1. Instalar Dependencias

```bash
npm install next@latest react@latest react-dom@latest
npm install --save-dev @types/node eslint eslint-config-next
```

### 2. Actualizar Variables de Entorno

- Renombrar `.env` variables que empiecen con `REACT_APP_` a `NEXT_PUBLIC_`
- Ejemplo: `REACT_APP_API_URL` → `NEXT_PUBLIC_API_URL`

### 3. Mover Archivos Públicos

- Los archivos en `public/` ya están en el lugar correcto
- Verificar que `public/manifest.json` esté correctamente configurado

### 4. Actualizar Imports en Otros Componentes

Buscar y reemplazar en todos los archivos:

- `import { useNavigate } from 'react-router-dom'` → `import { useRouter } from 'next/navigation'`
- `const navigate = useNavigate();` → `const router = useRouter();`
- `navigate('/ruta')` → `router.push('/ruta')`
- `<Navigate to="/ruta" />` → usar `router.push('/ruta')` en useEffect

### 5. Componentes que Necesitan Actualización

Los siguientes componentes probablemente necesiten actualización:

#### Sidebar.tsx

- Reemplazar `useLocation` y `useNavigate` con Next.js equivalentes
- Usar `usePathname` de `next/navigation` en lugar de `useLocation`

#### Otros componentes con navegación

- Buscar todos los archivos que usen `react-router-dom`
- Reemplazar con equivalentes de Next.js

### 6. Configuración de Rutas Dinámicas

Las rutas con parámetros ya están configuradas:

- `[planId]` - para IDs de planes
- `[studentId]` - para IDs de estudiantes
- `[clientId]` - para IDs de clientes

Para acceder a estos parámetros en los componentes:

```typescript
import { useParams } from 'next/navigation';

const { planId, studentId } = useParams();
```

### 7. Middleware (Opcional)

Para proteger rutas a nivel de servidor, crear `middleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Lógica de autenticación
}

export const config = {
  matcher: ['/coach/:path*', '/student/:path*', '/manage-students/:path*']
};
```

### 8. Configurar Build y Deploy

- Actualizar scripts de build en `package.json` (ya hecho)
- Configurar Netlify/Vercel para Next.js
- Actualizar `_redirects` para Next.js si es necesario

### 9. Testing

- Probar todas las rutas
- Verificar que la navegación funciona correctamente
- Probar autenticación y rutas protegidas
- Verificar que los contextos funcionan
- Probar responsive design

### 10. Optimizaciones de Next.js

- Usar `next/image` para imágenes optimizadas
- Usar `next/font` para fuentes optimizadas
- Configurar ISR (Incremental Static Regeneration) si es necesario
- Usar Server Components donde sea posible

## 📝 Comandos para Ejecutar

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Build para producción
npm run build

# Ejecutar en producción
npm start
```

## ⚠️ Posibles Problemas y Soluciones

### Error: "useNavigate is not defined"

- Asegúrate de que todos los imports estén actualizados
- Reemplaza `useNavigate` con `useRouter`

### Error: "Cannot find module 'next/navigation'"

- Instala las dependencias de Next.js
- Verifica que `next` esté en package.json

### Error: "Module not found: Can't resolve 'react-router-dom'"

- Remueve `react-router-dom` del package.json
- Actualiza todos los imports de routing

### Problemas con CSS

- Verifica que los imports de CSS estén en `app/layout.tsx`
- Considera usar CSS Modules o styled-components

## 🎯 Beneficios de la Migración

1. **Performance**: Server-side rendering y optimizaciones automáticas
2. **SEO**: Mejor indexación por buscadores
3. **Routing**: Sistema de routing más intuitivo basado en archivos
4. **Optimizaciones**: Imágenes, fuentes y código optimizados automáticamente
5. **Developer Experience**: Mejor experiencia de desarrollo
6. **Deploy**: Mejor integración con plataformas de deploy

## 🔧 Estructura Final del Proyecto

```
fe-coaching/
├── app/                    # Rutas de Next.js (App Router)
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Página principal
│   ├── coach/             # Rutas del coach
│   ├── student/           # Rutas del estudiante
│   ├── plans/             # Rutas de planes
│   └── ...
├── src/                   # Código fuente (mantenido)
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── utils/
│   └── ...
├── public/               # Archivos estáticos
├── next.config.js        # Configuración de Next.js
├── tsconfig.json         # Configuración TypeScript
└── package.json          # Dependencias actualizadas
```

La migración está casi completa. Solo falta instalar las dependencias y hacer algunos ajustes menores en los componentes que usan routing.
