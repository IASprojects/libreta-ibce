# Movimiento: servicios compartidos de usuario y fechas

## Objetivo

Reubicar `UserService` y `DateService` en `src/app/shared/`, pues contienen estado/utilidades usados por más de una función.

## Alcance actual

- `src/app/services/user.service.ts`
- `src/app/services/date.service.ts`
- Actualización de sus imports en componentes y servicios consumidores.

## Dependencias

`AuthService` escribe el estado de `UserService`. Estudiantes, clases, planificación y asistencia consumen utilidades de fecha. `DateService` actualmente mezcla cálculos generales con formato y texto en español; cualquier rediseño de localización requiere decisión aparte.

## Criterios de aceptación

- Los servicios quedan en `shared` y conservan sus APIs y comportamiento.
- Se actualizan imports y pruebas afectadas.
- `npm run build` y `npm test` pasan.

## Fuera de alcance

Cambiar el modelo de usuario, el flujo de autenticación o las reglas de fecha.
