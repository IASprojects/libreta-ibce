# Guía del repositorio

## Estructura

La aplicación usa Angular 21. El código inicia en `src/main.ts`; las rutas y los proveedores globales están en `src/app/app.routes.ts` y `src/app/app.config.ts`. El código vive bajo `src/app/core/` (infraestructura global), `src/app/shared/` (estado, utilidades y UI compartida) y `src/app/features/` (responsabilidades agrupadas por entidad). El componente raíz (`app.ts`, `app.html`, `app.css`) permanece en la raíz de `src/app/`. Los recursos estáticos están en `public/`; las especificaciones de producto y arquitectura van en `specs/`.

La organización acordada para la arquitectura es `core/` para infraestructura global, `shared/` para estado y utilidades compartidas, y `features/` para responsabilidades agrupadas por entidad. Los movimientos se harán gradualmente y cada movimiento tendrá su propio spec en `specs/` antes de implementarse.

## Idioma y nombres

Usa inglés en código: nombres de carpetas, archivos, clases, variables, métodos, tipos y servicios. Usa español para textos de interfaz y documentación del equipo.

Los componentes usan directorio y nombres de archivo en *kebab-case*, con sufijo `.component`: por ejemplo, `student-list.component.ts`, `.html`, `.css` y `.spec.ts`. La clase termina en `Component` y el selector empieza con `app-` (por ejemplo, `StudentListComponent` y `app-student-list`). Servicios usan `.service.ts`, guardias `.guard.ts`, modelos de dominio `.model.ts` y tipos locales `.types.ts`.

## Límites y dependencias acordados

- `core`: `FirebaseService` y `AuthService` (en `core/services/`) y el guardia de autenticación (en `core/guards/`). Los modelos de dominio compartidos viven en `core/models/`, porque también los importa `core/offline-data.model.ts`.
- `shared`: `UserService`, `DateService` y `AppConfigService` (acceso de solo lectura a configuración), y los componentes de UI reutilizables en `shared/ui/`.
- `features`, agrupadas por entidad: `students` (`StudentService` y pantallas), `attendance` (`AttendanceService`), `lesson-classes` (`LessonClassService` y pantallas), `planned-lessons` (`PlannedLessonService` y pantallas), `settings` (pantallas y `AppConfigEditorService`, que es quien escribe la configuración), `dashboard` (pantallas y el layout autenticado) y `auth` (login).

Documenta dependencias entre entidades. Actualmente, asistencia usa estudiantes; clases usa planificación; estudiantes usa clases; y autenticación usa Firebase y el estado de usuario. Las pantallas consumen los servicios de su entidad y los componentes de `shared/ui/` no dependen de `features/`. Evita crear dependencias circulares.

## Desarrollo y validación

Usa TypeScript estricto, dos espacios, comillas simples y ancho Prettier de 100 caracteres. `npm start` inicia el servidor local; `npm run build` compila; `npm test` ejecuta pruebas con Vitest. Coloca pruebas junto al código como `*.spec.ts` y actualízalas con cambios de comportamiento. No hay framework e2e configurado.

## Seguridad y cambios

No incluyas credenciales ni claves privadas. Para Firebase, consulta `src/FIREBASE-DOC/` y destaca cambios de reglas o configuración en la revisión. Los commits recientes usan prefijos Conventional Commits como `feat:` y `fix:`; los pull requests deben resumir el cambio y su validación.
