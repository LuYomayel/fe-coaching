# Reglas de Desarrollo del Proyecto

Esta carpeta contiene la documentación de arquitectura y patrones de desarrollo que deben seguirse en todo el proyecto.

## 📚 Documentación Disponible

1. **[architecture.md](./architecture.md)** - Principios fundamentales y estructura del proyecto
2. **[api-client-pattern.md](./api-client-pattern.md)** - Patrón para manejo de llamadas HTTP
3. **[page-hook-pattern.md](./page-hook-pattern.md)** - Patrón de hooks personalizados por página
4. **[routing.md](./routing.md)** - Configuración de React Router
5. **[auth-context.md](./auth-context.md)** - Manejo de autenticación y sesiones
6. **[tailwind-styling.md](./tailwind-styling.md)** - Guía de estilos con Tailwind CSS
7. **[shared-components.md](./shared-components.md)** - Componentes reutilizables
8. **[zod-validation.md](./zod-validation.md)** - Validaciones con Zod schemas
9. **[spanish-ui.md](./spanish-ui.md)** - Idioma de la interfaz de usuario

## 🎯 Reglas Principales

### ✅ SIEMPRE
- Usar Tailwind CSS para todos los estilos
- Crear un hook personalizado por cada página
- Usar el api-client para todas las llamadas HTTP
- Crear componentes en `components/shared/` en lugar de HTML nativo
- Tipar todo con TypeScript
- Usar Zod con schemas para todas las validaciones de formularios
- Mostrar TODO el texto visible en ESPAÑOL (UI en español, código en inglés)

### ❌ NUNCA
- Crear archivos `.css` adicionales
- Llamar directamente a `fetch` desde hooks o componentes
- Poner lógica de negocio en componentes de página
- Usar HTML nativo cuando existe un componente shared
- Acceder directamente a localStorage (usar AuthContext)
- Validar manualmente con regex o if/else (usar Zod schemas)
- Mostrar texto en inglés en la interfaz de usuario (SIEMPRE español)

## 📖 Cómo Usar Esta Documentación

Cuando Cursor desarrolle código en este proyecto, debe leer y seguir estos archivos para mantener consistencia y calidad en todo el código.

### Para Nuevas Features
1. Leer `architecture.md` para entender la estructura
2. Revisar el patrón específico que necesitas (API, hooks, componentes)
3. Seguir los ejemplos proporcionados
4. Mantener la consistencia con el código existente

### Para Debugging
- Verificar que el código siga los patrones establecidos
- Revisar la documentación del patrón específico
- Asegurar que no se hayan violado las reglas principales

---

**Última actualización:** Enero 2026
**Mantenido por:** Equipo de Desarrollo

