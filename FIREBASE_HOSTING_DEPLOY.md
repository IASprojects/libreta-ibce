# Firebase Hosting - Despliegue de Produccion

Esta guia usa la configuracion ya incluida en:
- `firebase.json`
- `.firebaserc`
- `.firebaseignore`
- `package.json` (scripts `firebase:*`)

## 1) Requisitos

- Node.js LTS recomendado (20 o 22).
- Cuenta y proyecto de Firebase con ID: `libreta-ibce`.

## 2) Instalacion (una sola vez)

Desde la raiz del proyecto (`libreta-ibce/libreta-ibce`):

```powershell
npm install
npm install -g firebase-tools
firebase --version
```

Si prefieres no instalar global:

```powershell
npx firebase-tools --version
```

## 3) Autenticacion y vinculacion

```powershell
firebase login
firebase use libreta-ibce
```

## 4) Validacion local de hosting

```powershell
npm run firebase:serve
```

Esto compila en modo produccion y levanta el emulador de Hosting.

## 5) Deploy a produccion

```powershell
npm run firebase:deploy
```

Notas:
- Solo despliega Hosting (`--only hosting`).
- `firebase.json` ejecuta `predeploy` para compilar automaticamente antes de publicar.

## 6) Preview channel (opcional)

```powershell
npm run firebase:preview
```

Para un canal con nombre personalizado:

```powershell
firebase hosting:channel:deploy staging
```

## 7) Comando rapido en CI/CD

```powershell
firebase deploy --only hosting --project libreta-ibce
```

En CI usa una cuenta de servicio (`GOOGLE_APPLICATION_CREDENTIALS`) o token de Firebase CLI.
