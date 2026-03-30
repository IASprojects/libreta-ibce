## Contexto del Proyecto

### **Justificación**
Somos un grupo de 6 profesores de escuela dominical de una iglesia en un pueblo. Atendemos a jóvenes de 12 a 15 años con los siguientes objetivos:
- Enseñar valores bíblicos y bases teológicas para fortalecer su fe
- Fomentar el impacto social positivo
- Atender a jóvenes en diversas condiciones sociales y con necesidades específicas

### **Descripción del Sistema**
Sistema de gestión gratuito para:
1. Control de asistencia diaria
2. Registro de información básica de estudiantes
3. Planificar clases formales mediante el planificador de clases.
4. Seguimiento de asistencia anual
5. Contacto de padres/encargados
6. Recordatorios de cumpleaños

## Requisitos Específicos

### **Funcionales**
- Registro rápido de asistencia al inicio de clase
- Incorporación inmediata de nuevos estudiantes
- Visualización responsive (PC, tablets, móviles)
- Historial de asistencia anual por estudiante
- Gestión de contactos de padres/encargados
- Alertas de cumpleaños
- Funciona con 1 solo usuario (profesor) los 6 maestro vamos a usar la misma cuenta

## Regla Fundamental de Datos (SOT)

- La Source of Truth (SOT) para modelos, enums, relaciones, índices y validaciones de datos es `.github/data.persistance.json`.
- Ante cada cambio funcional o técnico que afecte persistencia, primero validar y alinear con `.github/data.persistance.json`.
- No crear campos, colecciones, enums o relaciones fuera de lo definido en `.github/data.persistance.json` sin actualizar explícitamente ese archivo.
- Si existe conflicto entre código/documentación y el modelo de datos, prevalece `.github/data.persistance.json`.
- Toda propuesta de cambio de datos debe incluir el impacto en `.github/data.persistance.json` como parte obligatoria de la implementación.

You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.
- Do not write arrow functions in templates (they are not supported).

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

Switch to the spanish language for explain context and requirements:
## Contexto del Proyecto

### **Justificación**
Somos un grupo de 6 profesores de escuela dominical de una iglesia en un pueblo. Atendemos a jóvenes de 12 a 15 años con los siguientes objetivos:
- Enseñar valores bíblicos y bases teológicas para fortalecer su fe
- Fomentar el impacto social positivo
- Atender a jóvenes en diversas condiciones sociales y con necesidades específicas

### **Descripción del Sistema**
Sistema de gestión gratuito para:
1. Control de asistencia diaria
2. Registro de información básica de estudiantes
3. Seguimiento de asistencia anual
4. Contacto de padres/encargados
5. Recordatorios de cumpleaños

## Requisitos Específicos

### **Funcionales**
- Registro rápido de asistencia al inicio de clase
- Incorporación inmediata de nuevos estudiantes
- Visualización responsive (PC, tablets, móviles)
- Historial de asistencia anual por estudiante
- Gestión de contactos de padres/encargados
- Alertas de cumpleaños
- Funciona con 1 solo usuario (profesor) los 6 maestro vamos a usar la misma cuenta
