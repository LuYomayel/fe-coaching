# Plan de Migración a TypeScript

## ✅ Fase 1: Setup Completado

- [x] Instalar TypeScript y tipos base
- [x] Configurar tsconfig.json
- [x] Crear estructura de tipos (`src/types/`)
- [x] Definir tipos principales:
  - `models.ts` - User, Coach, Client, Exercise, Workout, TrainingCycle, etc.
  - `api.ts` - Request/Response types para API
  - `contexts.ts` - Tipos para React Contexts
  - `index.ts` - Exportaciones centralizadas

## 📝 Fase 2: Migración de Archivos Core (En progreso)

### Utils (1/7 completados)

- [x] ✅ `UtilFunctions.ts` - Funciones de formateo, validación, auth
- [ ] `ThemeContext.js` → `ThemeContext.tsx`
- [ ] `ToastContext.js` → `ToastContext.tsx`
- [ ] `UserContext.js` → `UserContext.tsx`
- [ ] `ConfirmationDialogContext.js` → `ConfirmationDialogContext.tsx`
- [ ] `NotificationsContext.js` → `NotificationsContext.tsx`
- [ ] `ChatSideBarContext.js` → `ChatSideBarContext.tsx`

### Services (0/6 completados)

- [ ] `workoutService.js` → `workoutService.ts` (⚠️ Prioridad alta - 1064 líneas)
- [ ] `usersService.js` → `usersService.ts`
- [ ] `exercisesService.js` → `exercisesService.ts`
- [ ] `subscriptionService.js` → `subscriptionService.ts`
- [ ] `mercadoPagoService.js` → `mercadoPagoService.ts`
- [ ] `notificationsService.js` → `notificationsService.ts`

### Schemas (0/4 completados)

- [ ] `coachProfileFormSchema.js` → `coachProfileFormSchema.ts`
- [ ] `createPlanSchema.js` → `createPlanSchema.ts`
- [ ] `studentDialogSchema.js` → `studentDialogSchema.ts`
- [ ] `auth/*.js` → `auth/*.ts`

## 🎯 Fase 3: Hooks Personalizados (0/11 completados)

### Hooks principales

- [ ] `useNewCreatePlan.js` → `useNewCreatePlan.ts` (⚠️ 604 líneas)
- [ ] `useDragAndDrop.js` → `useDragAndDrop.ts` (201 líneas)
- [ ] `useCreatePlan.js` → `useCreatePlan.ts`
- [ ] `useCoachProfileForm.js` → `useCoachProfileForm.ts`
- [ ] `useHomePage.js` → `useHomePage.ts`

### Dialog Hooks

- [ ] `hooks/dialogs/useLoginDialog.js` → `.ts`
- [ ] `hooks/dialogs/useSetConfigDialog.js` → `.ts`
- [ ] `hooks/dialogs/useStudentDialog.js` → `.ts`
- [ ] Y otros hooks de dialogs...

## 🧩 Fase 4: Componentes (0/~40 completados)

### Componentes compartidos

- [ ] `Sidebar.js` → `Sidebar.tsx`
- [ ] `CustomInput.js` → `CustomInput.tsx`
- [ ] `LogoLoader.js` → `LogoLoader.tsx`
- [ ] `NewWorkoutTable.js` → `NewWorkoutTable.tsx` (⚠️ 2326 líneas!)
- [ ] `OfflineIndicator.js` → `OfflineIndicator.tsx`
- [ ] `PWAInstallButton.js` → `PWAInstallButton.tsx`
- [ ] `RpeDropdown.js` → `RpeDropdown.tsx`
- [ ] `DragDropContext.js` → `DragDropContext.tsx`
- [ ] Componentes en `components/home/`
- [ ] Componentes en `components/plan/`
- [ ] Componentes en `components/shared/`
- [ ] Componentes en `components/dialogs/`

### Dialogs (0/18 completados)

- [ ] `AssignPlanDialog.js` → `.tsx`
- [ ] `AssignSubscriptionDialog.js` → `.tsx`
- [ ] `AssignWorkoutToCycleDialog.js` → `.tsx`
- [ ] `AssignWorkoutToSessionDialog.js` → `.tsx`
- [ ] `BankDataDialog.js` → `.tsx`
- [ ] `CreateExerciseDialog.js` → `.tsx`
- [ ] `CreateTrainingCycle.js` → `.tsx`
- [ ] `FinishTrainingDialog.js` → `.tsx`
- [ ] `MediaDialog.js` → `.tsx`
- [ ] `NewPlanDetails.js` → `.tsx`
- [ ] `PaymentDialog.js` → `.tsx`
- [ ] `PlanDetails.js` → `.tsx`
- [ ] `RegisterPaymentDialog.js` → `.tsx`
- [ ] `SetConfigDialog.js` → `.tsx`
- [ ] `StudentDetailDialog.js` → `.tsx`
- [ ] `StudentDialog.js` → `.tsx`
- [ ] `VerificationCodeDialog.js` → `.tsx`
- [ ] `VideoDialog.js` → `.tsx`

