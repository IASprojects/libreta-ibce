# Movimiento: entidad de asistencia

## Objetivo

Reubicar la responsabilidad de asistencias en `src/app/features/attendance/`.

## Alcance actual

- Servicio: `src/app/services/attendance.service.ts`.
- Modelo: `src/app/core/models/attendance.model.ts`.
- Tipos públicos definidos junto al servicio, como entradas de lote y resúmenes.

## Dependencias

`AttendanceService` usa Firebase, fechas y `StudentService`; componentes de clases y dashboard consumen asistencia. El servicio calcula resumen diario y estadísticas por período.

## Criterios de aceptación

- El servicio, modelo y tipos propios quedan bajo la feature de asistencia.
- Se documenta y conserva la dependencia hacia estudiantes; no se crea dependencia circular.
- Se actualizan imports y pruebas afectadas sin cambiar el registro ni los resúmenes.
- `npm run build` y `npm test` pasan.

## Fuera de alcance

Cambiar reglas de asistencia o el esquema de Firestore.
