# 📋 Resumen de Implementación: Métodos RPE en Asignación de Sesiones

## 🎯 Objetivo
Agregar la capacidad de seleccionar un método de medición de carga subjetiva (RPE Method) cada vez que se asignan sesiones de entrenamiento a un cliente. El método RPE seleccionado se asocia automáticamente a cada training session cuando se asigna.

---

## 🔧 Cambios en el Frontend

### 1. **Hook Personalizado: `useRpeMethods`**
- **Ubicación**: `src/hooks/coach/useRpeMethods.ts`
- **Función**: 
  - Carga los métodos RPE del coach desde el endpoint `/workout/rpe/all`
  - Identifica automáticamente el método por defecto (donde `isDefault: true`)
  - Proporciona el listado completo y el método por defecto a los componentes

### 2. **Componentes Actualizados**

#### **AssignWorkoutDialog** (`src/components/dialogs/AssignWorkoutDialog.tsx`)
- **Uso**: Asignación directa de workouts a clientes desde la pestaña de Training Sessions
- **Cambios**:
  - Agregado dropdown para seleccionar método RPE
  - Selecciona automáticamente el método por defecto
  - Valida que se haya seleccionado un método antes de asignar

#### **CreateTrainingCycle** (`src/dialogs/CreateTrainingCycle.js`)
- **Uso**: Creación de ciclos de entrenamiento con asignación de workouts
- **Cambios**:
  - **Tab "Asignar Workouts"**:
    - Checkbox: "Usar el mismo método RPE para todas las sesiones"
    - Si está activo: Un solo selector global de RPE para todas las asignaciones
    - Si está desactivado: Selector individual de RPE por cada asignación (workout + día)
  - **Tab "Desde Plantilla"**:
    - Selector de método RPE para la plantilla completa
    - Se aplica a todas las sesiones del ciclo generado desde la plantilla

#### **AssignWorkoutToSessionDialog** (`src/dialogs/AssignWorkoutToSessionDialog.js`)
- **Uso**: Asignación de un workout a una sesión específica desde el calendario del cliente
- **Cambios**:
  - Agregado dropdown para seleccionar método RPE
  - Selecciona automáticamente el método por defecto
  - Valida que se haya seleccionado un método antes de asignar

---

## 📡 Endpoints que Necesitan Actualizarse en el Backend

### 1. **POST `/workout/assign-workout-to-client/:clientId`**
**Descripción**: Asignar uno o más workouts directamente a un cliente

**Payload Actualizado**:
```json
{
  "workoutIds": [1, 2, 3],
  "rpeMethodId": 5  // ⬅️ NUEVO: ID del método RPE seleccionado
}
```

**Comportamiento Esperado**:
- El `rpeMethodId` debe asociarse a cada training session que se crea al asignar los workouts
- Si no se envía `rpeMethodId`, usar el método RPE por defecto del coach

---

### 2. **POST `/workout/create-cycle-and-assign-workouts/:clientId`**
**Descripción**: Crear un ciclo de entrenamiento y asignar workouts en una sola operación

**Payload Actualizado**:
```json
{
  "clientId": 123,
  "createCycleDto": {
    "name": "Ciclo Enero",
    "coachId": 456,
    "startDate": "2024-01-01",
    "clientId": 123,
    "durationInMonths": 1,
    "durationInWeeks": null
  },
  "assignWorkoutsToCycleDTO": {
    "assignments": [
      {
        "workoutId": 1,
        "dayOfWeek": 1,
        "rpeMethodId": 5  // ⬅️ NUEVO: Puede ser diferente por cada asignación
      },
      {
        "workoutId": 2,
        "dayOfWeek": 3,
        "rpeMethodId": 5  // ⬅️ O el mismo para todas si se usa modo global
      }
    ]
  }
}
```

**Comportamiento Esperado**:
- Cada `assignment` puede tener su propio `rpeMethodId`
- Si `rpeMethodId` no está presente en un assignment, usar el método por defecto del coach
- El `rpeMethodId` debe asociarse a cada training session creada