## 📄 Fase 5: Páginas (0/14 completados)

- [ ] `CoachHome.js` → `CoachHome.tsx`
- [ ] `StudentHome.js` → `StudentHome.tsx`
- [ ] `CoachProfile.js` → `CoachProfile.tsx`
- [ ] `CoachProfileForm.js` → `CoachProfileForm.tsx`
- [ ] `ClientProfile.js` → `ClientProfile.tsx`
- [ ] `ClientDashboard.js` → `ClientDashboard.tsx`
- [ ] `ManageStudents.js` → `ManageStudents.tsx`
- [ ] `PlansPage.js` → `PlansPage.tsx`
- [ ] `CreatePlan.js` → `CreatePlan.tsx`
- [ ] `CreatePlanRefactored.js` → `CreatePlanRefactored.tsx`
- [ ] `NewCreatePlan.js` → `NewCreatePlan.tsx` (⚠️ 411 líneas)
- [ ] `StudentDetails.js` → `StudentDetails.tsx`
- [ ] `StudentCalendar.js` → `StudentCalendar.tsx`
- [ ] `TrainingPlanDetails.js` → `TrainingPlanDetails.tsx`
- [ ] `Settings.js` → `Settings.tsx`
- [ ] `SubscriptionPayment.js` → `SubscriptionPayment.tsx`

### Auth Pages

- [ ] `Home.js` → `Home.tsx`
- [ ] `VerifyEmail.js` → `VerifyEmail.tsx`
- [ ] `ForgotPassword.js` → `ForgotPassword.tsx`
- [ ] `ResetPassword.js` → `ResetPassword.tsx`
- [ ] `PrivateRoute.js` → `PrivateRoute.tsx`

## 🔧 Fase 6: App Principal

- [ ] `App.js` → `App.tsx`
- [ ] `index.js` → `index.tsx`

## 🎨 Fase 7: Refinamiento Final

- [ ] Eliminar `any` types donde sea posible
- [ ] Agregar tipos genéricos donde sea apropiado
- [ ] Validar que todos los props estén correctamente tipados
- [ ] Revisar y corregir errores de tipos estrictos
- [ ] Actualizar imports con extensiones correctas
- [ ] Testing de compilación final
- [ ] Code review de tipos

## 📊 Progreso General

**Total de archivos a migrar: ~100**
**Archivos migrados: 1**
**Progreso: 1%**

---

## 🚀 Próximos Pasos Inmediatos

1. ✅ **Setup TypeScript** - COMPLETADO
2. ✅ **Crear tipos base** - COMPLETADO
3. ✅ **Migrar primer archivo de ejemplo** - COMPLETADO
4. **Migrar Contextos** (7 archivos) - EN CURSO
5. **Migrar Servicios** (6 archivos)
6. **Migrar Schemas** (4 archivos)
7. **Migrar Hooks** (11+ archivos)
8. **Migrar Componentes** (~40 archivos)
9. **Migrar Páginas** (~17 archivos)
10. **App principal y refinamiento**

## 📝 Notas Importantes

- ✅ La configuración permite convivencia de `.js` y `.ts` (migración gradual)
- ✅ Los archivos `.js` pueden importar desde archivos `.ts`
- ⚠️ Archivos grandes que requerirán más tiempo:
  - `workoutService.js` (1064 líneas)
  - `NewWorkoutTable.js` (2326 líneas)
  - `useNewCreatePlan.js` (604 líneas)
- 💡 Se recomienda priorizar servicios y contextos antes que componentes UI

## 🔥 Ejemplo de Migración Completada

### UtilFunctions.js → UtilFunctions.ts

**Mejoras aplicadas:**

- ✅ Tipos explícitos en todas las funciones
- ✅ Interfaces para objetos complejos
- ✅ Tipos de retorno definidos
- ✅ Parámetros opcionales con `?`
- ✅ Tipos genéricos en `sortBySessionDate` y `updateStatus`
- ✅ Importación de tipos desde `react-intl`
- ✅ Uso de tipos desde `src/types/models.ts`

**Resultado:** 0 errores de TypeScript, mejora en autocompletado y seguridad de tipos.


