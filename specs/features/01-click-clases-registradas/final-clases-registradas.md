# Historia: Clases Registradas como acceso directo a Clases

## Contexto

En el dashboard existe una tarjeta resumen para **Clases Registradas**, que actualmente sirve como indicador informativo del sistema. Se desea que esta tarjeta también funcione como una entrada rápida hacia la sección de clases, sin cambiar la estructura general del dashboard ni afectar a los demás indicadores.

La idea es que el usuario pueda identificar visualmente que la tarjeta es interactiva y que, al hacer clic, llegue de forma directa a la página de clases.

## Objetivo funcional

Permitir que la tarjeta de **Clases Registradas** actúe como un acceso directo navegable hacia la página de clases dentro del dashboard.

## Descripción de la experiencia esperada

Cuando el usuario vea el dashboard, la tarjeta debe seguir mostrando la información habitual de manera normal. Sin embargo, al pasar el mouse sobre la tarjeta o al enfocarla desde teclado, debe aparecer una señal visual secundaria con el texto **"Ir a clases"** debajo del contenido principal.

Al hacer clic en cualquier parte de la tarjeta, el sistema debe navegar a la ruta de clases existente en el dashboard.

La interacción debe sentirse natural, rápida y consistente con el resto de la interfaz.

## Alcance

### Incluye

- Hacer clic en la tarjeta de **Clases Registradas** para navegar a la sección de clases.
- Mostrar el texto **"Ir a clases"** como refuerzo visual cuando exista interacción por mouse o teclado.
- Mantener intacta la distribución visual actual del dashboard.
- Respetar el comportamiento de los otros indicadores del dashboard.
- Asegurar que la interacción sea usable con teclado y comprensible para usuarios de dispositivos táctiles.

### No incluye

- Cambios en la lógica de conteo de clases registradas.
- Cambios en el origen de datos del dashboard.
- Rediseño completo de la tarjeta.
- Cambios en la navegación global del sistema fuera de este acceso directo.

## Reglas de comportamiento

- La tarjeta debe navegar a la ruta de clases al hacer clic.
- El texto **"Ir a clases"** debe aparecer solo como refuerzo visual y no desplazar el contenido de forma abrupta.
- La experiencia debe mantenerse estable en escritorio, tablet y móvil.
- La interacción no debe romper la navegación existente ni provocar efectos secundarios en otros indicadores.
- La tarjeta debe conservar un estado visible al recibir foco para usuarios que navegan con teclado.

## Criterios de aceptación

- Al hacer clic en la tarjeta, el usuario llega a la página de clases.
- Al pasar el mouse sobre la tarjeta, aparece el texto **"Ir a clases"**.
- Al enfocar la tarjeta con teclado, también aparece el texto **"Ir a clases"**.
- La tarjeta conserva su apariencia general y no altera el diseño del dashboard.
- La interacción funciona sin afectar el resto de indicadores.
- La solución mantiene una experiencia accesible y comprensible en dispositivos sin mouse.

## Consideraciones de diseño

- El indicador debe seguir pareciendo una tarjeta informativa, pero con señales claras de que es clicable.
- El estado hover/focus debe ser sutil y consistente con el sistema visual actual.
- La transición visual debe ser suave para evitar cambios bruscos en el layout.
- El texto secundario debe reforzar la intención de navegación sin competir con el dato principal.

## Criterios técnicos sugeridos

- Utilizar la ruta de clases ya existente en el dashboard.
- Evitar lógica duplicada o navegación paralela.
- Preservar el rendimiento del componente.
- Mantener compatibilidad con la estructura actual del dashboard.

## Resultado esperado

La tarjeta de **Clases Registradas** deja de ser solo un indicador y se convierte en un acceso rápido útil, claro y accesible hacia la sección de clases, sin afectar la experiencia general del dashboard.
