# Ejemplos de Código para el Backend

Este archivo contiene ejemplos de implementación para el backend con NestJS.

## Estructura de Archivos Sugerida

```
src/
├── meta/
│   ├── meta.module.ts
│   ├── meta.controller.ts
│   ├── meta.service.ts
│   ├── entities/
│   │   └── meta-connection.entity.ts
│   ├── dto/
│   │   ├── init-auth.dto.ts
│   │   └── connection-status.dto.ts
│   └── utils/
│       ├── encryption.util.ts
│       └── oauth.util.ts
```

## Variables de Entorno

```env
# .env
META_APP_ID=tu_app_id_de_meta
META_APP_SECRET=tu_app_secret_de_meta
META_REDIRECT_URI=https://tu-backend.com/meta/auth/callback
META_API_VERSION=v18.0

# Generar con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=64_caracteres_hexadecimales_aqui
```

## Generar ENCRYPTION_KEY

```bash
# Ejecutar en terminal para generar clave de 32 bytes (64 hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Nota

Este archivo contiene ejemplos de referencia para implementar el backend. Los ejemplos están diseñados para NestJS con TypeORM.
