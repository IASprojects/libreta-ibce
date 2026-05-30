# 🔥 ERROR: Firebase Auth Configuration Not Found

## ❌ **Problema**

El error `auth/configuration-not-found` indica que Firebase Auth no está configurado correctamente para tu aplicación.

## 🔧 **Solución: Configurar Firebase Console**

### **Paso 1: Ir a Firebase Console**

1. Ve a: [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto: **libreta-ibce**

### **Paso 2: Configurar Dominios Autorizados**

1. Ve a **Authentication** > **Settings**
2. Scroll down hasta **Authorized domains**
3. Agregar estos dominios:
   - `localhost`
   - `localhost:4201`
   - `127.0.0.1`

### **Paso 3: Habilitar Google Sign-In**

1. Ve a **Authentication** > **Sign-in method**
2. Click en **Google**
3. Toggle **Enable**
4. Configurar:
   - **Project support email**: Tu email
   - **Web SDK configuration** → Download `google-services.json` si es necesario

### **Paso 4: Verificar Configuración Web**

1. Ve a **Project Settings** (⚙️ ícono)
2. Scroll down hasta **Your apps**
3. Verifica que la **Web app** tenga:
   - ✅ Correct **Auth domain**: `libreta-ibce.firebaseapp.com`
   - ✅ Correct **API Key**: `AIzaSyC...`

## 🌐 **URLs que debes autorizar:**

- `http://localhost:4201`
- `http://localhost:4200`
- `http://127.0.0.1:4201`

## 🛠️ **Para testing local:**

Si el problema persiste, puedes usar **Firebase Auth Emulator** para desarrollo:

```bash
npm install -g firebase-tools
firebase login
firebase init emulators:auth
firebase emulators:start --only auth
```

## 📝 **Verificación final**

Después de los cambios:

1. Wait 5-10 minutes for propagation
2. Hard refresh browser (`Ctrl + Shift + R`)
3. Try authentication again

---

**🚨 IMPORTANTE**: Los cambios en Firebase Console pueden tomar hasta 10 minutos en aplicar.