---

### 3. **POST `/workout/assign-cycle-template-to-client`**
**Descripción**: Asignar una plantilla de ciclo de entrenamiento a un cliente

**Payload Actualizado**:
```json
{
  "cycleTemplateId": 10,
  "clientId": 123,
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "rpeMethodId": 5  // ⬅️ NUEVO: ID del método RPE seleccionado
}
```

**Comportamiento Esperado**:
- El `rpeMethodId` se aplica a todas las training sessions generadas desde la plantilla
- Si no se envía `rpeMethodId`, usar el método por defecto del coach

---

### 4. **POST `/workout/assign-session/:sessionId`**
**Descripción**: Asignar un workout a una sesión existente

**Payload Actualizado**:
```json
{
  "clientId": 123,
  "workoutId": 1,
  "sessionId": 456,
  "sessionMode": "presencial",
  "location": "Gimnasio Central",
  "contactMethod": null,
  "sessionTime": "10:00",
  "sessionDate": "2024-01-15",
  "notes": null,
  "rpeMethodId": 5  // ⬅️ NUEVO: ID del método RPE seleccionado
}
```

**Comportamiento Esperado**:
- El `rpeMethodId` debe asociarse a la training session actualizada
- Si no se envía `rpeMethodId`, usar el método por defecto del coach

---

### 5. **POST `/workout/assign-training-session-to-client`**
**Descripción**: Crear una nueva sesión y asignarle un workout

**Payload Actualizado**:
```json
{
  "clientId": 123,
  "workoutId": 1,
  "sessionId": null,
  "sessionMode": "virtual_sincronico",
  "location": null,
  "contactMethod": "zoom",
  "sessionTime": "14:00",
  "sessionDate": "2024-01-15",
  "notes": "https://zoom.us/j/123456",
  "rpeMethodId": 5  // ⬅️ NUEVO: ID del método RPE seleccionado
}
```

**Comportamiento Esperado**:
- El `rpeMethodId` debe asociarse a la training session recién creada
- Si no se envía `rpeMethodId`, usar el método por defecto del coach

---

## 🗄️ Cambios en la Base de Datos Esperados

### Tabla `TrainingSession` (o equivalente)
Se espera que tenga un campo para almacenar el `rpeMethodId`:

```sql
ALTER TABLE training_sessions 
ADD COLUMN rpe_method_id INT,
ADD FOREIGN KEY (rpe_method_id) REFERENCES rpe_methods(id);
```

O si ya existe una relación:
- Verificar que el campo `rpe_method_id` esté presente
- Asegurar que la foreign key esté correctamente configurada

---

## 🔄 Flujo de Datos

### Escenario 1: Asignación Directa de Workout
```
Usuario selecciona:
- Cliente: Juan
- Workouts: [Plan A, Plan B]
- RPE Method: RPE 1-10 (ID: 5)

Frontend envía:
POST /workout/assign-workout-to-client/123
{
  "workoutIds": [1, 2],
  "rpeMethodId": 5
}

Backend debe:
1. Crear training sessions para cada workout
2. Asociar rpeMethodId: 5 a cada training session
```

### Escenario 2: Creación de Ciclo con Múltiples Asignaciones
```
Usuario crea ciclo y asigna:
- Ciclo: "Enero 2024"
- Assignment 1: Workout A, Lunes, RPE 1-10 (ID: 5)
- Assignment 2: Workout B, Miércoles, RPE 1-10 (ID: 5)
- Assignment 3: Workout C, Viernes, RPE 6-20 (ID: 7)

Frontend envía:
POST /workout/create-cycle-and-assign-workouts/123
{
  "assignWorkoutsToCycleDTO": {
    "assignments": [
      { "workoutId": 1, "dayOfWeek": 1, "rpeMethodId": 5 },
      { "workoutId": 2, "dayOfWeek": 3, "rpeMethodId": 5 },
      { "workoutId": 3, "dayOfWeek": 5, "rpeMethodId": 7 }
    ]
  }
}

Backend debe:
1. Crear el ciclo
2. Crear training sessions para cada assignment
3. Asociar el rpeMethodId correspondiente a cada training session
```

