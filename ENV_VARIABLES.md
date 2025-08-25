# Variables de Entorno para fe-coaching

## Variables de Entorno Necesarias

### Para Desarrollo (.env.local)

Crea un archivo `.env.local` en la raíz del proyecto con:

```bash
# API Backend URL (OBLIGATORIO)
NEXT_PUBLIC_API_URL=https://tu-api-backend.com

# OpenAI API Key (opcional, para funciones de IA)
NEXT_PUBLIC_OPENAI_API_KEY=sk-your-openai-key-here

# Stripe Keys (para pagos)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret

# URL del sitio (para redirects y metadata)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Para Netlify (Producción)

En el panel de Netlify, ve a Site Settings > Environment Variables y agrega:

```bash
# API Backend URL (OBLIGATORIO)
NEXT_PUBLIC_API_URL=https://tu-api-backend-produccion.com

# OpenAI API Key (opcional)
NEXT_PUBLIC_OPENAI_API_KEY=sk-your-openai-key-production

# Stripe Keys de producción
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-key
STRIPE_SECRET_KEY=sk_live_your-stripe-secret

# URL del sitio de producción
NEXT_PUBLIC_SITE_URL=https://tu-dominio.netlify.app
```

## ⚠️ Importante

### Variables Públicas (`NEXT_PUBLIC_`)

- Estas variables son accesibles en el cliente (navegador)
- Solo incluye información que sea segura exponer públicamente
- NO incluyas secrets, passwords, o keys privadas

### Variables Privadas (sin `NEXT_PUBLIC_`)

- Solo accesibles en el servidor
- Úsalas para API keys privadas, database URLs, etc.

## Migración desde React

Si migras desde React, cambia:

- `REACT_APP_API_URL` → `NEXT_PUBLIC_API_URL`
- `REACT_APP_*` → `NEXT_PUBLIC_*`

## Verificación

Para verificar que las variables están funcionando:

```javascript
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
```
