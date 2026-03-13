# Manejo de Errores de Validación en Formularios

## Regla Fundamental

**SIEMPRE mostrar los errores específicos de validación de Zod al usuario en un toast.**

## 🎯 Patrón Obligatorio

### 1. validateForm debe retornar `{ isValid, errors }`

```typescript
// ✅ CORRECTO
const validateForm = () => {
  try {
    mySchema.parse(formData);
    setErrors({});
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error.issues) {
      const newErrors = {};
      error.issues.forEach((issue) => {
        newErrors[issue.path[0]] = issue.message;
      });
      setErrors(newErrors);
      return { isValid: false, errors: newErrors };
    }
    return { isValid: false, errors: {} };
  }
};

// ❌ INCORRECTO - No retornar solo boolean
const validateForm = () => {
  try {
    mySchema.parse(formData);
    return true;
  } catch (error) {
    setErrors({...});
    return false; // ❌ No podemos acceder a los errores después
  }
};
```

### 2. handleSubmit debe mostrar errores en toast

```typescript
// ✅ CORRECTO
const handleSubmit = () => {
  const validation = validateForm();

  if (!validation.isValid) {
    // Convertir objeto de errores a mensaje legible
    const errorMessages = Object.values(validation.errors)
      .filter((msg) => msg) // Filtrar null/undefined
      .join('. ');

    // Mostrar toast con errores específicos
    showToast(
      'error',
      intl.formatMessage({ id: 'error' }),
      errorMessages || intl.formatMessage({ id: 'validation.error' })
    );
    return;
  }

  // Proceder con el submit...
};

// ❌ INCORRECTO - No mostrar errores
const handleSubmit = () => {
  if (!validateForm()) {
    return; // ❌ Usuario no sabe qué está mal
  }
  // ...
};

// ❌ INCORRECTO - Mensaje genérico
const handleSubmit = () => {
  if (!validateForm()) {
    showToast('error', 'Error', 'Hay errores en el formulario'); // ❌ No específico
    return;
  }
  // ...
};
```

## 📝 Ejemplo Completo

```typescript
// hooks/useStudentDialog.ts
import { useState } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { useIntl } from 'react-intl';
import { studentSchema } from '@/schemas/student.schemas';

interface FormData {
  name: string;
  email: string;
  age: number;
}

export const useStudentDialog = () => {
  const { showToast } = useToast();
  const intl = useIntl();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    age: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);

  // Validar formulario - Retorna { isValid, errors }
  const validateForm = () => {
    try {
      studentSchema.parse(formData);
      setErrors({});
      return { isValid: true, errors: {} };
    } catch (error) {
      if (error.issues) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          newErrors[issue.path[0]] = issue.message;
        });
        setErrors(newErrors);
        return { isValid: false, errors: newErrors };
      }
      return { isValid: false, errors: {} };
    }
  };

  // Manejar envío - Muestra errores específicos en toast
  const handleSubmit = async () => {
    const validation = validateForm();

    if (!validation.isValid) {
      // Convertir errores a mensaje legible
      const errorMessages = Object.values(validation.errors)
        .filter((msg) => msg)
        .join('. ');

      // Mostrar toast con errores específicos
      showToast(
        'error',
        intl.formatMessage({ id: 'error' }),
        errorMessages || intl.formatMessage({ id: 'validation.error' })
      );
      return;
    }

    try {
      setLoading(true);
      // Proceder con el submit
      await saveStudent(formData);
      showToast(
        'success',
        intl.formatMessage({ id: 'success' }),
        intl.formatMessage({ id: 'student.savedSuccessfully' })
      );
    } catch (error) {
      showToast('error', 'Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando se actualiza
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return {
    formData,
    errors,
    loading,
    updateField,
    handleSubmit,
    validateForm
  };
};
```

## 🎨 Experiencia de Usuario

### Cuando hay errores de validación:

1. ✅ **Los campos individuales** se marcan en rojo con sus errores
2. ✅ **Se muestra un toast** con todos los errores específicos:
   ```
   ❌ Error
   El nombre es requerido. Por favor ingresa un email válido. La edad debe ser mayor a 0
   ```

### Beneficios:

- ✅ Usuario ve **exactamente qué está mal**
- ✅ **No hay confusión** sobre qué corregir
- ✅ **Mensajes en español** y descriptivos
- ✅ **Consistencia** en toda la aplicación
- ✅ Mejor **experiencia de usuario**

## 🔄 Flujo Completo

1. Usuario llena el formulario
2. Usuario hace clic en "Guardar"
3. Se ejecuta `validateForm()` que retorna `{ isValid, errors }`
4. Si `!isValid`:
   - Se extraen todos los mensajes de error
   - Se unen con punto (`.`)
   - Se muestran en un toast de error
   - El formulario NO se envía
5. Si `isValid`:
   - Se procede con el submit
   - Se muestra toast de éxito

## ⚠️ Errores Comunes a Evitar

```typescript
// ❌ MAL: No capturar errores
const handleSubmit = () => {
  if (!validateForm()) return;
  // ...
};

// ❌ MAL: Usar variable errors del estado (puede estar desactualizada)
const handleSubmit = () => {
  validateForm();
  showToast('error', 'Error', Object.values(errors).join('. ')); // ❌ errors puede no estar actualizado
};

// ❌ MAL: validateForm retorna solo boolean
const validateForm = (): boolean => {
  // ...
  return false; // ❌ No podemos acceder a los errores
};

// ❌ MAL: Mensaje genérico sin especificar errores
showToast('error', 'Error', 'Por favor corrige los errores'); // ❌ No dice cuáles
```

## ✅ Checklist de Validación de Formularios

Al crear un nuevo formulario, verificar:

- [ ] ✅ Schema de Zod creado en `/src/schemas/`
- [ ] ✅ Tipo inferido del schema con `z.infer<typeof schema>`
- [ ] ✅ Estado `errors` definido como `Record<string, string>`
- [ ] ✅ `validateForm()` retorna `{ isValid: boolean, errors: Record<string, string> }`
- [ ] ✅ `handleSubmit()` captura el resultado de `validateForm()`
- [ ] ✅ Errores convertidos a string con `Object.values().join('. ')`
- [ ] ✅ Toast mostrado con errores específicos
- [ ] ✅ Mensajes de error en español
- [ ] ✅ Los errores individuales se muestran en cada campo

---

**Recuerda:** El objetivo es que el usuario **siempre sepa exactamente qué debe corregir** sin tener que adivinar.
