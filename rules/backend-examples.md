# 💻 Ejemplos de Código para el Backend

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

---

## 1. Entity: MetaConnection

```typescript
// src/meta/entities/meta-connection.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum Platform {
  WHATSAPP = 'whatsapp',
  INSTAGRAM = 'instagram',
  MESSENGER = 'messenger',
}

@Entity('meta_connections')
@Unique(['user', 'platform', 'accountId'])
@Index(['user', 'platform', 'isActive'])
export class MetaConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({
    type: 'enum',
    enum: Platform,
  })
  platform: Platform;

  @Column()
  accountId: string;

  @Column()
  accountName: string;

  @Column({ type: 'text' })
  accessToken: string; // ENCRIPTADO

  @Column({ type: 'text', nullable: true })
  refreshToken?: string; // ENCRIPTADO

  @Column({ type: 'timestamp', nullable: true })
  tokenExpiresAt?: Date;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ nullable: true })
  phoneNumberId?: string;

  @Column({ nullable: true })
  pageId?: string;

  @Column({ nullable: true })
  instagramAccountId?: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  connectedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

## 2. DTOs

```typescript
// src/meta/dto/init-auth.dto.ts
import { IsEnum } from 'class-validator';
import { Platform } from '../entities/meta-connection.entity';

export class InitAuthDto {
  @IsEnum(Platform)
  platform: Platform;
}

// src/meta/dto/connection-status.dto.ts
export class ConnectionDto {
  platform: string;
  isConnected: boolean;
  accountName?: string;
  accountId?: string;
  phoneNumber?: string;
  pageId?: string;
  connectedAt?: string;
}

