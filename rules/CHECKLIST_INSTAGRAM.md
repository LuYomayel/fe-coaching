# ✅ Checklist: Conexión a Instagram

## 🔍 Verificación de Componentes

### 1. Controller ✅
- [x] `MetaController` implementado
- [x] Endpoints: `/status`, `/auth/init`, `/auth/callback`, `/connections/:platform`
- [x] Manejo de sesión para state y userId
- [x] HTML de éxito/error con postMessage

### 2. Service (Verificar)
- [ ] `MetaService` implementado con:
  - [ ] `getConnectionStatus(userId: string)`
  - [ ] `initAuth(userId: string, platform: Platform)`
  - [ ] `handleCallback(userId, code, state, expectedState, platform)`
  - [ ] `disconnect(userId: string, platform: Platform)`

### 3. DTOs (Verificar)
- [ ] `InitAuthDto` con validación `@IsEnum(Platform)`
- [ ] `ConnectionStatusDto` y `ConnectionDto`
- [ ] `Platform` enum exportado

### 4. Entity (Verificar)
- [ ] `MetaConnection` entity con:
  - [ ] Campos: `platform`, `accountId`, `accountName`, `accessToken` (encriptado)
  - [ ] Campos específicos: `pageId`, `instagramAccountId`
  - [ ] Relación con `User`
  - [ ] Índices y constraints

### 5. Utilities (Verificar)
- [ ] `OAuthUtil` con:
  - [ ] `generateState()` - Genera token CSRF
  - [ ] `buildAuthUrl(platform, state)` - Construye URL de OAuth
  - [ ] `exchangeCodeForToken(code)` - Intercambia code por token
  - [ ] `getAccountInfo(accessToken, platform)` - Obtiene info de Instagram
  - [ ] Scopes correctos para Instagram: `instagram_basic,instagram_manage_messages,pages_show_list`

- [ ] `EncryptionUtil` con:
  - [ ] `encrypt(text)` - Encripta tokens
  - [ ] `decrypt(text)` - Desencripta tokens
  - [ ] Usa AES-256-CBC

### 6. Variables de Entorno
- [ ] `.env` configurado con:
  ```env
  META_APP_ID=tu_app_id
  META_APP_SECRET=tu_app_secret
  META_REDIRECT_URI=https://tu-backend.com/meta/auth/callback
  META_API_VERSION=v18.0
  ENCRYPTION_KEY=64_caracteres_hexadecimales
  ```

### 7. Configuración de Meta for Developers
- [ ] App creada en [developers.facebook.com](https://developers.facebook.com)
- [ ] **Instagram Graph API** agregado como producto
- [ ] Redirect URI configurado: `https://tu-backend.com/meta/auth/callback`
- [ ] Permisos solicitados:
  - `instagram_basic`
  - `instagram_manage_messages`
  - `pages_show_list`
- [ ] App ID y App Secret copiados

### 8. Base de Datos
- [ ] Tabla `meta_connections` creada
- [ ] Migración ejecutada (si usas TypeORM migrations)

### 9. Sesiones (NestJS)
- [ ] `express-session` configurado
- [ ] Store de sesiones configurado (Redis, memoria, etc.)
- [ ] Middleware de sesión aplicado globalmente

### 10. TransformInterceptor
- [ ] Respuestas envueltas en formato:
  ```json
  {
    "data": {...},
    "message": "...",
    "status": 200
  }
  ```

---

## 🧪 Testing Rápido

### Paso 1: Verificar Endpoints
```bash
# 1. Obtener estado (debe retornar instagram: { isConnected: false })
curl -X GET http://localhost:3000/meta/connections/status \
  -H "Authorization: Bearer TU_TOKEN"

# 2. Iniciar OAuth (debe retornar authUrl)
curl -X POST http://localhost:3000/meta/auth/init \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"platform": "instagram"}'
```

### Paso 2: Verificar URL de OAuth
La `authUrl` debe verse así:
```
https://www.facebook.com/v18.0/dialog/oauth?
  client_id=TU_APP_ID&
  redirect_uri=https://tu-backend.com/meta/auth/callback&
  state=TOKEN_ALEATORIO&
  scope=instagram_basic,instagram_manage_messages,pages_show_list&
  response_type=code
```

### Paso 3: Flujo Completo
1. Abrir `authUrl` en navegador
2. Iniciar sesión en Meta
3. Aceptar permisos
4. Debe redirigir a `/meta/auth/callback?code=XXX&state=YYY`
5. Debe mostrar HTML de éxito
6. Frontend debe recibir `postMessage`

---

## ⚠️ Problemas Comunes

### Error: "Estado no encontrado en sesión"
- **Causa**: Sesiones no configuradas o expiradas
- **Solución**: Verificar configuración de `express-session`

### Error: "No se encontraron páginas de Facebook"
- **Causa**: El usuario no tiene páginas de Facebook conectadas a su Instagram
- **Solución**: El usuario debe tener una cuenta de Instagram Business conectada a una página de Facebook

### Error: "No se encontró una cuenta de Instagram conectada"
- **Causa**: La página de Facebook no tiene Instagram Business conectado
- **Solución**: El usuario debe conectar su Instagram Business a una página de Facebook primero

### Error: "Token inválido o expirado"
- **Causa**: El code de OAuth expiró (válido solo 10 minutos)
- **Solución**: El usuario debe iniciar el flujo nuevamente

### Error: "ENCRYPTION_KEY debe tener 64 caracteres"
- **Causa**: La clave de encriptación no está configurada correctamente
- **Solución**: Generar clave con: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## 📋 Requisitos del Usuario para Instagram

Para que un usuario pueda conectar Instagram, debe tener:

1. ✅ **Cuenta de Instagram Business** o **Instagram Creator**
2. ✅ **Página de Facebook** conectada a esa cuenta de Instagram
3. ✅ **Permisos de administrador** en la página de Facebook
4. ✅ **Iniciar sesión** en Meta con la cuenta que tiene acceso a la página

**Nota**: No se puede conectar una cuenta personal de Instagram, solo Business/Creator.

---

## 🎯 Estado Actual

Marca lo que ya tienes implementado:

- [ ] MetaService completo
- [ ] OAuthUtil con método `getInstagramInfo()`
- [ ] EncryptionUtil funcionando
- [ ] Entity MetaConnection creada
- [ ] Variables de entorno configuradas
- [ ] App de Meta configurada con Instagram Graph API
- [ ] Sesiones configuradas en NestJS
- [ ] Base de datos con tabla meta_connections

**Si todos están marcados → ¡Estás listo para conectar Instagram! 🚀**

