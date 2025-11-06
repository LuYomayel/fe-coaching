# 🎓 Ejemplos Prácticos de TypeScript para tu Proyecto

Esta guía contiene patrones reales que vas a usar en tu migración.

---

## 📚 Índice

1. [Componentes React](#1-componentes-react)
2. [Hooks Personalizados](#2-hooks-personalizados)
3. [Context API](#3-context-api)
4. [Servicios API](#4-servicios-api)
5. [Zod + TypeScript](#5-zod--typescript)
6. [Eventos y Handlers](#6-eventos-y-handlers)
7. [Props con children](#7-props-con-children)
8. [Tipos Condicionales](#8-tipos-condicionales)

---

## 1. Componentes React

### Componente Simple

```typescript
// ❌ Antes (JS)
const Button = ({ label, onClick, disabled }) => {
  return <button onClick={onClick} disabled={disabled}>{label}</button>;
};

// ✅ Después (TS)
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean; // Opcional
}

const Button: React.FC<ButtonProps> = ({ label, onClick, disabled = false }) => {
  return <button onClick={onClick} disabled={disabled}>{label}</button>;
};
```

### Componente con Tipos Importados

```typescript
import { Coach, Client } from '../types';

interface UserCardProps {
  user: Coach | Client;
  onEdit?: (id: number) => void;
  className?: string;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onEdit, className }) => {
  const isCoach = user.type === 'coach';

  return (
    <div className={className}>
      <h3>{user.name}</h3>
      {isCoach && <p>Coach</p>}
      {onEdit && <button onClick={() => onEdit(user.id)}>Editar</button>}
    </div>
  );
};
```

### Componente con Estado

```typescript
import { useState } from 'react';
import { WorkoutTemplate } from '../types';

export const WorkoutList: React.FC = () => {
  // TypeScript infiere el tipo
  const [workouts, setWorkouts] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkouts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/workouts');
      const data: WorkoutTemplate[] = await response.json();
      setWorkouts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return <div>{/* ... */}</div>;
};
```

---

## 2. Hooks Personalizados

### Hook Simple

```typescript
import { useState, useEffect } from 'react';
import { Coach } from '../types';

interface UseCoachReturn {
  coach: Coach | null;
  loading: boolean;
  error: string | null;
  refreshCoach: () => Promise<void>;
}

export const useCoach = (coachId: number): UseCoachReturn => {
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCoach = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/coaches/${coachId}`);
      const data: Coach = await response.json();
      setCoach(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCoach();
  }, [coachId]);

  return { coach, loading, error, refreshCoach };
};
```

### Hook Complejo (Como tu useNewCreatePlan)

```typescript
import { useState, useCallback } from 'react';
import { WorkoutTemplate, WorkoutGroup, Exercise } from '../types';

interface UseCreatePlanParams {
  coachId: number;
  planId?: number;
  isTemplate: boolean;
}

interface UseCreatePlanReturn {
  plan: WorkoutTemplate | null;
  groups: WorkoutGroup[];
  isLoading: boolean;
  isSaving: boolean;
  updatePlanName: (name: string) => void;
  addGroup: () => void;
  addExerciseToGroup: (groupId: number) => void;
  removeExerciseFromGroup: (groupId: number, exerciseId: number) => void;
  handleSavePlan: () => Promise<void>;
}

export const useCreatePlan = ({ coachId, planId, isTemplate }: UseCreatePlanParams): UseCreatePlanReturn => {
  const [plan, setPlan] = useState<WorkoutTemplate | null>(null);
  const [groups, setGroups] = useState<WorkoutGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const updatePlanName = useCallback((name: string) => {
    setPlan((prev) => (prev ? { ...prev, planName: name } : null));
  }, []);

  const addGroup = useCallback(() => {
    const newGroup: WorkoutGroup = {
      id: Date.now(),
      groupNumber: groups.length + 1,
      order: groups.length,
      exercises: []
    };
    setGroups((prev) => [...prev, newGroup]);
  }, [groups.length]);

  const addExerciseToGroup = useCallback((groupId: number) => {
    // Implementación...
  }, []);

  const removeExerciseFromGroup = useCallback((groupId: number, exerciseId: number) => {
    // Implementación...
  }, []);

  const handleSavePlan = async () => {
    setIsSaving(true);
    try {
      // Guardar plan...
    } finally {
      setIsSaving(false);
    }
  };

  return {
    plan,
    groups,
    isLoading,
    isSaving,
    updatePlanName,
    addGroup,
    addExerciseToGroup,
    removeExerciseFromGroup,
    handleSavePlan
  };
};
```

---

## 3. Context API

### Context Completo

```typescript
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Coach, Client } from '../types';

// 1. Definir tipos
type User = Coach | Client;

interface UserContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

// 2. Crear contexto con valor por defecto
const UserContext = createContext<UserContextValue | undefined>(undefined);

// 3. Provider
interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  );
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('token', data.token);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const updateUser = (data: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...data } : null);
  };

  const value: UserContextValue = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// 4. Hook personalizado
export const useUser = (): UserContextValue => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
```

---

## 4. Servicios API

### Servicio Tipado

```typescript
import { WorkoutTemplate, CreateWorkoutTemplateRequest } from '../types';
import { getAuthHeaders } from '../utils/UtilFunctions';

const API_URL = process.env.REACT_APP_API_URL;

// Función helper para manejar errores
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error en la petición');
  }
  return response.json();
};

