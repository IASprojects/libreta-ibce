# Movimiento: normalización de nombres de componentes

## Objetivo

Aplicar gradualmente la convención de componentes de `AGENTS.md`: directorios en kebab-case, archivos `.component.ts`, `.component.html`, `.component.css`, pruebas `.component.spec.ts`, clases con sufijo `Component` y selectores `app-`.

## Alcance

Componentes standalone de pantallas, funciones y UI compartida en `src/app/components/`. Un componente se mueve a `features/` si es exclusivo de una entidad; `shared/ui/` si sirve a varias funciones.

## Criterios de aceptación

- Se actualizan imports, referencias de templates, rutas, pruebas y configuración Angular que apunten a los nombres anteriores.
- No cambian comportamiento, estilos ni contenido de interfaz.
- Cada lote se mantiene pequeño y compila antes de continuar.
- `npm run build` y `npm test` pasan al cerrar el movimiento.

## Fuera de alcance

Rediseñar componentes o cambiar el sistema visual. Este spec no implica renombrar todos los componentes en un único lote.
