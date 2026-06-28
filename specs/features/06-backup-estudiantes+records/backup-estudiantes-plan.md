# Plan de Implementación: Backup de Estudiantes en CSV

**Spec de referencia:** `backup-estudiantes-final.wiki`  
**Fecha:** 2026-06-27

---

## Contexto técnico relevante

- Los stats (`totalAttendances`, `currentStreak`, `lastYearPercentage`, `lastAttendance`) ya están **denormalizados** en el documento `Student` — no se necesita consultar Firestore en tiempo de exportación.
- El **contacto principal** se obtiene filtrando `student.contacts` donde `isMain === true`.
- El patrón de confirmación existente en el proyecto es `window.confirm(...)` (ver `student-form.ts`). Se usará el mismo patrón para mantener consistencia.
- La lista de estudiantes activos ya está disponible como señal `activeStudents` en `StudentService`.
- No se requiere ninguna librería externa: se usa `Blob` + `URL.createObjectURL` + elemento `<a>` temporal.

---

## Archivos a modificar

| Archivo                                                      | Tipo de cambio                                               |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| `src/app/components/students/student-list/student-list.ts`   | Agregar método `downloadCsv()` y lógica de confirmación      |
| `src/app/components/students/student-list/student-list.html` | Agregar botón "Descargar" en la zona `module-header-side`    |
| `src/app/components/students/student-list/student-list.css`  | Estilos del botón de descarga (opcional, si requiere ajuste) |

**No se crean servicios nuevos.** La lógica de generación del CSV va directamente en el componente `StudentList`, ya que es una operación de una sola vista, sin reutilización.

---

## Paso 1 — Agregar método `downloadCsv()` en `student-list.ts`

### Lógica interna del método

```
downloadCsv():
  1. window.confirm("¿Confirma que desea descargar el archivo con los estudiantes?")
     → Si "NO" → salir sin hacer nada.
  2. Leer activeStudents() (señal ya disponible en el componente).
  3. Para cada Student:
       - nombre        = student.name
       - telefono      = student.phone ?? ''
       - encargado     = contacts.find(isMain)?.name ?? ''
       - tel_encargado = contacts.find(isMain)?.phone ?? ''
       - total_asist   = student.stats?.totalAttendances ?? 0
       - pct_año       = student.stats?.lastYearPercentage != null
                         ? student.stats.lastYearPercentage.toFixed(1) + '%'
                         : 'N/A'
       - ultima_clase  = student.lastAttendance ?? 'N/A'
       - racha         = student.stats?.currentStreak ?? 0
  4. Construir string CSV:
       - Encabezado: "Nombre;Teléfono;Encargado principal;Teléfono encargado;
                      Total clases asistidas;Porcentaje asistencia año actual;
                      Última clase asistida;Racha actual"
       - Una línea por estudiante, cada campo entre comillas dobles
         para manejar comas y caracteres especiales.
  5. Agregar BOM UTF-8 (\uFEFF) al inicio del string para compatibilidad
     con Excel en Windows.
  6. Crear Blob con type 'text/csv;charset=utf-8;'.
  7. Calcular nombre del archivo:
       - Usar DateService para obtener fecha/hora actual →
         "estudiantes-backup-YYYY-MM-DD-HH-mm-ss.csv"
  8. Crear elemento <a> temporal, asignar href=URL.createObjectURL(blob),
     download=nombreArchivo, hacer .click(), revocar URL.
```

### Notas de implementación

- **BOM UTF-8 obligatorio:** sin él, Excel en Windows interpreta tildes y ñ como caracteres corruptos.
- **Comillas en campos:** escapar comillas internas duplicándolas (`"` → `""`).
- **No usar `new Date()` en plantilla:** el método en TS puede usar `new Date()` directamente; la restricción aplica solo a templates.
- **DateService:** verificar si ya expone un método `formatForFilename()` o similar. Si no, construir el string de fecha localmente en el método con `Date` nativo.

---

## Paso 2 — Botón en la plantilla `student-list.html`

- Ubicación: dentro del contenido proyectado en `<app-module-header>` (slot `module-header-side`, que es el `<ng-content>` sin selector).
- Solo visible cuando **no** se están viendo inactivos (`!showInactives()`), ya que el backup es solo de activos.
- Accesibilidad: `type="button"`, `aria-label="Descargar lista de estudiantes en CSV"`.

```html
<!-- Dentro de <app-module-header ...> -->
@if (!showInactives()) {
<button
  type="button"
  class="download-btn"
  aria-label="Descargar lista de estudiantes en CSV"
  (click)="downloadCsv()"
>
  ⬇ Descargar
</button>
}
```

---

## Paso 3 — Estilos `student-list.css`

Agregar clase `.download-btn` con estilo consistente con los botones secundarios existentes en el proyecto (borde, padding, cursor pointer). Sin dependencia de librerías de UI externas.

---

## Criterios de aceptación (verificación manual)

- [ ] El botón "Descargar" aparece en la toolbar cuando se ven activos.
- [ ] El botón **no** aparece cuando el toggle "Ver Inactivos" está activo.
- [ ] Al hacer clic aparece `window.confirm` con el mensaje especificado.
- [ ] Al cancelar el confirm, no se descarga ningún archivo.
- [ ] Al confirmar, el navegador descarga un archivo `.csv`.
- [ ] El nombre del archivo sigue el patrón `estudiantes-backup-YYYY-MM-DD-HH-mm-ss.csv`.
- [ ] El archivo abre correctamente en Excel/LibreOffice con tildes y ñ visibles.
- [ ] La primera fila es el encabezado con los 8 campos.
- [ ] Cada fila contiene los datos correctos del estudiante activo.
- [ ] `ng build` sin errores tras la implementación.

---

## Orden de implementación

1. `student-list.ts` → agregar método `downloadCsv()`
2. `student-list.html` → agregar botón en el slot del header
3. `student-list.css` → agregar `.download-btn`
4. Ejecutar `ng build` y corregir errores si los hay
