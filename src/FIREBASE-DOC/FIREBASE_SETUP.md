# Firebase Deploy Setup - Libreta IBCE

## Configuración completada ✅

Este proyecto ya está configurado para deploy en Firebase Hosting.

## Pasos para completar la configuración:

### 1. Configurar tus credenciales Firebase

Edita los archivos de environment con tus valores reales de Firebase:

- `src/environments/environment.ts` (desarrollo)
- `src/environments/environment.prod.ts` (producción)

Reemplaza los siguientes valores con los de tu proyecto Firebase:

```typescript
{
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROJECT_ID.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROJECT_ID.appspot.com",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
}
```

### 2. Hacer login en Firebase

```bash
firebase login
```

### 3. Comandos disponibles:

#### Construir y deployar a Firebase:

```bash
npm run firebase:deploy
```

#### Servir localmente desde Firebase:

```bash
npm run firebase:serve
```

#### Solo construir para producción:

```bash
npm run build:prod
```

#### Deploy manual (después de build):

```bash
firebase deploy
```

## Archivos creados/configurados:

- `firebase.json` - Configuración de Firebase Hosting
- `.firebaserc` - Proyecto Firebase asociado
- `src/environments/` - Archivos de configuración de environment
- `src/app/services/firebase.service.ts` - Servicio base de Firebase
- Scripts en `package.json` para build y deploy
- Actualizado `.gitignore` para archivos de Firebase

## Servicios Firebase disponibles:

El `FirebaseService` incluye:

- **Firestore Database** (`this.db`)
- **Authentication** (`this.auth`)
- **Storage** (`this.storage`)

## Notas importantes:

- Los archivos de environment están en `.gitignore` por seguridad
- El directorio de output es `dist/libreta-ibce/browser` (Angular 21+)
- Configurado como Single Page Application (SPA)
- Build optimizado para producción
- URL de tu aplicación: https://libreta-ibce.web.app
