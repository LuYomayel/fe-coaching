# Guía de Estilos con Tailwind CSS

## Regla Principal

**SOLO Tailwind CSS. NO crear archivos .css adicionales.**

## Instalación

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## Configuración

```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1'
        }
        // Agregar colores personalizados aquí
      }
    }
  },
  plugins: []
};
```

## Clases Comunes

### Layout

```typescript
// Contenedores
<div className="container mx-auto px-4">
<div className="max-w-7xl mx-auto">
<div className="flex justify-between items-center">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

### Spacing

```typescript
// Padding y Margin
<div className="p-4 m-2">          // padding y margin
<div className="px-6 py-4">        // padding horizontal y vertical
<div className="space-y-4">        // espacio entre hijos verticalmente
<div className="gap-4">            // gap en flex/grid
```

### Typography

```typescript
<h1 className="text-3xl font-bold text-gray-900">
<p className="text-base text-gray-600 leading-relaxed">
<span className="text-sm font-medium text-blue-600">
```

### Buttons

```typescript
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
<button className="px-6 py-3 bg-green-500 text-white font-semibold rounded-md shadow-md hover:shadow-lg active:scale-95 transition-all">
```

### Cards

```typescript
<div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
<div className="border border-gray-200 rounded-xl p-8 bg-gray-50">
```

### Forms

```typescript
<input className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
<textarea className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-blue-500" />
```

## Responsive Design

```typescript
// Mobile First
<div className="text-sm md:text-base lg:text-lg xl:text-xl">
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
<div className="hidden md:block">                    // Ocultar en móvil
<div className="block md:hidden">                    // Solo móvil
```

## Estados Interactivos

```typescript
// Hover, Focus, Active
<button className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700">
<input className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
<div className="opacity-0 hover:opacity-100 transition-opacity">
```

## Dark Mode (Opcional)

```typescript
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
```

## Animaciones y Transiciones

```typescript
<div className="transition-all duration-300 ease-in-out">
<div className="transform hover:scale-105 transition-transform">
<div className="animate-pulse">                      // Animación de carga
<div className="animate-spin">                       // Spinner
```

## Composición con clsx/cn

Para combinar clases condicionalmente:

```typescript
import { clsx } from 'clsx';

const buttonClasses = clsx(
  'px-4 py-2 rounded-lg font-medium transition-colors',
  isLoading && 'opacity-50 cursor-not-allowed',
  variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700',
  variant === 'secondary' && 'bg-gray-200 text-gray-800 hover:bg-gray-300'
);
```

## Reglas Estrictas

- ✅ SIEMPRE usar clases de Tailwind
- ✅ Usar la configuración de theme para colores personalizados
- ✅ Aplicar responsive design con breakpoints
- ✅ Usar transitions para interacciones suaves
- ❌ NO crear archivos .css separados
- ❌ NO usar inline styles ({ style: {} })
- ❌ NO usar styled-components u otras librerías CSS-in-JS

## Excepciones

Los únicos archivos CSS permitidos son:

- `src/index.css` - Para directivas de Tailwind y estilos globales mínimos
- `src/App.css` - Solo si es absolutamente necesario (preferir eliminarlo)

```css
/* index.css - Estructura permitida */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Estilos globales muy específicos si es necesario */
@layer base {
  body {
    @apply antialiased;
  }
}
```
