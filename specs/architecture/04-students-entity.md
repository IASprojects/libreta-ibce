# Movimiento: entidad de estudiantes

## Objetivo

Reubicar la responsabilidad de estudiantes en `src/app/features/students/`.

## Alcance actual

- Servicio: `src/app/services/student.service.ts`.
- Modelo: `src/app/core/models/student.model.ts`.
- Pantallas y componentes: `src/app/components/students/` y `student-card`.

## Dependencias

El servicio usa Firebase, fechas y clases. También calcula/actualiza estadísticas basadas en registros de asistencia. Asistencia, dashboard y otras pantallas consumen datos de estudiantes. Revisar estos cruces sin introducir dependencias circulares.

## Criterios de aceptación

- La entidad y sus componentes exclusivos quedan bajo la feature de estudiantes; los elementos compartidos permanecen en `shared`.
- Se actualizan imports, pruebas y rutas afectadas.
- No cambian las operaciones CRUD, normalización ni estadísticas visibles.
- `npm run build` y `npm test` pasan.

## Fuera de alcance

Rediseñar el esquema de Firestore o las reglas de seguridad.
