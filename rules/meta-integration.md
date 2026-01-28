# Integración con Plataformas de Meta

## 📱 Descripción General

Esta aplicación permite conectarse a las tres principales plataformas de mensajería de Meta:
- **WhatsApp Business API**
- **Instagram Direct Messages**
- **Facebook Messenger**

## 🔐 Flujo de Autenticación OAuth 2.0

### Proceso de Conexión

1. **Iniciar OAuth Flow**
   - El usuario hace clic en "Conectar con [Platform]"
   - El frontend llama a `POST /meta/auth/init` con el parámetro `platform`
   - El backend responde con una `authUrl` de Meta

2. **Ventana Emergente de OAuth**
   - Se abre una ventana emergente con la URL de OAuth de Meta
   - El usuario inicia sesión en Meta (si no lo está)
   - Meta muestra los permisos que la app está solicitando
   - El usuario acepta o rechaza los permisos

3. **Callback y Validación**
   - Meta redirige al usuario a la URL de callback configurada
   - El backend recibe el `code` de autorización
   - El backend intercambia el `code` por un `access_token`
   - Se guarda el token y la información de la cuenta

4. **Notificación al Frontend**
   - El callback envía un mensaje de `postMessage` a la ventana padre
   - El frontend cierra la ventana emergente
   - El frontend actualiza el estado de las conexiones

## 🔧 Endpoints del Backend

### 1. Obtener Estado de Conexiones
```
GET /meta/connections/status
```

**Respuesta:**
```json
{
  "data": {
    "whatsapp": {
      "platform": "whatsapp",
      "isConnected": true,
      "accountName": "Mi Negocio",
      "accountId": "123456789",
      "phoneNumber": "+1234567890",
      "connectedAt": "2026-01-15T10:30:00Z"
    },
    "instagram": {
      "platform": "instagram",
      "isConnected": false
    },
    "messenger": {
      "platform": "messenger",
      "isConnected": false
    }
  },
  "message": "Operación exitosa",
  "status": 200
}
```

### 2. Iniciar Flujo OAuth
```
POST /meta/auth/init
Body: { "platform": "whatsapp" | "instagram" | "messenger" }
```

**Respuesta:**
```json
{
  "data": {
    "authUrl": "https://www.facebook.com/v18.0/dialog/oauth?client_id=..."
  },
  "message": "Operación exitosa",
  "status": 200
}
```

### 3. Callback OAuth (URL de Redirect)
```
GET /meta/auth/callback?code=<code>&state=<state>
```

Este endpoint:
- Valida el `state` para prevenir CSRF
- Intercambia el `code` por un `access_token`
- Obtiene información de la cuenta (ID, nombre, etc.)
- Guarda el token en la base de datos
- Renderiza una página HTML que envía un mensaje al padre:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Autenticación exitosa</title>
</head>
<body>
  <script>
    if (window.opener) {
      window.opener.postMessage({
        type: 'META_OAUTH_SUCCESS',
        platform: 'whatsapp'
      }, window.location.origin);
    }
  </script>
  <p>Autenticación exitosa. Esta ventana se cerrará automáticamente...</p>
</body>
</html>
```

### 4. Desconectar Plataforma
```
DELETE /meta/connections/:platform
```

**Respuesta:**
```json
{
  "data": {},
  "message": "Plataforma desconectada exitosamente",
  "status": 200
}
```

## 🔑 Configuración en Meta for Developers

### Crear App en Meta

1. Ve a [Meta for Developers](https://developers.facebook.com)
2. Crea una nueva app o usa una existente
3. Agrega los productos:
   - WhatsApp Business Platform
   - Instagram Graph API
   - Messenger Platform

### Configurar OAuth Redirect URI

En la configuración de la app, agrega la URL de callback:
```
https://tu-dominio.com/meta/auth/callback
```

### Permisos (Scopes) Necesarios

#### WhatsApp Business:
- `whatsapp_business_management` - Gestionar cuentas de WhatsApp Business
- `whatsapp_business_messaging` - Enviar y recibir mensajes

#### Instagram:
- `instagram_basic` - Información básica de la cuenta
- `instagram_manage_messages` - Gestionar mensajes directos
- `pages_show_list` - Listar páginas de Facebook asociadas
- `pages_read_engagement` - Leer interacciones

#### Messenger:
- `pages_messaging` - Enviar y recibir mensajes
- `pages_manage_metadata` - Gestionar configuración de la página
- `pages_show_list` - Listar páginas

### Variables de Entorno del Backend

```env
# Meta OAuth
META_APP_ID=tu_app_id
META_APP_SECRET=tu_app_secret
META_REDIRECT_URI=https://tu-dominio.com/meta/auth/callback
META_API_VERSION=v18.0