export class ConnectionStatusDto {
  whatsapp: ConnectionDto;
  instagram: ConnectionDto;
  messenger: ConnectionDto;
}
```

---

## 3. Utilidad de Encriptación

```typescript
// src/meta/utils/encryption.util.ts
import * as crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EncryptionUtil {
  private algorithm = 'aes-256-cbc';
  private key: Buffer;

  constructor(private configService: ConfigService) {
    const keyHex = this.configService.get<string>('ENCRYPTION_KEY');
    if (!keyHex || keyHex.length !== 64) {
      throw new Error('ENCRYPTION_KEY debe tener 64 caracteres hexadecimales (32 bytes)');
    }
    this.key = Buffer.from(keyHex, 'hex');
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  decrypt(text: string): string {
    const [ivHex, encrypted] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
```

---

## 4. Utilidad OAuth

```typescript
// src/meta/utils/oauth.util.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class OAuthUtil {
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly redirectUri: string;
  private readonly apiVersion: string;

  constructor(private configService: ConfigService) {
    this.appId = this.configService.get<string>('META_APP_ID');
    this.appSecret = this.configService.get<string>('META_APP_SECRET');
    this.redirectUri = this.configService.get<string>('META_REDIRECT_URI');
    this.apiVersion = this.configService.get<string>('META_API_VERSION', 'v18.0');
  }

  generateState(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  buildAuthUrl(platform: string, state: string): string {
    const scopes = this.getScopesForPlatform(platform);
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      state: state,
      scope: scopes.join(','),
      response_type: 'code',
    });

    return `https://www.facebook.com/${this.apiVersion}/dialog/oauth?${params.toString()}`;
  }

  private getScopesForPlatform(platform: string): string[] {
    switch (platform) {
      case 'whatsapp':
        return ['whatsapp_business_management', 'whatsapp_business_messaging'];
      case 'instagram':
        return ['instagram_basic', 'instagram_manage_messages', 'pages_show_list'];
      case 'messenger':
        return ['pages_messaging', 'pages_manage_metadata', 'pages_show_list'];
      default:
        throw new Error(`Plataforma no soportada: ${platform}`);
    }
  }

  async exchangeCodeForToken(code: string): Promise<string> {
    const params = new URLSearchParams({
      client_id: this.appId,
      client_secret: this.appSecret,
      redirect_uri: this.redirectUri,
      code: code,
    });

    const response = await fetch(
      `https://graph.facebook.com/${this.apiVersion}/oauth/access_token?${params.toString()}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Error al intercambiar código: ${error.error?.message || 'Error desconocido'}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  async getAccountInfo(accessToken: string, platform: string): Promise<any> {
    switch (platform) {
      case 'whatsapp':
        return this.getWhatsAppInfo(accessToken);
      case 'instagram':
        return this.getInstagramInfo(accessToken);
      case 'messenger':
        return this.getMessengerInfo(accessToken);
      default:
        throw new Error(`Plataforma no soportada: ${platform}`);
    }
  }

  private async getWhatsAppInfo(accessToken: string): Promise<any> {
    // Obtener business accounts
    const response = await fetch(
      `https://graph.facebook.com/${this.apiVersion}/me/businesses?access_token=${accessToken}`
    );
    const businesses = await response.json();
    
    if (!businesses.data || businesses.data.length === 0) {
      throw new Error('No se encontraron cuentas de WhatsApp Business');
    }

    const businessId = businesses.data[0].id;
    
    // Obtener phone numbers
    const phoneResponse = await fetch(
      `https://graph.facebook.com/${this.apiVersion}/${businessId}/phone_numbers?access_token=${accessToken}`
    );
    const phones = await phoneResponse.json();

    if (!phones.data || phones.data.length === 0) {
      throw new Error('No se encontraron números de teléfono');
    }

    const phone = phones.data[0];
    
    return {
      accountId: businessId,
      accountName: businesses.data[0].name,
      phoneNumber: phone.display_phone_number,
      phoneNumberId: phone.id,
    };
  }

  private async getInstagramInfo(accessToken: string): Promise<any> {
    // Obtener páginas de Facebook
    const response = await fetch(
      `https://graph.facebook.com/${this.apiVersion}/me/accounts?fields=id,name,instagram_business_account&access_token=${accessToken}`
    );
    const pages = await response.json();

    if (!pages.data || pages.data.length === 0) {
      throw new Error('No se encontraron páginas de Facebook');
    }

    // Buscar una página con Instagram conectado
    const pageWithIG = pages.data.find((page: any) => page.instagram_business_account);
    
    if (!pageWithIG) {
      throw new Error('No se encontró una cuenta de Instagram conectada a las páginas');
    }

    return {
      accountId: pageWithIG.instagram_business_account.id,
      accountName: pageWithIG.name,
      pageId: pageWithIG.id,
      instagramAccountId: pageWithIG.instagram_business_account.id,
    };
  }

  private async getMessengerInfo(accessToken: string): Promise<any> {
    // Obtener páginas de Facebook
    const response = await fetch(
      `https://graph.facebook.com/${this.apiVersion}/me/accounts?fields=id,name&access_token=${accessToken}`
    );
    const pages = await response.json();

    if (!pages.data || pages.data.length === 0) {
      throw new Error('No se encontraron páginas de Facebook');
    }

    const page = pages.data[0];

    return {
      accountId: page.id,
      accountName: page.name,
      pageId: page.id,
    };
  }
}
```

---

## 5. Service

```typescript
// src/meta/meta.service.ts
import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MetaConnection, Platform } from './entities/meta-connection.entity';
import { User } from '../users/entities/user.entity';
import { EncryptionUtil } from './utils/encryption.util';
import { OAuthUtil } from './utils/oauth.util';
import { ConnectionStatusDto, ConnectionDto } from './dto/connection-status.dto';

@Injectable()
export class MetaService {
  constructor(
    @InjectRepository(MetaConnection)
    private metaConnectionRepository: Repository<MetaConnection>,
    private encryptionUtil: EncryptionUtil,
    private oauthUtil: OAuthUtil,
  ) {}

  async getConnectionStatus(user: User): Promise<ConnectionStatusDto> {
    const connections = await this.metaConnectionRepository.find({
      where: { user: { id: user.id }, isActive: true },
    });

    const status: ConnectionStatusDto = {
      whatsapp: this.buildConnectionDto(Platform.WHATSAPP, connections),
      instagram: this.buildConnectionDto(Platform.INSTAGRAM, connections),
      messenger: this.buildConnectionDto(Platform.MESSENGER, connections),
    };

    return status;
  }

