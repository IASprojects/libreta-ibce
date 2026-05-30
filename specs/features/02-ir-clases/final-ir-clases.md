# Historia Final: Acceso rápido a clases desde Dashboard

## Contexto

En el dashboard existen indicadores informativos. Se requiere que las tarjetas **Presentes Última Semana** y **Última Clase** también funcionen como accesos directos hacia la vista de clases, con comportamiento contextual según existan o no clases registradas.

## Objetivo

Permitir que ambas tarjetas naveguen a clases y:

- Si existe al menos una clase activa, abrir automáticamente la última clase en modo edición.
- Si no existen clases, abrir la vista de clases mostrando el formulario para crear una nueva.

## Requisitos funcionales

- Las tarjetas **Presentes Última Semana** y **Última Clase** deben ser clicables e interactuables.
- Al hacer clic en cualquiera de las dos tarjetas, la aplicación debe navegar a `/dashboard/clases`.
- Si hay clases activas, se debe pasar el identificador de la última clase para abrirla en modo edición.
- Si no hay clases activas, se debe activar el flujo de creación de clase.
- Debe mostrarse texto contextual en hover/foco:
  - **Ver clase** cuando exista última clase.
  - **Crear clase** cuando no existan clases.
- En móvil, al tocar la tarjeta debe mostrarse feedback visual (overlay/ripple breve) y ejecutar la navegación.
- No debe alterarse la distribución ni el comportamiento de otros indicadores del dashboard.

## Requisitos de accesibilidad

- Mantener foco visible claro.
- Soportar navegación por teclado con **Enter** y **Espacio**.
- Usar etiquetas ARIA descriptivas según el contexto.
- El texto contextual visual debe ser secundario y no generar ruido adicional en lector de pantalla.

## Regla de negocio para “última clase”

- La “última clase” se define como la clase con fecha más reciente entre aquellas con `active === true`.
- Si no hay coincidencias, se aplica fallback de creación de clase.

## Implementación técnica sugerida

1. En dashboard:
   - Convertir ambas tarjetas en enlaces con navegación a `/dashboard/clases`.

2. Navegación contextual:
   - Con clase disponible: usar query param `openClassId=<id>`.
   - Sin clase disponible: usar query param `createClass=true`.

3. En la vista de clases:
   - Si llega `openClassId`, buscar clase y abrirla en modo edición.
   - Si llega `createClass=true`, abrir el formulario de creación.
   - Limpiar query params después de procesarlos para evitar reaperturas involuntarias.

## Criterios de aceptación (QA)

- Al hacer clic en cualquiera de las dos tarjetas, se navega a `/dashboard/clases`.
- Con clases activas, se abre automáticamente la última clase en modo edición.
- Sin clases activas, se abre automáticamente el formulario de crear clase.
- El hint **Ver clase / Crear clase** aparece en hover/foco sin romper layout.
- Con teclado (Tab + Enter/Espacio) la interacción funciona correctamente.
- En móvil responde al tap con feedback visual y navegación.
- No se rompen estilos ni navegación de otros indicadores.

## Impacto de datos (SOT)

- Esta historia no requiere cambios de modelo de datos.
- No se agregan campos, enums, relaciones ni colecciones nuevas.

## Validación recomendada

- Prueba manual con clases activas: navegación + apertura en edición.
- Prueba manual sin clases activas: navegación + apertura de formulario de creación.
- Prueba de teclado: Tab, Enter y Espacio.
- Prueba móvil: tap con feedback visual y navegación correcta.
