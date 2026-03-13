# Reglas de TypeScript

## Regla Principal

**TODO el código debe estar completamente tipado. NO usar `any` excepto en casos excepcionales.**

## Reglas Estrictas

### ✅ SIEMPRE

1. **Tipar todos los parámetros de función**
2. **Tipar todos los valores de retorno de función**
3. **Tipar todos los estados de React** (`useState<Type>()`)
4. **Tipar todas las props de componentes**
5. **Tipar todas las respuestas de API**
6. **Tipar todos los objetos y arrays**
7. **Usar interfaces/types del proyecto** ubicadas en `/src/types`

### ❌ NUNCA

1. **NO usar `any`** - Excepto casos extremadamente justificados (librerías legacy sin tipos)
2. **NO dejar tipos implícitos** en funciones o parámetros
3. **NO usar `as any`** para "solucionar" problemas de tipos
4. **NO crear tipos duplicados** - Buscar primero en `/src/types`

## Ubicación de Tipos

### 1. Tipos Compartidos Globalmente

**Ubicación:** `/src/types/index.ts` o archivos específicos en `/src/types/`

Usar para:

- Modelos de datos del backend (User, Coach, Exercise, etc.)
- Tipos compartidos entre múltiples componentes/páginas
- Enums globales
- Tipos de utilidad globales

```typescript
// src/types/index.ts o src/types/user.ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export enum UserRole {
  ADMIN = 'admin',
  COACH = 'coach',
  CLIENT = 'client'
}
```

### 2. Tipos Locales de Componente/Hook

**Ubicación:** En el mismo archivo del componente o hook

Usar para:

- Props específicas del componente
- Estados internos del hook
- Tipos auxiliares que solo usa ese archivo

```typescript
// components/UserCard.tsx
interface UserCardProps {
  user: User; // User viene de /src/types
  onEdit: (userId: string) => void;
  showActions?: boolean;
}

export const UserCard = ({ user, onEdit, showActions = true }: UserCardProps) => {
  // ...
};
```

### 3. Tipos de Hook Personalizado

**Ubicación:** En el mismo archivo del hook

```typescript
// hooks/useUserManagement.ts
import { User } from '@/types';

interface UseUserManagementReturn {
  users: User[];
  loading: boolean;
  error: string | null;
  addUser: (userData: Omit<User, 'id'>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

export const useUserManagement = (): UseUserManagementReturn => {
  // ...
};
```

## Ejemplos

### ✅ CORRECTO

```typescript
// Estado tipado
const [users, setUsers] = useState<User[]>([]);
const [loading, setLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);

// Función tipada
const handleSubmit = async (data: LoginFormData): Promise<void> => {
  try {
    await apiClient.login(data);
  } catch (err) {
    console.error(err);
  }
};

// Props tipadas
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick: () => void;
  children: React.ReactNode;
}

export const Button = ({ variant, size = 'md', onClick, children }: ButtonProps) => {
  // ...
};

// API Response tipada
interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
}

const fetchUsers = async (): Promise<User[]> => {
  const response = await apiClient.getUsers();
  return response; // response ya viene tipado por el api-client
};
```

### ❌ INCORRECTO

```typescript
// ❌ Sin tipos
const [users, setUsers] = useState([]);
const [data, setData] = useState(null);

// ❌ any en parámetros
const handleSubmit = async (data: any) => {
  // ...
};

// ❌ Sin tipar retorno
const fetchData = async () => {
  return await fetch('/api/data');
};

// ❌ Props sin tipar
export const Button = ({ variant, onClick, children }) => {
  // ...
};

// ❌ Usando any innecesariamente
const processData = (data: any): any => {
  return data;
};
```

## Casos donde `any` podría ser aceptable

Solo usar `any` en casos excepcionales:

1. **Librerías sin tipos**

```typescript
// Si una librería externa no tiene tipos y no hay @types disponibles
import someLibrary from 'some-library-without-types';
const result: any = someLibrary.doSomething(); // Documentar por qué
```

2. **Tipos extremadamente dinámicos temporales**

```typescript
// TEMPORAL - TODO: Tipar correctamente cuando tengamos la estructura final
const tempConfig: any = loadDynamicConfig();
```

3. **Console.error con objetos desconocidos**

```typescript
catch (error: any) {
  console.error('Error:', error); // Solo para logging
  // Pero luego tipar apropiadamente
  const message = error instanceof Error ? error.message : 'Error desconocido';
}
```

## Tipos Utility Comunes

```typescript
// Omitir propiedades
type CreateUserData = Omit<User, 'id' | 'createdAt'>;

// Hacer propiedades opcionales
type PartialUser = Partial<User>;

// Hacer propiedades requeridas
type RequiredUser = Required<Partial<User>>;

// Seleccionar propiedades específicas
type UserPreview = Pick<User, 'id' | 'name' | 'email'>;

// Tipos de retorno de funciones
type LoginResult = ReturnType<typeof apiClient.login>;

// Tipos de parámetros de funciones
type LoginParams = Parameters<typeof apiClient.login>[0];
```

## API Client - Tipos de Respuesta

```typescript
// api-client.ts
interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
}

class ApiClient {
  async getUsers(): Promise<User[]> {
    return this.request<User[]>('GET', '/users');
  }

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    return this.request<User>('POST', '/users', userData);
  }

  private async request<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: string, body?: unknown): Promise<T> {
    // ...
  }
}
```

## Zod Schemas - Inferir Tipos

```typescript
// schemas/auth.schemas.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres')
});

// ✅ Inferir tipo del schema
export type LoginFormData = z.infer<typeof loginSchema>;

// NO crear el tipo manualmente
// ❌ export interface LoginFormData { ... }
```

## Checklist de TypeScript

Antes de considerar código completo, verificar:

- [ ] Todos los parámetros de función están tipados
- [ ] Todos los retornos de función están tipados
- [ ] Todos los estados tienen tipo explícito
- [ ] Todas las props están tipadas
- [ ] No hay `any` sin justificación
- [ ] Los tipos compartidos están en `/src/types`
- [ ] Los tipos locales están en el mismo archivo
- [ ] Se usan tipos existentes antes de crear nuevos
- [ ] Las respuestas de API están tipadas

## Configuración de tsconfig.json

Asegurar que estas opciones estén habilitadas:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

---

**Recuerda:** TypeScript está aquí para ayudarnos. Los tipos correctos previenen bugs, mejoran la experiencia de desarrollo con autocompletado, y hacen el código más mantenible.
