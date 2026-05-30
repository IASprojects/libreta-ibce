# Firestore Composite Indexes Requeridos

Este documento lista los índices compuestos necesarios para que la aplicación funcione correctamente en Firestore.

## Índices Necesarios

### 1. Colección: `lesson_classes`

**Descripción**: Para obtener clases activas ordenadas por fecha (recientes)

**Fields**:

- `active` (Ascending)
- `date` (Descending)

**Query**:

```typescript
where('active', '==', true);
orderBy('date', 'desc');
limit(10);
```

**URL Firebase Console** (Click para crear automáticamente):

```
https://console.firebase.google.com/v1/r/project/libreta-ibce/firestore/indexes?create_composite=ClNwcm9qZWN0cy9saWJyZXRhLWliY2UvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2xlc3Nvbl9jbGFzc2VzL2luZGV4ZXMvXxABGgoKBmFjdGl2ZRABGggKBGRhdGUQAhoMCghfX25hbWVfXxAC
```

---

### 2. Colección: `attendance`

**Descripción**: Para obtener asistencias de una clase específica, excluyendo inactivas, ordenadas por fecha

**Fields**:

- `lessonClassId` (Ascending)
- `inactive` (Ascending)
- `registeredAt` (Descending)

**Query**:

```typescript
where('lessonClassId', '==', lessonClassId);
where('inactive', '!=', true);
orderBy('registeredAt', 'desc');
```

**URL Firebase Console** (Click para crear automáticamente):

```
https://console.firebase.google.com/v1/r/project/libreta-ibce/firestore/indexes?create_composite=Ck9wcm9qZWN0cy9saWJyZXRhLWliY2UvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2F0dGVuZGFuY2UvaW5kZXhlcy9fEAEaEQoNbGVzc29uQ2xhc3NJZBABGhAKDHJlZ2lzdGVyZWRBdBACGgwKCGluYWN0aXZlEAIaDAoIX19uYW1lX18QAg
```

---

## Pasos para Crear los Índices

### Opción 1: Crear Manualmente en Firebase Console

1. Ve a Firebase Console: https://console.firebase.google.com
2. Selecciona tu proyecto: **libreta-ibce**
3. En el menú lateral, ve a **Firestore Database** → **Indexes**
4. Haz clic en **Create Index**
5. Para cada índice:
   - Selecciona la colección
   - Agrega los campos con el orden especificado (Ascending/Descending)
   - Haz clic en **Create**

### Opción 2: Crear Automáticamente (Recomendado)

Simplemente haz clic en los URLs anteriores de Firebase Console. Firestore reconocerá los parámetros de índice y creará automáticamente.

---

## Estado Actual

- ❌ Índice `lesson_classes (active ASC, date DESC)`: **NO EXISTE** - Causando error en `initializeRecentListener()`
- ❌ Índice `attendance (lessonClassId ASC, inactive ASC, registeredAt DESC)`: **NO EXISTE** - Causando error en `getByLessonClass()`

---

## Alternativa: Simplificar Queries (Sin Índices)

Si prefieres evitar crear índices, puedes modificar las queries:

### Para `lesson_classes`:

```typescript
// ❌ Requiere índice
where('active', '==', true);
orderBy('date', 'desc');

// ✅ Sin índice (usa índice simple automático)
where('active', '==', true);
// Filtrar y ordenar en cliente
```

### Para `attendance`:

```typescript
// ❌ Requiere índice (inequality != con orderBy en otro campo)
where('lessonClassId', '==', lessonClassId);
where('inactive', '!=', true);
orderBy('registeredAt', 'desc');

// ✅ Sin índice
where('lessonClassId', '==', lessonClassId);
where('inactive', '==', false); // Cambiar != a ==
orderBy('registeredAt', 'desc');

// O incluso más simple:
where('lessonClassId', '==', lessonClassId);
// Filtrar inactive en cliente
```

---

## Referencias

- [Firestore Composite Indexes Documentation](https://cloud.google.com/firestore/docs/query-data/composite-indexes)
- [Multiple Range Fields Best Practices](https://cloud.google.com/firestore/docs/query-data/multiple-range-fields)
