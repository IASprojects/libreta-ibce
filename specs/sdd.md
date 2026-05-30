# SDD - Software Design Document

## 1. Propósito

- Definir la solución técnica y funcional del sistema de gestión de escuela dominical.
- Servir como referencia única para decisiones de arquitectura, datos, flujos y restricciones.
- Alinear la implementación con la Source of Truth (SOT) del modelo de datos.

## 2. Alcance

### 2.1 Incluye

- Control rápido de asistencia diaria.
- Registro y consulta de estudiantes.
- Historial anual de asistencia por estudiante.
- Gestión de contactos de padres/encargados.
- Recordatorios de cumpleaños.
- Planificación de clases y seguimiento de clases formales.

### 2.2 No incluye

- Autenticación multiusuario compleja.
- Flujos administrativos fuera del uso de un solo profesor.
- Funcionalidades que no estén definidas en la SOT o en requisitos aprobados.

## 3. Contexto del negocio

- La aplicación es usada por 6 maestros, pero todos comparten una sola cuenta.
- El objetivo principal es agilizar el registro de asistencia al inicio de clase.
- La interfaz debe funcionar bien en PC, tablet y móvil.
- El sistema debe ser simple para uso en una iglesia de contexto local.

## 4. Objetivos de diseño

- Priorizar rapidez de captura de datos.
- Minimizar pasos para registrar asistencia y nuevos estudiantes.
- Mantener consistencia visual y conceptual entre módulos.
- Garantizar accesibilidad y usabilidad en pantallas pequeñas.
- Respetar estrictamente el modelo de datos definido en `.github/data.persistance.json`.

## 5. Principios de arquitectura

- Angular standalone components.
- Estado local con signals cuando aplique.
- Servicios con responsabilidad única.
- Carga diferida de rutas por funcionalidad.
- Separación clara entre UI, lógica de negocio y acceso a datos.

## 6. Referencia de datos

### 6.1 Source of Truth

- Archivo maestro: `.github/data.persistance.json`
- Toda entidad, relación, enum, validación e índice debe venir de ahí.

### 6.2 Entidades principales

- Student
- Attendance
- PlannedLesson
- LessonClass
- Teacher
- AppConfig

### 6.3 Reglas de validación

- Documentar aquí solo validaciones que ya existan en la SOT.
- No proponer campos o relaciones fuera del modelo aprobado.

## 7. Mapa funcional

### 7.1 Dashboard

- Indicadores generales.
- Próximos eventos relevantes.
- Nacimientos y alertas.
- Resumen de novedades.

### 7.2 Estudiantes

- Alta rápida.
- Edición de datos básicos.
- Contactos de padres o encargados.
- Consulta de historial y estadísticas.

### 7.3 Asistencia

- Registro diario en pocos pasos.
- Edición o corrección de registros.
- Vista por clase y por estudiante.

### 7.4 Planificador

- Planificación de clases formales.
- Relación con unidades y lecciones cuando corresponda.
- Calendario visual y lista de clases planificadas.

### 7.5 Configuración

- Catálogos y parámetros de la app.
- Gestión de docentes y datos globales.
- Ajustes operativos de uso interno.

## 8. Flujos principales

### 8.1 Registrar asistencia

1. Abrir la clase o el día correspondiente.
2. Ver lista de estudiantes activos.
3. Marcar presentes, ausentes o casos especiales.
4. Guardar cambios.
5. Actualizar métricas e historial.

### 8.2 Dar de alta un estudiante

1. Abrir formulario rápido.
2. Capturar nombre y datos mínimos requeridos.
3. Agregar contactos si existen.
4. Guardar.
5. Refrescar listas y estadísticas visibles.

### 8.3 Planificar una clase

1. Elegir fecha.
2. Definir si la clase es formal o no formal.
3. Completar los campos permitidos por el tipo.
4. Asignar maestro.
5. Guardar y mostrar en calendario.

## 9. UI/UX

### 9.1 Reglas visuales

- Priorizar densidad de información sin perder legibilidad.
- Evitar navegación innecesaria.
- Mostrar acciones principales en lugares consistentes.
- Mantener jerarquía clara entre módulo, panel y contenido.

### 9.2 Responsividad

- PC: aprovechar ancho para tablas, paneles y resumen.
- Tablet: reducir densidad pero conservar acceso directo.
- Móvil: priorizar tarjetas, acciones rápidas y lectura vertical.

### 9.3 Accesibilidad

- Cumplir WCAG AA.
- Mantener foco visible.
- Usar etiquetas y descripciones accesibles.
- Evitar dependencias exclusivas de color para comunicar estado.

## 10. Componentes

### 10.1 Shell de aplicación

- Topbar.
- Menú o navegación principal.
- Área de contenido por módulo.

### 10.2 Componentes compartidos

- Headers de módulo.
- Barras de filtros.
- Banner de alertas.
- Tarjetas de datos.

### 10.3 Componentes por dominio

- Dashboard.
- Estudiantes.
- Asistencia.
- Planificador.
- Configuración.

## 11. Estado y comportamiento

- Definir qué estado vive en componente y qué estado vive en servicio.
- Evitar mutaciones directas de estructuras reactivas.
- Centralizar derivaciones reutilizadas.
- Mantener efectos secundarios aislados.

## 12. Persistencia y sincronización

- Indicar aquí cómo cada módulo lee y escribe en Firestore.
- Documentar manejo offline si aplica.
- Documentar reglas para datos activos/inactivos.
- No incluir comportamiento que contradiga la SOT.

## 13. Navegación

- Rutas públicas.
- Rutas protegidas.
- Flujo inicial de entrada.
- Redirecciones por autenticación o contexto de sesión.

## 14. Errores y validación

- Validaciones de formulario.
- Mensajes de error por operación fallida.
- Estado vacío.
- Estado de carga.
- Confirmaciones para acciones críticas.

## 15. Rendimiento

- Carga diferida de módulos.
- Minimizar trabajo en pantalla inicial.
- Reutilizar consultas y evitar redundancia.
- Limitar re-renderizados innecesarios.

## 16. Seguridad

- Acceso por una sola cuenta de uso compartido.
- Reglas de Firestore y autenticación alineadas al sistema.
- No exponer datos sensibles sin necesidad.

## 17. Pruebas

- Pruebas de componentes críticos.
- Pruebas de flujos de asistencia.
- Pruebas de formularios de estudiantes.
- Pruebas de validación de planificación.

## 18. Riesgos y decisiones abiertas

- Registrar aquí decisiones pendientes.
- Documentar impactos funcionales o técnicos.
- Anotar dependencias externas o restricciones operativas.

## 19. Historial de cambios

- Fecha: 30/05/2026
- Cambio: Fundacional.
- Motivo: Iniciar SSD.
- Responsable: Isacc.
