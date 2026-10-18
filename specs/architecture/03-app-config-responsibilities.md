# Spec: límites del servicio de configuración

## Problema

`AppConfigService` combina la escucha/consulta de la configuración global y la escritura de docentes y catálogo. Varias funciones leen esos datos; la pantalla de configuración los edita.

## Objetivo

Definir una separación entre lectura compartida y edición propia de la función de configuración antes de migrar el servicio. Por ahora, `AppConfigService` permanece en `shared`.

## Consumidores observados

La pantalla de configuración guarda docentes y catálogo. Dashboard, clases y planificación leen docentes o títulos del catálogo.

## Decisiones pendientes para el diseño

- Qué API de lectura debe exponer `shared`.
- Qué operaciones de escritura pertenecen a la feature de configuración.
- Cómo manejar estado de carga/error y actualización en tiempo real.
- Si se conserva un solo acceso a Firestore detrás de ambas APIs.

## Criterios de aceptación

El diseño mantiene las lecturas de todas las funciones y la edición actual; las dependencias y APIs propuestas quedan documentadas antes de implementar.

## Diseño propuesto

> Estado: resuelve las decisiones pendientes. **No implica cambios de código todavía**; la migración se implementa por fases (§7) una vez aprobado.

### 1. Separación de responsabilidades: dos servicios

| Responsabilidad | Servicio | Ubicación |
|---|---|---|
| Lectura en tiempo real del documento `config/global`, estado y derivaciones | `AppConfigService` | `src/app/shared/app-config.service.ts` |
| Escritura de docentes y catálogo | `AppConfigEditorService` | `src/app/features/configuracion/app-config-editor.service.ts` |

- `AppConfigService` queda **de solo lectura**: elimina `saveTeachers`, `saveLessonCatalog` y `savePartialConfig`.
- `AppConfigEditorService` es la **única** responsable de escribir docentes/catálogo; no abre listeners propios.
- Dirección de dependencia: `features/configuracion` → `shared` → `core` (`FirebaseService`). `shared` no conoce `features` (sin ciclos).

### 2. API de lectura (`AppConfigService`, en `shared`)

Conserva la API de lectura actual y añade dos consultas para centralizar búsquedas repetidas:

```ts
readonly config: Signal<AppConfig | null>;
readonly isLoading: Signal<boolean>;
readonly error: Signal<string | null>;

readonly activeTeachers: Signal<Teacher[]>;
readonly lessonCatalog: Signal<LessonCatalogUnit[]>;

getLessonTitle(unitId: string, lessonId: string): string | null;
getTeacherById(teacherId: string): Teacher | null;   // nuevo (opcional)
getTeacherName(teacherId: string): string | null;    // nuevo (opcional)

refresh(): Promise<void>; // recarga manual de lectura (getDoc)
```

`getTeacherById`/`getTeacherName` reemplazan el patrón repetido `.activeTeachers().find(t => t.id === id)?.name` en `dashboard-schedule` y `dashboard-indicators`. Es opcional y no altera comportamiento.

### 3. API de edición (`AppConfigEditorService`, feature de configuración)

```ts
readonly isSaving: Signal<boolean>;       // estado propio de la feature
readonly saveError: Signal<string | null>;

saveTeachers(teachers: Teacher[]): Promise<void>;
saveLessonCatalog(catalog: LessonCatalogUnit[]): Promise<void>;
```

- `savePartialConfig` (privado) se traslada tal cual: `setDoc(ref, { id: 'global', churchName: readService.config()?.churchName || 'Libreta IBCE', updatedAt: Timestamp.now(), ...partial }, { merge: true })`.
- Tras guardar, el listener del servicio compartido actualiza el estado; la feature no duplica la asignación de estado.
- Los errores de escritura viven en `saveError`, separados de `error` (que describe la lectura).

### 4. Carga, error y tiempo real

- El listener `onSnapshot` y `refresh()` permanecen en `shared`; `isLoading`/`error` describen solo la lectura. Los consumidores actuales (`configuracion`, `class-list`) no cambian su lectura de esos signals.
- Un fallo al guardar deja de contaminar `error` de lectura, evitando que dashboard/clases muestren un error de lectura por un guardado fallido.

### 5. Acceso a Firestore (decisión)

- Un único cliente (`FirebaseService`, singleton) y **una sola suscripción** al documento `config/global`, propiedad de `shared`.
- La feature escribe directamente con `FirebaseService.db` a la misma ruta `config/global`, sin abrir listener.
- Alternativa descartada: exponer `applyPartial(partial)` en `shared`. Se descarta para no mezclar la semántica de escritura (docentes/catálogo) dentro del servicio de solo lectura.

### 6. Ubicación y nombres

- `src/app/shared/app-config.service.ts` → `AppConfigService`.
- `src/app/features/configuracion/app-config-editor.service.ts` → `AppConfigEditorService`.
- Los modelos permanecen en `src/app/core/models/app-config.model.ts`.
- Nota: hoy el archivo está en `src/app/services/app-config.service.ts`; el movimiento físico a `shared/` ocurre en la fase 1 (§7).

### 7. Plan de implementación (fases, cada una compila)

1. **Fase 1 (solo reubicación):** mover `app-config.service.ts` a `shared/` y actualizar imports. Sin cambios de API ni de comportamiento.
2. **Fase 2:** crear `AppConfigEditorService` y trasladar la escritura; dejar `AppConfigService` sin métodos de escritura.
3. **Fase 3:** `configuracion.ts` inyecta el editor para guardar y el servicio compartido para leer; actualizar pruebas.

### 8. Mapa de consumidores

| Consumidor | API usada | Servicio tras la separación |
|---|---|---|
| `configuracion` | `config`, `isLoading`, `error`, `saveTeachers`, `saveLessonCatalog` | lectura en `shared` + edición en la feature |
| `class-list` | `isLoading`, `error`, `activeTeachers`, `refresh` | `shared` |
| `dashboard-schedule` | `getLessonTitle`, `activeTeachers` | `shared` |
| `dashboard-indicators` | `activeTeachers` | `shared` |
| `planned-lesson-form` | `activeTeachers`, `lessonCatalog` | `shared` |
| `planned-lesson-list` | `getLessonTitle` | `shared` |

### 9. Fuera de alcance del diseño

- No cambia el esquema del documento `config/global` ni las reglas de Firestore.
- No mueve validaciones de UI (duplicados, campos vacíos) que hoy viven en `configuracion.ts`.
- No rediseña la pantalla ni cambia textos.
- `churchName`, `churchAddress`, `alerts` y `lastBackup` hoy no los lee ningún consumidor; se mantienen en `shared` sin cambios.

### 10. Criterios de aceptación de la implementación

- `shared` no expone operaciones de escritura de docentes/catálogo.
- La pantalla de configuración conserva guardado, mensajes y validaciones.
- Dashboard, clases y planificación conservan sus lecturas (docentes y título de lección).
- Un único listener a `config/global`.
- `npm run build` y `npm test`.
