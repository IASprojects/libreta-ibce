# Movimiento: entidad de clases realizadas

## Objetivo

Reubicar la responsabilidad de clases impartidas en `src/app/features/lesson-classes/`.

## Alcance actual

- Servicio: `src/app/services/lesson-class.service.ts`.
- Modelo: `src/app/core/models/lesson-class.model.ts`.
- Pantalla y lista: `src/app/components/clases/`.

## Dependencias

`LessonClassService` usa Firebase, fechas y `PlannedLessonService`; consulta conteos de asistencia en Firestore. `StudentService` usa clases para estadísticas. La lista de clases consume asistencia, estudiantes, planificación, usuario, fechas y configuración.

## Criterios de aceptación

- Servicio, modelo y componentes exclusivos de clases quedan bajo su feature.
- Se preservan creación desde planificación, creación manual y registros de clase.
- Se documentan dependencias entre entidades y se evitan ciclos.
- Se actualizan imports y pruebas; `npm run build` y `npm test` pasan.

## Fuera de alcance

Rediseñar el flujo de asistencia o los datos persistidos.