### Escenario 3: Asignación desde Plantilla
```
Usuario selecciona:
- Plantilla: "Ciclo Hipertrofia 4 semanas"
- Fechas: 01/01/2024 - 31/01/2024
- RPE Method: RPE 1-10 (ID: 5)

Frontend envía:
POST /workout/assign-cycle-template-to-client
{
  "cycleTemplateId": 10,
  "clientId": 123,
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "rpeMethodId": 5
}

Backend debe:
1. Generar todas las training sessions desde la plantilla
2. Aplicar rpeMethodId: 5 a todas las training sessions generadas
```

---

## ✅ Validaciones que el Backend Debe Implementar

1. **Validar existencia del RPE Method**:
   - Verificar que el `rpeMethodId` enviado existe en la base de datos
   - Verificar que el método RPE pertenece al coach que está haciendo la asignación

2. **Método por Defecto**:
   - Si no se envía `rpeMethodId`, buscar el método RPE del coach donde `isDefault: true`
   - Si no existe método por defecto, retornar error o usar el primero disponible

3. **Consistencia**:
   - Asegurar que cada training session tenga un `rpeMethodId` asociado
   - No permitir training sessions sin método RPE

---

## 📝 Notas Importantes

1. **Compatibilidad hacia atrás**: 
   - El campo `rpeMethodId` es opcional en algunos endpoints para mantener compatibilidad
   - Si no se envía, el backend debe usar el método por defecto

2. **Múltiples asignaciones**:
   - En `create-cycle-and-assign-workouts`, cada assignment puede tener su propio `rpeMethodId`
   - Esto permite flexibilidad para usar diferentes métodos RPE en diferentes días del ciclo

3. **Plantillas**:
   - Cuando se asigna una plantilla, el `rpeMethodId` se aplica a TODAS las sesiones generadas
   - No se puede especificar un método diferente por sesión cuando se usa plantilla

---

## 🧪 Casos de Prueba Sugeridos

1. ✅ Asignar workout sin especificar RPE → Debe usar método por defecto
2. ✅ Asignar workout con RPE específico → Debe usar el método especificado
3. ✅ Crear ciclo con RPE global → Todas las sesiones deben tener el mismo RPE
4. ✅ Crear ciclo con RPE individual → Cada sesión debe tener su RPE correspondiente
5. ✅ Asignar plantilla con RPE → Todas las sesiones generadas deben tener el RPE especificado
6. ✅ Validar que el RPE Method pertenece al coach
7. ✅ Validar que el RPE Method existe en la base de datos

---

## 📞 Endpoints de Consulta (Ya Existentes)

Estos endpoints ya están implementados y funcionando:

- **GET `/workout/rpe/all`**: Obtiene todos los métodos RPE del coach
  - Retorna array con métodos RPE
  - Cada método tiene `isDefault: boolean` para identificar el por defecto

---

## 🎯 Resumen Ejecutivo

**¿Qué se implementó?**
- Selección de método RPE en todos los flujos de asignación de sesiones
- Selección automática del método por defecto
- Opción de usar el mismo método para todas las sesiones o uno diferente por sesión

**¿Qué necesita el backend?**
- Aceptar `rpeMethodId` en 5 endpoints de asignación
- Asociar el `rpeMethodId` a cada training session creada
- Validar que el método RPE existe y pertenece al coach
- Usar método por defecto si no se especifica

**¿Impacto?**
- Cada training session ahora tiene un método RPE asociado
- Permite tracking más preciso de la carga subjetiva de entrenamiento
- Mejora la personalización del entrenamiento por cliente