  private buildConnectionDto(platform: Platform, connections: MetaConnection[]): ConnectionDto {
    const connection = connections.find((c) => c.platform === platform);

    if (!connection) {
      return {
        platform,
        isConnected: false,
      };
    }

    return {
      platform,
      isConnected: true,
      accountName: connection.accountName,
      accountId: connection.accountId,
      phoneNumber: connection.phoneNumber,
      pageId: connection.pageId,
      connectedAt: connection.connectedAt.toISOString(),
    };
  }

  async initAuth(user: User, platform: Platform): Promise<{ authUrl: string; state: string }> {
    const state = this.oauthUtil.generateState();
    const authUrl = this.oauthUtil.buildAuthUrl(platform, state);

    return { authUrl, state };
  }

  async handleCallback(
    user: User,
    code: string,
    state: string,
    expectedState: string,
    platform: Platform,
  ): Promise<void> {
    // Validar state (CSRF protection)
    if (state !== expectedState) {
      throw new UnauthorizedException('Estado inválido');
    }

    // Intercambiar código por token
    const accessToken = await this.oauthUtil.exchangeCodeForToken(code);

    // Obtener información de la cuenta
    const accountInfo = await this.oauthUtil.getAccountInfo(accessToken, platform);

    // Encriptar token
    const encryptedToken = this.encryptionUtil.encrypt(accessToken);

    // Guardar o actualizar conexión
    let connection = await this.metaConnectionRepository.findOne({
      where: {
        user: { id: user.id },
        platform,
        accountId: accountInfo.accountId,
      },
    });

    if (connection) {
      // Actualizar existente
      connection.accessToken = encryptedToken;
      connection.accountName = accountInfo.accountName;
      connection.phoneNumber = accountInfo.phoneNumber;
      connection.phoneNumberId = accountInfo.phoneNumberId;
      connection.pageId = accountInfo.pageId;
      connection.instagramAccountId = accountInfo.instagramAccountId;
      connection.isActive = true;
      connection.updatedAt = new Date();
    } else {
      // Crear nueva
      connection = this.metaConnectionRepository.create({
        user,
        platform,
        accountId: accountInfo.accountId,
        accountName: accountInfo.accountName,
        accessToken: encryptedToken,
        phoneNumber: accountInfo.phoneNumber,
        phoneNumberId: accountInfo.phoneNumberId,
        pageId: accountInfo.pageId,
        instagramAccountId: accountInfo.instagramAccountId,
        isActive: true,
      });
    }

    await this.metaConnectionRepository.save(connection);
  }

  async disconnect(user: User, platform: Platform): Promise<void> {
    const connection = await this.metaConnectionRepository.findOne({
      where: {
        user: { id: user.id },
        platform,
        isActive: true,
      },
    });

    if (!connection) {
      throw new NotFoundException('Conexión no encontrada');
    }

    connection.isActive = false;
    await this.metaConnectionRepository.save(connection);
  }

  async getAccessToken(user: User, platform: Platform): Promise<string> {
    const connection = await this.metaConnectionRepository.findOne({
      where: {
        user: { id: user.id },
        platform,
        isActive: true,
      },
    });

    if (!connection) {
      throw new NotFoundException('Conexión no encontrada');
    }

    return this.encryptionUtil.decrypt(connection.accessToken);
  }
}
```

---

## 6. Controller

```typescript
// src/meta/meta.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  Session,
} from '@nestjs/common';
import { Response } from 'express';
import { MetaService } from './meta.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Platform } from './entities/meta-connection.entity';
import { InitAuthDto } from './dto/init-auth.dto';

@Controller('meta')
@UseGuards(JwtAuthGuard)
export class MetaController {
  constructor(private readonly metaService: MetaService) {}

  @Get('connections/status')
  async getStatus(@CurrentUser() user: User) {
    return this.metaService.getConnectionStatus(user);
  }

  @Post('auth/init')
  async initAuth(
    @CurrentUser() user: User,
    @Body() initAuthDto: InitAuthDto,
    @Session() session: Record<string, any>,
  ) {
    const { authUrl, state } = await this.metaService.initAuth(user, initAuthDto.platform);
    
    // Guardar state en sesión
    session[`oauth_state_${initAuthDto.platform}`] = state;
    
    return { authUrl };
  }

