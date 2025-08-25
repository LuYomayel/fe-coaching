# 🚀 Guía Completa para Deploy en Netlify con Next.js

## ✅ Configuración Completada

### 1. Archivos de Configuración

- ✅ `netlify.toml` - Configurado para Next.js con plugin oficial
- ✅ `next.config.js` - Optimizado para Netlify
- ✅ `package.json` - Scripts y dependencias actualizadas
- ✅ Variables de entorno migradas de `REACT_APP_` a `NEXT_PUBLIC_`

### 2. Plugin de Netlify Instalado

- ✅ `@netlify/plugin-nextjs` - Plugin oficial para Next.js

## 🔧 Configuración de Netlify

### Paso 1: Conectar Repositorio

1. Ve a [Netlify](https://app.netlify.com)
2. Clic en "New site from Git"
3. Conecta tu repositorio de GitHub/GitLab/Bitbucket
4. Selecciona la rama (generalmente `main` o `master`)

### Paso 2: Configuración de Build

En la configuración del sitio, usa estos valores:

```
Build command: npm run build
Publish directory: .next
```

_Nota: Netlify detectará automáticamente que es Next.js y aplicará la configuración óptima_

### Paso 3: Variables de Entorno

En Site settings > Environment variables, agrega:

```bash
# OBLIGATORIO - URL de tu API backend
NEXT_PUBLIC_API_URL=https://tu-api-backend.com

# OPCIONAL - Otras variables según tu configuración
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_SITE_URL=https://tu-dominio.netlify.app
```

### Paso 4: Configuración de Node.js

- Node.js Version: `18.18.2` (ya configurado en netlify.toml)
- NPM Flags: `--legacy-peer-deps` (ya configurado)

## 📋 Checklist Pre-Deploy

### ✅ Archivos Configurados

- [x] `netlify.toml` existe y está configurado
- [x] `next.config.js` optimizado para producción
- [x] Variables `REACT_APP_*` cambiadas a `NEXT_PUBLIC_*`
- [x] Plugin `@netlify/plugin-nextjs` instalado

### ⚠️ Pendientes de Verificar

- [ ] Todas las variables de entorno configuradas en Netlify
- [ ] API backend accesible desde tu dominio
- [ ] Certificado SSL configurado (automático en Netlify)

## 🔍 Verificaciones Post-Deploy

### 1. Funcionalidad Básica

- [ ] Página principal carga correctamente
- [ ] Login/registro funciona
- [ ] Navegación entre páginas funciona
- [ ] API calls se realizan correctamente

### 2. Rutas Protegidas

- [ ] Redirección a login si no está autenticado
- [ ] Acceso a rutas de coach/student según tipo de usuario
- [ ] Sidebar y navegación funcionan

### 3. Performance

- [ ] Tiempos de carga aceptables
- [ ] Imágenes se cargan correctamente
- [ ] CSS y estilos aplicados correctamente

## 🐛 Troubleshooting

### Error: "Build failed"

1. **Verifica Node.js version**: Debe ser 18.18.2 o superior
2. **Revisa las dependencias**: Ejecuta `npm install` localmente
3. **Chequea variables de entorno**: Asegúrate de que `NEXT_PUBLIC_API_URL` esté configurada

### Error: "Page not found"

1. **Rutas dinámicas**: Verifica que los archivos `[param]/page.tsx` existan
2. **Navegación**: Asegúrate de usar `router.push()` en lugar de `navigate()`

### Error: "API calls failing"

1. **CORS**: Configura tu backend para aceptar requests desde tu dominio de Netlify
2. **HTTPS**: Asegúrate de que tu API soporte HTTPS
3. **Variables de entorno**: Verifica que `NEXT_PUBLIC_API_URL` sea correcta

### Error: "Build timeout"

1. **Optimiza el build**: Revisa si hay dependencias innecesarias
2. **Memoria**: Netlify tiene límites de memoria para builds gratuitos

## 🔄 Actualizaciones y Re-deploys

### Deploy Automático

- Cada push a la rama principal triggerea un nuevo deploy
- Netlify detecta cambios y rebuilds automáticamente

### Deploy Manual

1. En el dashboard de Netlify
2. Clic en "Trigger deploy" > "Deploy site"

### Preview Deploys

- Pull requests generan preview deploys automáticamente
- Útil para testing antes de merge

## 🎯 Optimizaciones Adicionales

### 1. Performance

```javascript
// next.config.js - Ya configurado
const nextConfig = {
  swcMinify: true,
  reactStrictMode: true
};
```

### 2. SEO

- Configurar meta tags en cada página
- Usar `next/head` para títulos dinámicos
- Sitemap automático con Next.js

### 3. PWA (Ya configurado)

- Service Worker registrado
- Manifest.json configurado
- Install button implementado

## 📞 Soporte y Recursos

### Netlify Docs

- [Next.js on Netlify](https://docs.netlify.com/frameworks/next-js/)
- [Build Settings](https://docs.netlify.com/configure-builds/overview/)
- [Environment Variables](https://docs.netlify.com/environment-variables/overview/)

### Next.js Docs

- [Deployment](https://nextjs.org/docs/deployment)
- [Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

## 🚀 ¡Listo para Deploy!

Tu aplicación **fe-coaching** está completamente configurada para Netlify.

**Próximos pasos:**

1. Commit y push todos los cambios
2. Configurar el sitio en Netlify
3. Agregar variables de entorno
4. ¡Deploy! 🎉

**Comando final para verificar:**

```bash
npm run build
```

Si el build es exitoso localmente, también funcionará en Netlify.