export const workoutService = {
  // Obtener workout por ID
  fetchWorkoutTemplate: async (workoutId: number): Promise<WorkoutTemplate> => {
    const response = await fetch(`${API_URL}/workout/workout-template/id/${workoutId}`, { headers: getAuthHeaders() });
    return handleResponse<WorkoutTemplate>(response);
  },

  // Obtener todos los workouts de un coach
  findAllByCoachId: async (coachId: number): Promise<WorkoutTemplate[]> => {
    const response = await fetch(`${API_URL}/workout/workout-template/coachId/${coachId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<WorkoutTemplate[]>(response);
  },

  // Crear workout
  createWorkout: async (data: CreateWorkoutTemplateRequest): Promise<WorkoutTemplate> => {
    const response = await fetch(`${API_URL}/workout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<WorkoutTemplate>(response);
  },

  // Actualizar workout
  updateWorkout: async (workoutId: number, data: Partial<CreateWorkoutTemplateRequest>): Promise<WorkoutTemplate> => {
    const response = await fetch(`${API_URL}/workout/template/${workoutId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<WorkoutTemplate>(response);
  },

  // Eliminar workout
  deleteWorkout: async (workoutId: number): Promise<void> => {
    const response = await fetch(`${API_URL}/workout/${workoutId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    await handleResponse<void>(response);
  }
};
```

---

## 5. Zod + TypeScript

### Schema con Tipos Inferidos

```typescript
import { z } from 'zod';

// 1. Definir schema
export const createPlanSchema = z.object({
  planName: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  coachId: z.number(),
  groups: z.array(
    z.object({
      name: z.string().optional(),
      groupNumber: z.number(),
      order: z.number(),
      exercises: z.array(
        z.object({
          exerciseId: z.number().optional(),
          sets: z.string().optional(),
          repetitions: z.string().optional(),
          weight: z.string().optional(),
          duration: z.string().optional(),
          rest: z.string().optional(),
          notes: z.string().optional(),
          order: z.number()
        })
      )
    })
  )
});

// 2. Inferir tipo desde el schema
export type CreatePlanFormData = z.infer<typeof createPlanSchema>;

// 3. Usar en componente
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export const CreatePlanForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<CreatePlanFormData>({
    resolver: zodResolver(createPlanSchema)
  });

  const onSubmit = (data: CreatePlanFormData) => {
    console.log(data.planName); // ✅ Tipado automático!
    console.log(data.groups[0].exercises); // ✅ Autocompletado!
  };

  return <form onSubmit={handleSubmit(onSubmit)}>{/* ... */}</form>;
};
```

---

## 6. Eventos y Handlers

### Tipos de Eventos Comunes

```typescript
import React from 'react';

export const EventExamples: React.FC = () => {
  // Click en botón
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    console.log('Clicked!');
  };

  // Change en input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log(value);
  };

  // Submit de formulario
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Submitted!');
  };

  // Key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      console.log('Enter pressed!');
    }
  };

  // Focus/Blur
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    console.log('Focused!');
  };

  // Drag events
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('Drag started!');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
      />
      <button onClick={handleClick}>Click</button>
      <div draggable onDragStart={handleDragStart}>
        Drag me
      </div>
    </form>
  );
};
```

---

## 7. Props con children

### Diferentes Formas

```typescript
import React, { ReactNode } from 'react';

// Forma 1: ReactNode (más flexible)
interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({ children, className }) => {
  return <div className={className}>{children}</div>;
};

// Forma 2: React.PropsWithChildren
interface CardProps {
  title: string;
}

export const Card: React.FC<React.PropsWithChildren<CardProps>> = ({
  title,
  children
}) => {
  return (
    <div>
      <h3>{title}</h3>
      {children}
    </div>
  );
};

// Forma 3: Función render prop
interface RenderPropExampleProps {
  data: any[];
  renderItem: (item: any, index: number) => ReactNode;
}

export const RenderPropExample: React.FC<RenderPropExampleProps> = ({
  data,
  renderItem
}) => {
  return <div>{data.map((item, index) => renderItem(item, index))}</div>;
};
```

---

## 8. Tipos Condicionales

### Type Guards

```typescript
import { Coach, Client, User } from '../types';

// Type guard para Coach
function isCoach(user: User): user is Coach {
  return user.type === 'coach';
}

// Type guard para Client
function isClient(user: User): user is Client {
  return user.type === 'client';
}

// Uso
export const UserProfile: React.FC<{ user: User }> = ({ user }) => {
  if (isCoach(user)) {
    // Aquí TypeScript sabe que user es Coach
    return <div>{user.specialization}</div>;
  }

  if (isClient(user)) {
    // Aquí TypeScript sabe que user es Client
    return <div>Goal: {user.goal}</div>;
  }

  return null;
};
```

### Discriminated Unions

```typescript
type Status =
  | { type: 'loading' }
  | { type: 'success'; data: any }
  | { type: 'error'; error: string };

export const StatusDisplay: React.FC<{ status: Status }> = ({ status }) => {
  switch (status.type) {
    case 'loading':
      return <div>Loading...</div>;
    case 'success':
      return <div>Data: {status.data}</div>;
    case 'error':
      return <div>Error: {status.error}</div>;
  }
};
```

---

## 🎯 Resumen de Patrones Clave

1. **Siempre tipá props e interfaces**
2. **Usá `React.FC` para componentes funcionales**
3. **Aprovechá `z.infer<>` con Zod**
4. **Tipá los retornos de hooks personalizados**
5. **Usá type guards cuando tengas unions**
6. **Preferí tipos específicos sobre `any`**
7. **Aprovechá el autocompletado de VSCode**

---

¡Con estos ejemplos tenés todo lo que necesitás para migrar tu proyecto! 🚀

