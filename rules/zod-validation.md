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
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Por favor ingresa un email válido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

// Inferir el tipo TypeScript del schema
export type LoginFormData = z.infer<typeof loginSchema>;
```

### 2. Usar en el Hook

```typescript
// hooks/useLoginPage.ts
import { loginSchema, type LoginFormData } from '@/schemas/auth.schemas';
import { zodResolver } from '@hookform/resolvers/zod'; // Si usas react-hook-form

export const useLoginPage = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});

  const validateForm = (data: LoginFormData) => {
    const result = loginSchema.safeParse(data);
    
    if (!result.success) {
      // Transformar errores de Zod a formato de formulario
      const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {};
      result.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as keyof LoginFormData] = error.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(formData)) {
      return;
    }
    
    // Proceder con el submit
    // ...
  };

  return { formData, errors, setFormData, handleSubmit };
};
```

### 3. Usar en Componentes

```typescript
// pages/LoginPage.tsx
import { useLoginPage } from '@/hooks/useLoginPage';
import { Input } from '@/components/shared';

export const LoginPage = () => {
  const { formData, errors, setFormData, handleSubmit } = useLoginPage();

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        error={errors.email}
      />
      
      <Input
        label="Password"
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        error={errors.password}
      />
      
      <button type="submit">Login</button>
    </form>
  );
};
```

## Schemas Comunes

### Email

```typescript
export const emailSchema = z
  .string()
  .min(1, 'El email es requerido')
  .email('Por favor ingresa un email válido');
```

### Password

```typescript
export const passwordSchema = z
  .string()
  .min(1, 'La contraseña es requerida')
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
  .regex(/[a-z]/, 'La contraseña debe contener al menos una minúscula')
  .regex(/[0-9]/, 'La contraseña debe contener al menos un número');
```

### URL

```typescript
export const urlSchema = z.string().url('Por favor ingresa una URL válida');
```

### Número

```typescript
export const positiveNumberSchema = z
  .number()
  .positive('El número debe ser positivo')
  .int('El número debe ser entero');
```

## Validación Parcial (Para Updates)

```typescript
// Schema completo
export const userUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  age: z.number().positive().optional(),
});

// Para updates parciales
export const partialUserUpdateSchema = userUpdateSchema.partial();
```

## Validación con Transformaciones

```typescript
export const trimmedStringSchema = z.string().trim().min(1);

export const numberStringSchema = z.string().transform((val) => {
  const num = Number(val);
  if (isNaN(num)) throw new Error('Debe ser un número');
  return num;
});
```

## Validación de Arrays

```typescript
export const tagsSchema = z
  .array(z.string().min(1))
  .min(1, 'Debe tener al menos un tag')
  .max(10, 'No puede tener más de 10 tags');
```

## Validación Condicional

```typescript
export const conditionalSchema = z.object({
  type: z.enum(['email', 'phone']),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
}).refine((data) => {
  if (data.type === 'email') return !!data.email;
  if (data.type === 'phone') return !!data.phone;
  return true;
}, {
  message: 'Debe proporcionar email o teléfono según el tipo',
});
```

## Mensajes de Error Personalizados

```typescript
export const customSchema = z.object({
  username: z.string({
    required_error: 'El nombre de usuario es requerido',
    invalid_type_error: 'El nombre de usuario debe ser texto',
  }).min(3, {
    message: 'El nombre de usuario debe tener al menos 3 caracteres',
  }),
});
```

## Reglas Importantes

- ✅ **SIEMPRE** crear schemas en `src/schemas/`
- ✅ **SIEMPRE** inferir tipos con `z.infer<typeof schema>`
- ✅ **SIEMPRE** usar `safeParse()` para validación sin lanzar errores
- ✅ **SIEMPRE** proporcionar mensajes de error descriptivos
- ✅ **SIEMPRE** organizar schemas por dominio/funcionalidad
- ✅ **SIEMPRE** exportar tipos inferidos junto con schemas
- ❌ **NUNCA** validar manualmente con regex o if/else
- ❌ **NUNCA** duplicar lógica de validación
- ❌ **NUNCA** usar validaciones sin schemas

## Integración con React Hook Form (Opcional)

Si prefieres usar react-hook-form:

```bash
npm install react-hook-form @hookform/resolvers
```

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/schemas/auth.schemas';

export const useLoginPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    // data ya está validado y tipado
    await login(data.email, data.password);
  };

  return {
    register,
    handleSubmit: handleSubmit(onSubmit),
    errors,
    isSubmitting,
  };
};
```

## Ejemplo Completo

```typescript
// schemas/auth.schemas.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Por favor ingresa un email válido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export const registerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Por favor ingresa un email válido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
```

---

**Recuerda:** Zod no solo valida, también infiere tipos TypeScript automáticamente, lo que hace tu código más seguro y consistente.

