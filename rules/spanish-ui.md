# Idioma de la Interfaz de Usuario

## Regla Principal

**TODAS las páginas y componentes deben mostrar texto en ESPAÑOL.**

## Reglas Específicas

### ✅ Texto en Español (UI)
- Títulos de páginas
- Labels de formularios
- Mensajes de error
- Mensajes de éxito
- Botones
- Placeholders
- Textos de ayuda (helper text)
- Mensajes de validación
- Textos de navegación
- Footer y copyright
- Cualquier texto visible para el usuario

### ✅ Código en Inglés
- Nombres de variables
- Nombres de funciones
- Nombres de componentes
- Comentarios en código
- Nombres de archivos
- Propiedades de objetos
- Keys de objetos JSON
- Nombres de clases CSS/Tailwind

## Ejemplos

### ✅ CORRECTO

```typescript
// Código en inglés
export const LoginPage = () => {
  const { email, password, error, handleSubmit } = useLoginPage();

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Correo Electrónico"  // ✅ Español
        placeholder="nombre@empresa.com"  // ✅ Español
        error={error}
      />
      <Button>Iniciar Sesión</Button>  // ✅ Español
    </form>
  );
};
```

### ❌ INCORRECTO

```typescript
// ❌ Texto en inglés en la UI
<Input
  label="Email Address"  // ❌ Inglés
  placeholder="name@company.com"  // ❌ Inglés
/>
<Button>Sign In</Button>  // ❌ Inglés
```

## Mensajes de Error

Todos los mensajes de error deben estar en español:

```typescript
// ✅ CORRECTO
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es requerido')  // ✅ Español
    .email('Por favor ingresa un correo electrónico válido'),  // ✅ Español
  password: z
    .string()
    .min(1, 'La contraseña es requerida')  // ✅ Español
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),  // ✅ Español
});
```

## Componentes Shared

Los componentes shared deben aceptar texto en español como props:

```typescript
// ✅ CORRECTO
<Button variant="primary">Guardar Cambios</Button>
<Input label="Nombre Completo" placeholder="Ingresa tu nombre" />
<Alert variant="success">¡Operación exitosa!</Alert>
```

## Schemas de Validación

Todos los mensajes de validación en schemas Zod deben estar en español:

```typescript
// ✅ CORRECTO
export const userSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Correo electrónico inválido'),
  age: z.number().positive('La edad debe ser un número positivo'),
});
```

## Excepciones

### Nombres Técnicos
Si es necesario mostrar nombres técnicos (como nombres de archivos, URLs, IDs), pueden mantenerse en inglés:

```typescript
// ✅ Aceptable
<span>Archivo: {fileName}</span>  // fileName puede ser en inglés
<span>ID: {userId}</span>  // userId puede ser en inglés
```

### Códigos de Error del Sistema
Los códigos de error del sistema pueden mantenerse en inglés si vienen del backend:

```typescript
// ✅ Aceptable
{error && (
  <Alert variant="danger">
    Error del servidor: {error.code}  // code puede ser en inglés
  </Alert>
)}
```

Pero el mensaje descriptivo debe estar en español:

```typescript
// ✅ MEJOR
{error && (
  <Alert variant="danger">
    Error al procesar la solicitud. Código: {error.code}
  </Alert>
)}
```

## Checklist

Al crear una nueva página o componente, verificar:

- [ ] Todos los títulos están en español
- [ ] Todos los labels están en español
- [ ] Todos los placeholders están en español
- [ ] Todos los botones están en español
- [ ] Todos los mensajes de error están en español
- [ ] Todos los mensajes de éxito están en español
- [ ] Todos los textos de ayuda están en español
- [ ] El código (variables, funciones) está en inglés
- [ ] Los comentarios en código están en inglés

## Nota Importante

**Aunque se reciban screenshots o referencias en inglés, SIEMPRE traducir todo el texto visible al español.**

El código puede y debe estar en inglés para mantener estándares internacionales, pero la experiencia del usuario debe ser completamente en español.

