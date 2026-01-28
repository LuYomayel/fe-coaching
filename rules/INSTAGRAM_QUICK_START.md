# 🚀 Quick Start: Conectar Instagram

## ✅ Lo que ya tienes
- ✅ Controller implementado
- ✅ Endpoints definidos
- ✅ Manejo de sesión

## 🔴 Lo que necesitas verificar/implementar

### 1. MetaService - Método `getInstagramInfo()` 

El service debe tener un método específico para obtener información de Instagram. Aquí está el código que necesitas:

```typescript
// En MetaService o OAuthUtil

private async getInstagramInfo(accessToken: string): Promise<any> {
  // Paso 1: Obtener páginas de Facebook del usuario
  const pagesResponse = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,instagram_business_account&access_token=${accessToken}`
  );
  
  if (!pagesResponse.ok) {
    const error = await pagesResponse.json();
    throw new Error(`Error al obtener páginas: ${error.error?.message || 'Error desconocido'}`);
  }
  
  const pagesData = await pagesResponse.json();
  
  if (!pagesData.data || pagesData.data.length === 0) {
    throw new Error('No se encontraron páginas de Facebook. Necesitas tener al menos una página de Facebook.');
  }

  // Paso 2: Buscar una página que tenga Instagram Business conectado
  const pageWithIG = pagesData.data.find(
    (page: any) => page.instagram_business_account
  );
  
  if (!pageWithIG) {
    throw new Error(
      'No se encontró una cuenta de Instagram Business conectada a tus páginas de Facebook. ' +
      'Por favor, conecta tu Instagram Business a una página de Facebook primero.'
    );
  }

  // Paso 3: Obtener información detallada de Instagram
  const igAccountId = pageWithIG.instagram_business_account.id;
  
  const igResponse = await fetch(
    `https://graph.facebook.com/v18.0/${igAccountId}?fields=id,username,name,profile_picture_url&access_token=${accessToken}`
  );
  
  if (!igResponse.ok) {
    const error = await igResponse.json();
    throw new Error(`Error al obtener info de Instagram: ${error.error?.message || 'Error desconocido'}`);
  }
  
  const igData = await igResponse.json();

  return {
    accountId: igAccountId,
    accountName: igData.name || igData.username || pageWithIG.name,
    pageId: pageWithIG.id,
    instagramAccountId: igAccountId,
    username: igData.username,
  };
}
```

### 2. Scopes para Instagram

Asegúrate de que `OAuthUtil.buildAuthUrl()` use estos scopes para Instagram:

```typescript
private getScopesForPlatform(platform: string): string[] {
  switch (platform) {
    case 'instagram':
      return [
        'instagram_basic',
        'instagram_manage_messages',
        'pages_show_list',
        'pages_read_engagement' // Opcional pero útil
      ];
    // ... otros casos
  }
}
```

### 3. Verificar que el Service llame a `getInstagramInfo()`

En `handleCallback()`, debe haber algo así:

```typescript
async handleCallback(
  userId: string,
  code: string,
  state: string,
  expectedState: string,
  platform: Platform,
): Promise<void> {
  // ... validar state ...
  
  // Intercambiar code por token
  const accessToken = await this.oauthUtil.exchangeCodeForToken(code);
  
  // Obtener información según la plataforma
  let accountInfo;
  switch (platform) {
    case Platform.INSTAGRAM:
      accountInfo = await this.oauthUtil.getAccountInfo(accessToken, 'instagram');
      break;
    // ... otros casos
  }
  
  // Encriptar y guardar
  const encryptedToken = this.encryptionUtil.encrypt(accessToken);
  
  // ... guardar en DB ...
}
```

---

## 🔧 Configuración en Meta for Developers

### Paso 1: Agregar Instagram Graph API

1. Ve a tu app en [developers.facebook.com](https://developers.facebook.com)
2. En el menú lateral, busca **"Productos"**
3. Busca **"Instagram Graph API"** y haz clic en **"Configurar"**
4. Sigue las instrucciones

### Paso 2: Configurar Redirect URI

1. En la configuración de Instagram Graph API
2. Busca **"Valid OAuth Redirect URIs"**
3. Agrega: `https://tu-backend.com/meta/auth/callback`
4. Guarda cambios

