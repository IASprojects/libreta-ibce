---
description: "Usar cuando se solicite mejorar layout, compactar interfaz, modernizar UI, unificar shell, sidebar, topbar, headers o responsive en libreta-ibce. Incluye blueprint por fases y checklist de accesibilidad."
name: "Layout Modernization Blueprint"
---
# Blueprint de Layout: Compacto y Moderno (libreta-ibce)

## Objetivo

Aplicar una modernizacion gradual de interfaz sin romper flujos funcionales (asistencia, estudiantes, planificador, clases), preparando una base visual compacta, consistente y responsive.

## Alcance y limites

- Mantener logica de negocio y contratos de servicios.
- Priorizar cambios de estructura visual, espaciado, navegacion y jerarquia de contenido.
- No introducir cambios de persistencia sin alinear primero con `.github/data.persistance.json`.
- Cumplir accesibilidad WCAG AA y evitar regresiones de teclado/lectores.

## Arquitectura visual objetivo

1. App Shell unificado
- Sidebar colapsable (desktop) y drawer (mobile).
- Topbar global con titulo de modulo, acciones primarias y acceso de usuario.
- Contenedor de contenido consistente para todas las rutas hijas.

2. Paginas por modulo
- Header compacto reutilizable (sin heroes grandes repetidos).
- Barra de filtros compacta.
- Lista/grid de contenido con tarjetas consistentes.
- Estados unificados: carga, error, vacio.

3. Comportamiento responsive
- Desktop: sidebar visible con opcion colapsada.
- Tablet: sidebar compacta o drawer segun ancho.
- Mobile: topbar minima, contenido prioritario y accion primaria siempre visible.

## Fases de implementacion

### Fase 1: Shell unificado (alta prioridad)

Objetivo: centralizar navegacion y estructura global.

Archivos base sugeridos:
- `src/app/components/main/main.ts`
- `src/app/components/main/main.html`
- `src/app/components/main/main.css`
- `src/app/components/dashboard/dashboard-menu/dashboard-menu.ts`
- `src/app/components/dashboard/dashboard-menu/dashboard-menu.html`
- `src/app/components/dashboard/dashboard-menu/dashboard-menu.css`

Tareas:
- Crear estructura `app-shell` con regiones: sidebar, topbar, content.
- Eliminar dependencias de margenes por modulo para compensar sidebar.
- Soportar estados: `sidebarCollapsed`, `mobileMenuOpen`.
- Definir overlay y cierre por Escape para mobile.

Criterio de salida:
- Todas las rutas hijas se visualizan dentro del mismo shell.
- Navegacion consistente entre desktop y mobile.

### Fase 2: Compactacion de modulos (alta prioridad)

Objetivo: reducir altura de encabezados y mostrar mas contenido util en primer viewport.

Modulos:
- Dashboard.
- Estudiantes.
- Planificador.
- Clases.

Tareas:
- Reemplazar headers/hero altos por `module-header` compacto.
- Mover accion primaria al topbar en desktop cuando aplique.
- Conservar FAB solo donde aporte en mobile.
- Estandarizar altura de bloques de filtro y separaciones.

Criterio de salida:
- Reduccion visible del espacio vertical inicial.
- Mayor densidad de informacion sin perder legibilidad.

### Fase 3: Sistema visual compartido

Objetivo: consistencia visual entre modulos.

Archivo base sugerido:
- `src/styles.css`

Tareas:
- Definir tokens CSS globales:
  - spacing: 4, 8, 12, 16, 24, 32
  - radius: 8, 12, 16
  - sombras: suave y media
  - colores: superficie, borde, primario, exito, advertencia, error
- Uniformar tarjetas, botones, campos y estados.
- Reducir variedad de gradientes por modulo.

Criterio de salida:
- Una sola linea visual en toda la app.
- Menor duplicacion de CSS.

### Fase 4: Mobile-first fino

Objetivo: optimizar tareas frecuentes en telefono.

Tareas:
- Garantizar accion primaria siempre visible.
- Convertir filtros complejos a panel deslizable en mobile.
- Revisar ergonomia de formularios largos (scroll, CTA sticky si aplica).

Criterio de salida:
- Flujos clave operables con menos scroll y menos pasos.

## Componentes reutilizables sugeridos

1. `AppShellComponent`
- Responsabilidad: layout global.
- Estado UI: sidebar colapsada, drawer mobile.

2. `TopbarComponent`
- Responsabilidad: titulo de modulo, accion primaria, usuario.

3. `ModuleHeaderComponent`
- Responsabilidad: titulo, subtitulo breve, metricas compactas.

4. `FilterBarComponent`
- Responsabilidad: busqueda y filtros con disposicion responsiva.

## Checklist de accesibilidad (obligatorio)

- Contraste AA en textos, controles y badges.
- Focus visible en todos los elementos interactivos.
- `aria-label` y `aria-live` en busquedas/resultados dinamicos.
- Orden de tabulacion coherente (topbar -> filtros -> contenido).
- Drawer mobile:
  - cierre con Escape,
  - control de foco,
  - retorno de foco al boton disparador.

## Checklist tecnico por cambio

- Mantener componentes pequenos y enfocados.
- Evitar logica compleja en templates.
- No usar `ngClass`/`ngStyle`; usar bindings de `class`/`style`.
- Mantener estilos y templates externos con rutas relativas al componente.
- Verificar que no se rompa responsive en 360px, 768px y desktop.

## Validacion obligatoria

Despues de cambios de implementacion:

1. Ejecutar build:
```bash
ng build
```

2. Corregir errores relacionados antes de cerrar tarea.

3. Revisar visualmente:
- Dashboard.
- Estudiantes lista/formulario.
- Planificador.
- Clases/registro asistencia.

## Definicion de terminado (DoD)

- Shell unificado aplicado.
- Headers compactos en modulos principales.
- Navegacion desktop/mobile consistente.
- Estados de carga/error/vacio unificados.
- Accesibilidad base cumplida (WCAG AA).
- Build exitoso (`ng build`).
