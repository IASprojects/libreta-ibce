# Movimiento: infraestructura a `core`

## Objetivo

Agrupar la inicialización de Firebase y la autenticación en `src/app/core/` como infraestructura global.

## Alcance actual

- `src/app/services/firebase.service.ts`
- `src/app/services/auth.service.ts`
- `src/app/guards/auth.guard.ts`

## Dependencias

`AuthService` usa `FirebaseService`, `UserService` y el router. El guardia usa `AuthService` y `UserService`. Mantener `UserService` en `shared` según el acuerdo actual.

## Criterios de aceptación

- Los archivos quedan bajo `core` con nombres según `AGENTS.md`.
- Se actualizan imports, configuración y pruebas afectadas.
- Se conserva el flujo de inicio de sesión, autorización y redirección.
- `npm run build` y `npm test` pasan.

## Fuera de alcance

Cambiar proveedor de autenticación, política de autorización o flujo de navegación.