### Paso 3: Solicitar Permisos

1. Ve a **"Permisos y características"** en el menú
2. Agrega estos permisos:
   - `instagram_basic` ✅
   - `instagram_manage_messages` ⚠️ (Requiere revisión de Meta)
   - `pages_show_list` ✅
   - `pages_read_engagement` ✅

**Nota**: `instagram_manage_messages` requiere que envíes tu app a revisión de Meta. Para desarrollo/testing, puedes usar el modo de desarrollo.

---

## 🧪 Testing Local con ngrok

Si estás desarrollando localmente, necesitas exponer tu backend:

```bash
# Terminal 1: Tu backend
npm run start:dev

# Terminal 2: ngrok
ngrok http 3000

# Copia la URL HTTPS (ej: https://abc123.ngrok.io)
# Úsala como META_REDIRECT_URI
```

**Importante**: Meta solo acepta URLs HTTPS, por eso necesitas ngrok o un servidor con SSL.

---

## 📝 Variables de Entorno

```env
# .env
META_APP_ID=1234567890123456
META_APP_SECRET=tu_secret_aqui
META_REDIRECT_URI=https://tu-backend.com/meta/auth/callback
# O para desarrollo local con ngrok:
# META_REDIRECT_URI=https://abc123.ngrok.io/meta/auth/callback

META_API_VERSION=v18.0

# Generar con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=tu_clave_de_64_caracteres_hexadecimales_aqui
```

---

## ✅ Checklist Final

Antes de probar, verifica:

- [ ] `MetaService` tiene método `getInstagramInfo()` o `OAuthUtil.getAccountInfo()` lo implementa
- [ ] Scopes correctos: `instagram_basic,instagram_manage_messages,pages_show_list`
- [ ] App de Meta tiene Instagram Graph API agregado
- [ ] Redirect URI configurado en Meta
- [ ] Variables de entorno configuradas
- [ ] Sesiones funcionando (puedes probar guardando algo en sesión)
- [ ] Base de datos con tabla `meta_connections`
- [ ] `EncryptionUtil` funcionando

---

## 🎯 Flujo de Prueba

1. **Inicia tu backend**
   ```bash
   npm run start:dev
   ```

2. **Inicia ngrok** (si estás en local)
   ```bash
   ngrok http 3000
   ```

3. **Actualiza META_REDIRECT_URI** con la URL de ngrok

4. **En el frontend**, haz clic en "Conectar con Instagram"

5. **Deberías ver**:
   - Ventana emergente de Meta
   - Pantalla de login (si no estás logueado)
   - Pantalla de permisos
   - Redirección a tu callback
   - HTML de éxito
   - Frontend recibe postMessage
   - Tarjeta muestra "Conectado ✓"

---

## 🐛 Debugging

### Si el callback no funciona:

1. **Verifica la URL de callback**:
   - Debe ser exactamente la misma en Meta y en tu código
   - Debe ser HTTPS (ngrok o servidor real)

2. **Verifica los logs del backend**:
   ```typescript
   console.log('Code recibido:', code);
   console.log('State recibido:', state);
   console.log('State esperado:', expectedState);
   ```

3. **Verifica la sesión**:
   ```typescript
   console.log('Sesión completa:', session);
   ```

### Si obtienes error de "No se encontraron páginas":

- El usuario debe tener al menos una página de Facebook
- Debe ser administrador de esa página

### Si obtienes error de "No se encontró Instagram":

- El usuario debe tener Instagram Business (no personal)
- Debe estar conectado a una página de Facebook
- La conexión debe estar activa

---

## 📚 Recursos

- [Instagram Graph API Docs](https://developers.facebook.com/docs/instagram-api)
- [OAuth Flow](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow)
- [Instagram Business Setup](https://www.facebook.com/business/help/898752960195806)

---

**¿Tienes todo esto? ¡Entonces estás listo para conectar Instagram! 🚀**