# URLs
FRONTEND_URL=https://tu-frontend.com
```

## 🗄️ Modelo de Datos (Backend)

### MetaConnection Entity

```typescript
interface MetaConnection {
  id: string;
  userId: string; // Usuario que hizo la conexión
  platform: 'whatsapp' | 'instagram' | 'messenger';
  accountId: string; // ID de la cuenta en Meta
  accountName: string;
  accessToken: string; // Encriptado
  refreshToken?: string; // Encriptado (si aplica)
  tokenExpiresAt?: Date;
  phoneNumber?: string; // Solo WhatsApp
  phoneNumberId?: string; // Solo WhatsApp (para API)
  pageId?: string; // Instagram y Messenger
  instagramAccountId?: string; // Solo Instagram
  isActive: boolean;
  connectedAt: Date;
  updatedAt: Date;
}
```

## 🔒 Seguridad

### 1. Estado CSRF
- Generar un `state` aleatorio al iniciar OAuth
- Guardar en sesión o JWT temporal
- Validar en el callback

### 2. Encriptación de Tokens
- Los access tokens deben encriptarse en la base de datos
- Usar AES-256 o similar
- La clave de encriptación debe estar en variables de entorno

### 3. Validación de Origen
- En el `postMessage`, validar `event.origin`
- Solo aceptar mensajes del mismo origen

### 4. Tokens de Larga Duración
- Solicitar tokens de larga duración cuando sea posible
- Para Instagram/Facebook: intercambiar token de corta duración por uno de larga duración (60 días)
- Implementar renovación automática antes de expiración

## 📞 Uso de las APIs

### Enviar Mensaje de WhatsApp

```typescript
POST https://graph.facebook.com/v18.0/{phone_number_id}/messages
Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/json

Body:
{
  "messaging_product": "whatsapp",
  "to": "+1234567890",
  "type": "text",
  "text": {
    "body": "Hola, este es un mensaje de prueba"
  }
}
```

### Enviar Mensaje de Instagram

```typescript
POST https://graph.facebook.com/v18.0/me/messages
Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/json

Body:
{
  "recipient": {
    "id": "{user_id}"
  },
  "message": {
    "text": "Hola desde Instagram"
  }
}
```

### Enviar Mensaje de Messenger

```typescript
POST https://graph.facebook.com/v18.0/me/messages
Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/json

Body:
{
  "recipient": {
    "id": "{user_id}"
  },
  "message": {
    "text": "Hola desde Messenger"
  }
}
```

## 🔄 Webhooks (Opcional pero Recomendado)

Para recibir mensajes entrantes, configurar webhooks en Meta:

### WhatsApp Webhook
```
URL: https://tu-dominio.com/webhooks/whatsapp
Verify Token: tu_token_secreto
```

### Instagram Webhook
```
URL: https://tu-dominio.com/webhooks/instagram
Verify Token: tu_token_secreto
Subscriptions: messages, messaging_postbacks
```

### Messenger Webhook
```
URL: https://tu-dominio.com/webhooks/messenger
Verify Token: tu_token_secreto
Subscriptions: messages, messaging_postbacks
```

## ⚠️ Limitaciones y Consideraciones

### Límites de Tasa (Rate Limits)
- WhatsApp: ~80 mensajes/segundo por número
- Instagram: ~200 solicitudes/hora por usuario
- Messenger: ~200 solicitudes/hora por usuario

### Revisión de App de Meta
- Para producción, la app debe pasar por revisión de Meta
- Se deben justificar los permisos solicitados
- Puede tomar varios días

### Costos
- WhatsApp Business API tiene costos por conversación
- Instagram y Messenger son gratuitos (por ahora)

### Expiración de Tokens
- Los tokens pueden expirar o ser revocados
- Implementar manejo de errores 401/403
- Mostrar al usuario que debe reconectar

## 🧪 Testing

### Modo de Prueba (Sandbox)
- WhatsApp tiene un número de prueba
- Instagram/Messenger permiten testing con usuarios de prueba de la app

### Cuentas de Prueba
- Crear usuarios de prueba en Meta for Developers
- Usar estas cuentas para testing sin afectar cuentas reales

## 📚 Referencias

- [Meta for Developers](https://developers.facebook.com)
- [WhatsApp Business Platform](https://developers.facebook.com/docs/whatsapp)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [Messenger Platform](https://developers.facebook.com/docs/messenger-platform)
- [OAuth 2.0 de Facebook](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow)

