# Migración a TypeScript - Guía de Inicio

## 🎉 ¡Configuración Completada!

Tu proyecto ya está listo para comenzar a usar TypeScript. Aquí tienes todo lo que necesitas saber.

## 📁 Estructura Creada

```
src/
├── types/                      # ✨ NUEVO: Tipos de TypeScript
│   ├── models.ts              # Tipos de dominio (User, Coach, Workout, etc.)
│   ├── api.ts                 # Tipos de API (Request/Response)
│   ├── contexts.ts            # Tipos de React Contexts
│   └── index.ts               # Exportaciones centralizadas
│
└── utils/
    └── UtilFunctions.ts       # ✅ MIGRADO: Primer archivo en TypeScript
```

## 🚀 Comandos Disponibles

### Verificar tipos (sin compilar)

```bash
npx tsc --noEmit
```

### Ejecutar el proyecto (funciona con .js y .ts)

```bash
npm start
```

### Build de producción

```bash
npm run build
```

## 📖 Cómo Usar los Tipos

### Importar tipos en tus archivos

```typescript
// En cualquier archivo .ts o .tsx
import { Coach, Client, WorkoutTemplate } from '../types';
import { CreateWorkoutTemplateRequest } from '../types/api';
import { UserContextValue } from '../types/contexts';
```

### Ejemplo: Crear un componente con tipos

```typescript
// Antes (JS)
const CoachCard = ({ coach, onEdit }) => {
  return <div>{coach.name}</div>;
};

// Después (TS)
import { Coach } from '../types';

interface CoachCardProps {
  coach: Coach;
  onEdit: (id: number) => void;
}

const CoachCard = ({ coach, onEdit }: CoachCardProps) => {
  return <div>{coach.name}</div>;
};
```

### Ejemplo: Tipar servicios

```typescript
// Antes (JS)
export const fetchWorkouts = async (coachId) => {
  const response = await fetch(`/api/workouts/${coachId}`);
  return await response.json();
};

// Después (TS)
import { WorkoutTemplate } from '../types';

export const fetchWorkouts = async (coachId: number): Promise<WorkoutTemplate[]> => {
  const response = await fetch(`/api/workouts/${coachId}`);
  return await response.json();
};
```

### Ejemplo: Usar Zod con TypeScript

```typescript
import { z } from 'zod';

// Definir schema
export const createPlanSchema = z.object({
  planName: z.string().min(1, 'El nombre es requerido'),
  coachId: z.number(),
  groups: z.array(
    z.object({
      name: z.string().optional(),
      exercises: z.array(z.any())
    })
  )
});

// Extraer tipo desde el schema
export type CreatePlanFormData = z.infer<typeof createPlanSchema>;

// Usar en el componente
const onSubmit = (data: CreatePlanFormData) => {
  console.log(data.planName); // ✅ Autocompletado!
};
```

## 🎯 Estrategia de Migración

### Opción A: Migración Por Capas (Recomendada)

1. **Utils y Contextos** ← Empezar aquí
2. **Services** (API calls)
3. **Schemas** (Zod)
4. **Hooks personalizados**
5. **Componentes compartidos**
6. **Páginas**
7. **App principal**

### Opción B: Migración Por Features

Migrar todos los archivos relacionados a una funcionalidad específica:

- Feature "Crear Plan": CreatePlan.tsx + useCreatePlan.ts + workoutService.ts
- Feature "Estudiantes": ManageStudents.tsx + StudentDialog.tsx + usersService.ts
- Etc.

## 💡 Tips y Mejores Prácticas

### 1. Convivencia JS/TS

```typescript
// ✅ Los archivos .js PUEDEN importar desde .ts
import { formatDate } from './UtilFunctions'; // .ts

// ✅ Los archivos .ts PUEDEN importar desde .js
import { someFunction } from './oldFile'; // .js
```

### 2. Evitar `any`

```typescript
// ❌ Evitar
const handleData = (data: any) => { ... }

// ✅ Mejor
const handleData = (data: WorkoutTemplate) => { ... }

// ✅ Si realmente no sabes el tipo
const handleData = (data: unknown) => {
  if (typeof data === 'object' && data !== null) {
    // Ahora puedes usarlo
  }
}
```

### 3. Props opcionales

```typescript
interface ComponentProps {
  required: string;
  optional?: number; // ← El "?" indica que es opcional
}
```

### 4. Tipos de eventos

```typescript
// ❌ Evitar
const handleClick = (e: any) => { ... }

// ✅ Mejor
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => { ... }
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { ... }
```

### 5. Tipar useState

```typescript
// TypeScript infiere el tipo
const [count, setCount] = useState(0); // number

// Pero a veces necesitas ser explícito
const [user, setUser] = useState<Coach | null>(null);

// Con tipos complejos
const [workouts, setWorkouts] = useState<WorkoutTemplate[]>([]);
```

### 6. Tipar hooks personalizados

```typescript
interface UseWorkoutReturn {
  workouts: WorkoutTemplate[];
  loading: boolean;
  error: string | null;
  fetchWorkouts: () => Promise<void>;
}

export const useWorkouts = (coachId: number): UseWorkoutReturn => {
  // ... implementación
  return { workouts, loading, error, fetchWorkouts };
};
```

## 🔍 Debugging de Tipos

### Ver el tipo inferido

Pasa el mouse sobre una variable en VSCode para ver su tipo.

### Verificar errores

```bash
# Ver todos los errores de tipos
npx tsc --noEmit

# Ver errores de un archivo específico
npx tsc --noEmit src/pages/CreatePlan.tsx
```

## 📚 Recursos Útiles

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [TypeScript con Zod](https://zod.dev/?id=type-inference)

## ⚠️ Problemas Comunes

### Error: "Cannot find module"

```typescript
// ❌ Problema
import { formatDate } from './UtilFunctions.js';

// ✅ Solución: No uses extensión .js para archivos .ts
import { formatDate } from './UtilFunctions';
```

### Error: "Type 'X' is not assignable to type 'Y'"

```typescript
// El tipo no coincide, verifica:
// 1. ¿Tiene todas las propiedades requeridas?
// 2. ¿Los tipos de las propiedades son correctos?
// 3. ¿Necesitas hacer un cast?

const workout = data as WorkoutTemplate; // Cast explícito
```

### Error: "Object is possibly 'null'"

```typescript
// ❌ Problema
const name = user.name; // Error si user puede ser null

// ✅ Solución: Optional chaining
const name = user?.name;

// ✅ O verificación explícita
if (user) {
  const name = user.name;
}
```

## 🎊 Próximos Pasos

1. **Revisa** el archivo `MIGRATION_PLAN.md` para ver el plan completo
2. **Elige** qué archivos migrar a continuación (recomiendo los contextos)
3. **Migra** gradualmente, archivo por archivo
4. **Verifica** con `npx tsc --noEmit` después de cada migración
5. **Testea** que la app funcione correctamente

## 💪 ¿Estás Listo?

Tu proyecto ahora tiene:

- ✅ TypeScript configurado
- ✅ ~200 tipos definidos (User, Coach, Workout, etc.)
- ✅ Primer archivo migrado como ejemplo
- ✅ Documentación completa
- ✅ Plan de migración detallado

**¡Puedes comenzar a migrar archivos cuando quieras!**

---

## 📞 ¿Necesitas Ayuda?

Si encuentras problemas durante la migración:

1. Revisa esta guía
2. Consulta `MIGRATION_PLAN.md`
3. Verifica los ejemplos en `src/utils/UtilFunctions.ts`
4. Usa `npx tsc --noEmit` para ver errores detallados