  @Get('auth/callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Session() session: Record<string, any>,
    @Res() res: Response,
  ) {
    // Si hay error de Meta
    if (error) {
      return res.send(this.buildErrorHtml(error));
    }

    try {
      // Determinar plataforma del state (simplificado, en producción usa un formato mejor)
      const platform = this.determinePlatformFromState(state, session);
      const expectedState = session[`oauth_state_${platform}`];

      if (!expectedState) {
        throw new Error('Estado no encontrado en sesión');
      }

      // Obtener usuario de la sesión (o del state si lo codificaste ahí)
      const user = session.user; // Ajustar según tu implementación de sesión

      await this.metaService.handleCallback(user, code, state, expectedState, platform as Platform);

      // Limpiar state de sesión
      delete session[`oauth_state_${platform}`];

      // Renderizar HTML de éxito
      return res.send(this.buildSuccessHtml(platform));
    } catch (err) {
      return res.send(this.buildErrorHtml(err.message));
    }
  }

  @Delete('connections/:platform')
  async disconnect(@CurrentUser() user: User, @Param('platform') platform: Platform) {
    await this.metaService.disconnect(user, platform);
    return {};
  }

  private determinePlatformFromState(state: string, session: Record<string, any>): string {
    // Buscar en sesión qué plataforma tiene este state
    for (const platform of ['whatsapp', 'instagram', 'messenger']) {
      if (session[`oauth_state_${platform}`] === state) {
        return platform;
      }
    }
    throw new Error('Plataforma no encontrada para este state');
  }

  private buildSuccessHtml(platform: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Autenticación exitosa</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f3f4f6;
          }
          .container {
            text-align: center;
            background: white;
            padding: 2rem;
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .success {
            color: #10b981;
            font-size: 3rem;
            margin-bottom: 1rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success">✓</div>
          <h1>Autenticación exitosa</h1>
          <p>Esta ventana se cerrará automáticamente...</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({
              type: 'META_OAUTH_SUCCESS',
              platform: '${platform}'
            }, window.location.origin);
          }
          setTimeout(() => window.close(), 2000);
        </script>
      </body>
      </html>
    `;
  }

  private buildErrorHtml(errorMessage: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error de autenticación</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f3f4f6;
          }
          .container {
            text-align: center;
            background: white;
            padding: 2rem;
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .error {
            color: #ef4444;
            font-size: 3rem;
            margin-bottom: 1rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="error">✗</div>
          <h1>Error de autenticación</h1>
          <p>${errorMessage}</p>
          <p>Esta ventana se cerrará automáticamente...</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({
              type: 'META_OAUTH_ERROR',
              error: '${errorMessage}'
            }, window.location.origin);
          }
          setTimeout(() => window.close(), 3000);
        </script>
      </body>
      </html>
    `;
  }
}
```

---

## 7. Module

```typescript
// src/meta/meta.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetaController } from './meta.controller';
import { MetaService } from './meta.service';
import { MetaConnection } from './entities/meta-connection.entity';
import { EncryptionUtil } from './utils/encryption.util';
import { OAuthUtil } from './utils/oauth.util';

@Module({
  imports: [TypeOrmModule.forFeature([MetaConnection])],
  controllers: [MetaController],
  providers: [MetaService, EncryptionUtil, OAuthUtil],
  exports: [MetaService],
})
export class MetaModule {}
```

---

## 8. Variables de Entorno

```env
# .env
META_APP_ID=tu_app_id_de_meta
META_APP_SECRET=tu_app_secret_de_meta
META_REDIRECT_URI=https://tu-backend.com/meta/auth/callback
META_API_VERSION=v18.0

# Generar con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=64_caracteres_hexadecimales_aqui
```

---

## 9. Generar ENCRYPTION_KEY

```bash
# Ejecutar en terminal para generar clave de 32 bytes (64 hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## ✅ Checklist de Implementación

- [ ] Crear Entity MetaConnection
- [ ] Crear DTOs
- [ ] Implementar EncryptionUtil
- [ ] Implementar OAuthUtil
- [ ] Implementar MetaService
- [ ] Implementar MetaController
- [ ] Crear MetaModule
- [ ] Agregar variables de entorno
- [ ] Generar y configurar ENCRYPTION_KEY
- [ ] Configurar sesiones (express-session)
- [ ] Testing del flujo completo

---

**Nota**: Este código es una base sólida. Ajusta según tu arquitectura específica (guards, decorators, manejo de sesiones, etc.).

