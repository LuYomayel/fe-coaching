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

## Ejemplos de Implementación

### Button

```typescript
// components/shared/Button.tsx
import { ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  disabled,
  ...props
}: ButtonProps) => {
  const baseClasses = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Cargando...' : children}
    </button>
  );
};
```

### Input

```typescript
// components/shared/Input.tsx
import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full px-4 py-2 border rounded-lg transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500',
            props.disabled && 'bg-gray-100 cursor-not-allowed',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

### Card

```typescript
// components/shared/Card.tsx
import { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
}

export const Card = ({
  children,
  variant = 'default',
  className,
  ...props
}: CardProps) => {
  const variantClasses = {
    default: 'bg-white shadow-md',
    elevated: 'bg-white shadow-lg hover:shadow-xl transition-shadow',
    outlined: 'bg-white border-2 border-gray-200',
  };

  return (
    <div
      className={clsx(
        'rounded-lg p-6',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
```

### Dialog/Modal

```typescript
// components/shared/Dialog.tsx
import { ReactNode, useEffect } from 'react';
import { clsx } from 'clsx';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export const Dialog = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
}: DialogProps) => {
  // Cerrar con ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-auto">
        {title && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          </div>
        )}
        
        <div className="px-6 py-4">
          {children}
        </div>
        
        {footer && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
```

### Spinner

```typescript
// components/shared/Spinner.tsx
import { clsx } from 'clsx';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner = ({ size = 'md', className }: SpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={clsx(
        'animate-spin rounded-full border-blue-600 border-t-transparent',
        sizeClasses[size],
        className
      )}
    />
  );
};
```

## Uso en la Aplicación

```typescript
// pages/HomePage.tsx
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Card } from '@/components/shared/Card';
import { Dialog } from '@/components/shared/Dialog';

export const HomePage = () => {
  return (
    <div className="container mx-auto p-4">
      <Card>
        <h1 className="text-2xl font-bold mb-4">Formulario</h1>
        
        <Input
          label="Nombre"
          placeholder="Ingresa tu nombre"
          className="mb-4"
        />
        
        <Button variant="primary" size="md">
          Enviar
        </Button>
      </Card>
    </div>
  );
};
```

## Reglas

- ✅ SIEMPRE crear componentes en `components/shared/`
- ✅ SIEMPRE usar TypeScript con tipos bien definidos
- ✅ SIEMPRE usar solo Tailwind para estilos
- ✅ Aceptar `className` como prop para extensibilidad
- ✅ Usar `forwardRef` para componentes de formulario
- ❌ NO usar HTML nativo directo (usar componentes shared)
- ❌ NO duplicar estilos (reutilizar componentes)

