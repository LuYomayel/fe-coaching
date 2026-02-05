# Componentes Compartidos (Shared Components)

## Ubicación

Todos los componentes reutilizables deben estar en: `src/components/shared/`

## Componentes Requeridos

Los siguientes componentes deben crearse en el proyecto:

1. **Button** - Botones con variantes
2. **Input** - Campos de texto
3. **Textarea** - Campos de texto multi-línea
4. **Select/Dropdown** - Selectores
5. **Card** - Tarjetas de contenido
6. **Dialog/Modal** - Ventanas modales
7. **Alert** - Mensajes de alerta
8. **Badge** - Etiquetas
9. **Spinner** - Indicador de carga
10. **Checkbox** - Casillas de verificación
11. **Radio** - Botones de radio
12. **Switch** - Interruptores

## Estructura de un Componente Shared

Cada componente debe:

- Estar en su propio archivo
- Tener tipos TypeScript bien definidos
- Usar solo Tailwind para estilos
- Ser completamente reutilizable
- Aceptar props comunes como `className` para extensibilidad

## Reglas

- ✅ SIEMPRE crear componentes en `components/shared/`
- ✅ SIEMPRE usar TypeScript con tipos bien definidos
- ✅ SIEMPRE usar solo Tailwind para estilos
- ✅ Aceptar `className` como prop para extensibilidad
- ✅ Usar `forwardRef` para componentes de formulario
- ❌ NO usar HTML nativo directo (usar componentes shared)
- ❌ NO duplicar estilos (reutilizar componentes)
