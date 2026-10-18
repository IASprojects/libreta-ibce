# Movimiento: entidad de lecciones planificadas

## Objetivo

Reubicar la responsabilidad de planificación en `src/app/features/planned-lessons/`.

## Alcance actual

- Servicio: `src/app/services/planned-lesson.service.ts`.
- Modelo: `src/app/core/models/planned-lesson.model.ts`.
- Pantalla y componentes: `src/app/components/planificador/`.

## Dependencias

`PlannedLessonService` usa Firebase y fechas. `LessonClassService` depende de él para crear clases desde lecciones planificadas. Planificador y dashboard consumen sus datos; formularios también leen configuración global.

## Criterios de aceptación

- Servicio, modelo y componentes exclusivos de planificación quedan bajo su feature.
- Se conserva la creación, edición, consulta, detección de conflictos y conversión a clase.
- Se documenta la dependencia hacia clases sin crear un ciclo.
- Se actualizan imports y pruebas; `npm run build` y `npm test` pasan.

## Fuera de alcance

Cambiar reglas de planificación o el esquema de Firestore.
