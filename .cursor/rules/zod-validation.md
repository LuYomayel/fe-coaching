# Validaciones con Zod

## Regla Principal

**SIEMPRE usar Zod con schemas para todas las validaciones de formularios y datos.**

## ¿Por qué Zod?

- ✅ Validación type-safe con TypeScript
- ✅ Schemas reutilizables y consistentes
- ✅ Mensajes de error personalizables
- ✅ Validación tanto en cliente como servidor
- ✅ Inferencia automática de tipos

## Instalación

```bash
npm install zod
```

## Estructura de Schemas

Los schemas deben estar en `src/schemas/` organizados por dominio/funcionalidad.

### Ejemplo de Estructura

```
src/schemas/
├── auth.schemas.ts      # Schemas de autenticación
├── user.schemas.ts      # Schemas de usuario
├── message.schemas.ts   # Schemas de mensajes
└── index.ts             # Barrel export
```

## Patrón de Uso

### 1. Crear el Schema

```typescript
// schemas/auth.schemas.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'El email es requerido').email('Por favor ingresa un email válido'),
  password: z.string().min(1, 'La contraseña es requerida').min(8, 'La contraseña debe tener al menos 8 caracteres')
});

// Inferir el tipo TypeScript del schema
export type LoginFormData = z.infer<typeof loginSchema>;
```

### 2. Usar en el Hook

```typescript
// hooks/useLoginPage.ts
import { loginSchema, type LoginFormData } from '@/schemas/auth.schemas';
import { useToast } from '@/contexts/ToastContext';
import { useIntl } from 'react-intl';

export const useLoginPage = () => {
  const { showToast } = useToast();
  const intl = useIntl();

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});

  const validateForm = () => {
    const result = loginSchema.safeParse(formData);

    if (!result.success) {
      // Transformar errores de Zod a formato de formulario
      const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {};
      result.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as keyof LoginFormData] = error.message;
        }
      });
      setErrors(fieldErrors);
      // IMPORTANTE: Retornar el objeto con isValid y errors
      return { isValid: false, errors: fieldErrors };
    }

    setErrors({});
    return { isValid: true, errors: {} };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateForm();

    if (!validation.isValid) {
      // IMPORTANTE: Mostrar errores específicos de Zod en el toast
      const errorMessages = Object.values(validation.errors)
        .filter((msg) => msg) // Filtrar valores null/undefined
        .join('. ');

      showToast(
        'error',
        intl.formatMessage({ id: 'error' }),
        errorMessages || intl.formatMessage({ id: 'validation.error' })
      );
      return;
    }

    // Proceder con el submit
    // ...
  };

  return { formData, errors, setFormData, handleSubmit };
};
```

## Reglas Importantes

- ✅ **SIEMPRE** crear schemas en `src/schemas/`
- ✅ **SIEMPRE** inferir tipos con `z.infer<typeof schema>`
- ✅ **SIEMPRE** usar `safeParse()` para validación sin lanzar errores
- ✅ **SIEMPRE** proporcionar mensajes de error descriptivos en español
- ✅ **SIEMPRE** organizar schemas por dominio/funcionalidad
- ✅ **SIEMPRE** exportar tipos inferidos junto con schemas
- ✅ **SIEMPRE** mostrar errores de validación en un toast con los mensajes específicos de Zod
- ✅ **SIEMPRE** retornar `{ isValid, errors }` desde validateForm (no solo boolean)
- ❌ **NUNCA** validar manualmente con regex o if/else
- ❌ **NUNCA** duplicar lógica de validación
- ❌ **NUNCA** usar validaciones sin schemas
- ❌ **NUNCA** ignorar mostrar los errores específicos al usuario
