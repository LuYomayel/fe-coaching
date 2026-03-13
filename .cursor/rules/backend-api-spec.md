# Especificación de Endpoints del Backend

Esta documentación describe qué debe hacer cada endpoint del backend para que el frontend funcione correctamente.

## ⚠️ Importante: TransformInterceptor

El backend usa un `TransformInterceptor` de NestJS que envuelve **TODAS** las respuestas en esta estructura:

```typescript
{
  data: T,        // Los datos reales de la respuesta
  message: string, // Mensaje descriptivo (ej: "Operación exitosa")
  status: number   // Código de estado HTTP
}
```

**El frontend automáticamente extrae el `data`**, por lo que los métodos del `api-client` devuelven directamente los datos, no el wrapper completo.

## 🔐 Endpoints de Autenticación

### `GET /api/auth/validate-token`

**Propósito:** Validar si un token JWT es válido y obtener los datos del usuario autenticado.

**Headers Requeridos:**

```
Authorization: Bearer <token>
```

**Qué debe hacer el backend:**

1. **Extraer el token** del header `Authorization`
2. **Verificar el token** (firma JWT, expiración)
3. **Obtener datos del usuario** de la base de datos
4. **Devolver respuesta exitosa** con datos del usuario

**Respuesta Exitosa (200 OK):**

```json
{
  "data": {
    "id": "user-123",
    "email": "usuario@empresa.com",
    "name": "Nombre del Usuario"
  },
  "message": "Operación exitosa",
  "status": 200
}
```

### `POST /api/auth/login`

**Propósito:** Autenticar un usuario y devolver un token JWT.

**Body:**

```json
{
  "email": "usuario@empresa.com",
  "password": "contraseña123"
}
```

**Respuesta Exitosa (200 OK):**

```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-123",
      "email": "usuario@empresa.com",
      "name": "Nombre del Usuario"
    }
  },
  "message": "Operación exitosa",
  "status": 200
}
```

## 📝 Estructura de Respuestas

### Respuestas Exitosas

El backend devuelve:

```json
{
  "data": { ... },
  "message": "Operación exitosa",
  "status": 200
}
```

El frontend recibe automáticamente solo el `data`.

### Respuestas de Error

El backend devuelve:

```json
{
  "data": null,
  "message": "Mensaje de error descriptivo en español",
  "status": 401
}
```

El frontend extrae el `message` para mostrar el error al usuario.
