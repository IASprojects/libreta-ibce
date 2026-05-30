# 🔒 Configuración de Reglas de Seguridad de Firestore

## Problema: Timeout al guardar estudiantes

Si experimentas un **TimeoutError** al intentar guardar estudiantes, el problema más común es que las **reglas de seguridad de Firestore** están bloqueando las operaciones de escritura.

### ¿Por qué ocurre esto?

Según la [documentación oficial de Firebase](https://firebase.google.com/docs/firestore/security/get-started):

> "Por defecto, las reglas de Firestore **niegan todo acceso** hasta que las configures explícitamente."

Cuando Firestore bloquea una operación por reglas de seguridad, **no devuelve un error** - simplemente la operación nunca se completa, quedándose en estado pendiente indefinidamente hasta que dispare el timeout.

---

## 🔍 Diagnóstico Rápido

### 1. Verifica el estado actual en la consola del navegador

Al intentar guardar un estudiante, deberías ver:

```
🔐 Verificando autenticación antes de guardar...
Usuario actual: { uid: "...", email: "..." }
Auth UID: "abc123..."
```

Si ves `Usuario actual: null` → **No estás autenticado** (ve a solución B)  
Si ves el usuario correcto → **Problema de reglas de Firestore** (ve a solución A)

---

## ✅ Solución A: Configurar Reglas de Firestore

### Paso 1: Acceder a Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. En el menú izquierdo: **Firestore Database**
4. Pestaña: **Reglas** (Rules)

### Paso 2: Configurar las Reglas

#### 🧪 **Para Desarrollo/Pruebas** (temporal):

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // ⚠️ SOLO PARA DESARROLLO - Permite todo acceso
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **ADVERTENCIA**: Estas reglas permiten acceso completo. Solo úsalas para pruebas iniciales.

#### 🔒 **Para Producción** (recomendado):

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Colección de estudiantes
    match /students/{studentId} {
      // Solo usuarios autenticados pueden leer y escribir
      allow read, write: if request.auth != null;
    }

    // Colección de asistencias
    match /attendance/{attendanceId} {
      allow read, write: if request.auth != null;
    }

    // Colección de lecciones planificadas
    match /planned_lessons/{lessonId} {
      allow read, write: if request.auth != null;
    }

    // Colección de clases
    match /lesson_classes/{classId} {
      allow read, write: if request.auth != null;
    }

    // Configuración global
    match /config/{configId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### 🛡️ **Para Producción con Email Específico** (más seguro):

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Función helper para verificar email autorizado
    function isAuthorizedUser() {
      return request.auth != null &&
             request.auth.token.email == 'maestrosibce@gmail.com';
    }

    // Todas las colecciones requieren el email específico
    match /{document=**} {
      allow read, write: if isAuthorizedUser();
    }
  }
}
```

### Paso 3: Publicar las Reglas

1. Después de editar, clic en **Publicar** (Publish)
2. Confirma la publicación
3. Las reglas se aplican **inmediatamente**

---

## ✅ Solución B: Verificar Autenticación

### Si ves `Usuario actual: null` en la consola:

1. **Cierra sesión y vuelve a iniciar sesión**:
   - Clic en tu foto de perfil → Cerrar Sesión
   - Vuelve a iniciar sesión con Google

2. **Verifica que usas el email autorizado**:
   - El sistema solo permite: `maestrosibce@gmail.com` (o el configurado en `environment.ts`)
   - Si usas otro email, no podrás acceder

3. **Limpia la caché del navegador**:
   - F12 → Console → Escribe: `localStorage.clear()`
   - Recarga la página (F5)
   - Vuelve a iniciar sesión

---

## 🧪 Prueba Rápida

Después de configurar las reglas, intenta crear un estudiante:

1. **Debería guardar en menos de 5 segundos**
2. **Sin errores de timeout**
3. **Consola mostrará**: `✅ Estudiante creado con ID: abc123...`

---

## 📚 Referencias Oficiales

- [Firebase Security Rules - Get Started](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Security Rules - Writing Conditions](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [Firebase Auth - Secure Data](https://firebase.google.com/docs/firestore/security/rules-conditions#authentication)

---

## 🆘 Troubleshooting Adicional

### Error persiste después de configurar reglas:

1. **Verifica índices de Firestore**: Firebase Console → Firestore → Indexes
2. **Verifica que la colección existe**: Firestore → Data → Debe existir "students"
3. **Revisa la consola de Firebase**: Firebase Console → Firestore → Logs → Busca errores de seguridad
4. **Intenta crear la colección manualmente**:
   - Ve a Firestore → Data
   - Clic en "Iniciar colección"
   - ID de colección: `students`
   - Agrega un documento de prueba

### Logs adicionales para debugging:

Puedes verificar si las reglas están bloqueando en Firebase Console:

- Firebase Console → Firestore → **Reglas** → Pestaña **Logs**
- Busca entradas con `PERMISSION_DENIED`

### Verifica nombres exactos de colecciones (importante)

En esta app los nombres reales son:

- `students`
- `attendance`
- `planned_lessons`
- `lesson_classes`
- `config`

Si publicas reglas con nombres distintos (por ejemplo `lesson-classes` o `planned-lessons`), Firestore rechazará lecturas/escrituras con `Missing or insufficient permissions`.

---

## ⏱️ Tiempos Esperados

| Acción             | Tiempo esperado | Si excede...             |
| ------------------ | --------------- | ------------------------ |
| Guardar estudiante | 1-3 segundos    | Problema de reglas o red |
| Cargar lista       | 1-2 segundos    | Problema de índices      |
| Login con Google   | 2-5 segundos    | Problema de Auth         |

---

**Última actualización**: Abril 2026  
**Versión**: 1.1.0
