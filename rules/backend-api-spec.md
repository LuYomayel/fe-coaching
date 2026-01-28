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

**Ejemplo:**
- Backend devuelve: `{ data: { id: "123", name: "Juan" }, message: "Operación exitosa", status: 200 }`
- Frontend recibe: `{ id: "123", name: "Juan" }` (solo el `data`)

## 🔐 Endpoints de Autenticación

### `GET /api/auth/validate-token`

**Propósito:** Validar si un token JWT es válido y obtener los datos del usuario autenticado.

**Headers Requeridos:**
```
Authorization: Bearer <token>
```

**Qué debe hacer el backend:**

1. **Extraer el token** del header `Authorization`
   - Formato esperado: `Bearer <token>`
   - Si no existe el header o el formato es incorrecto → `401 Unauthorized`

2. **Verificar el token**
   - Validar la firma del JWT
   - Verificar que no haya expirado (`exp` claim)
   - Verificar que el token no esté en una blacklist (si implementas logout con invalidación)
   - Si el token es inválido → `401 Unauthorized`

3. **Obtener datos del usuario**
   - Extraer el `userId` del token (normalmente en el claim `sub` o `userId`)
   - Buscar el usuario en la base de datos
   - Si el usuario no existe o está desactivado → `401 Unauthorized`

4. **Devolver respuesta exitosa**
   - Status: `200 OK`
   - Body: El TransformInterceptor envuelve la respuesta automáticamente

**Respuesta Exitosa (200 OK) - Estructura real del backend:**
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

**Nota:** El frontend extrae automáticamente el `data`, por lo que los métodos reciben directamente:
```json
{
  "id": "user-123",
  "email": "usuario@empresa.com",
  "name": "Nombre del Usuario"
}
```

**Respuestas de Error:**

- `401 Unauthorized` - Token inválido, expirado, o usuario no encontrado
  ```json
  {
    "data": null,
    "message": "Token inválido o expirado",
    "status": 401
  }
  ```

- `401 Unauthorized` - Token no proporcionado
  ```json
  {
    "data": null,
    "message": "Token de autenticación requerido",
    "status": 401
  }
  ```

**Nota:** Los errores también vienen envueltos por el TransformInterceptor. El frontend extrae el `message` para mostrar el error al usuario.

**Ejemplo de Implementación (Node.js/Express):**

```javascript
// Middleware de autenticación
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ message: 'Token de autenticación requerido' });
  }

  try {
    // Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuario en la base de datos
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Token inválido o expirado' });
    }

    // Agregar usuario al request para uso posterior
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token inválido' });
    }
    return res.status(401).json({ message: 'Error al validar token' });
  }
};

// Endpoint
app.get('/api/auth/validate-token', authenticateToken, (req, res) => {
  // El middleware ya validó el token y agregó req.user
  // El TransformInterceptor envuelve automáticamente la respuesta
  res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
  });
  // El TransformInterceptor convierte esto en:
  // {
  //   data: { id, email, name },
  //   message: "Operación exitosa",
  //   status: 200
  // }
});
```

**Cuándo se llama desde el frontend:**

- Al cargar la aplicación (en `AuthContext.checkAuth()`)
- Para verificar si el usuario sigue autenticado
- Antes de hacer operaciones que requieren autenticación

**Notas importantes:**

- Este endpoint NO debe requerir autenticación previa (es el que valida la autenticación)
- Debe ser rápido (se llama frecuentemente)
- Puedes cachear la validación por unos segundos si es necesario
- Si implementas refresh tokens, este endpoint puede devolver un nuevo access token si está cerca de expirar

---

### `POST /api/auth/login`

**Propósito:** Autenticar un usuario y devolver un token JWT.

**Body:**
```json
{
  "email": "usuario@empresa.com",
  "password": "contraseña123"
}
```

**Qué debe hacer:**

1. Validar email y password
2. Buscar usuario en la base de datos
3. Verificar que la contraseña sea correcta (usar bcrypt o similar)
4. Generar un JWT token con el `userId`
5. Devolver token y datos del usuario

**Respuesta Exitosa (200 OK) - Estructura real del backend:**
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

**Nota:** El frontend recibe directamente el objeto dentro de `data`:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "email": "usuario@empresa.com",
    "name": "Nombre del Usuario"
  }
}
```

**Respuestas de Error:**

- `401 Unauthorized` - Credenciales incorrectas
  ```json
  {
    "data": null,
    "message": "Credenciales inválidas",
    "status": 401
  }
  ```

- `400 Bad Request` - Datos faltantes o inválidos
  ```json
  {
    "data": null,
    "message": "Email y contraseña son requeridos",
    "status": 400
  }
  ```

---

### `POST /api/auth/logout`

**Propósito:** Invalidar el token actual (opcional, pero recomendado).

**Headers Requeridos:**
```
Authorization: Bearer <token>
```

**Qué debe hacer:**

1. Extraer el token del header
2. Agregar el token a una blacklist (opcional)
3. Devolver éxito

**Respuesta Exitosa (200 OK):**
```json
{
  "message": "Sesión cerrada exitosamente"
}
```

**Nota:** Si no implementas blacklist, este endpoint puede simplemente devolver éxito. El frontend limpiará el token del localStorage de todas formas.

---

## 📝 Estructura de Respuestas

**IMPORTANTE:** El `TransformInterceptor` de NestJS envuelve **TODAS** las respuestas automáticamente.

### Respuestas Exitosas

El backend devuelve:
```json
{
  "data": { ... },           // Los datos reales
  "message": "Operación exitosa",
  "status": 200
}
```

El frontend recibe automáticamente solo el `data`:
```json
{ ... }
```

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

**Nota:** No necesitas envolver manualmente las respuestas en el backend, el `TransformInterceptor` lo hace automáticamente. Solo devuelve los datos directamente y NestJS los envuelve.

---

## 🔒 Seguridad

- Todos los endpoints protegidos deben validar el token JWT
- Los tokens deben tener expiración (recomendado: 1 hora para access tokens)
- Usar HTTPS en producción
- Validar y sanitizar todos los inputs
- Implementar rate limiting en endpoints de autenticación

---

**Última actualización:** Enero 2026

