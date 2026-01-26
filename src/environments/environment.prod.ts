// Valores de configuración de Firebase para producción.
// IMPORTANTE:
// - Estas constantes deben ser definidas en tiempo de build/despliegue
//   (por ejemplo, mediante configuración del bundler, variables de entorno
//   inyectadas en el build o un script que genere un fichero no versionado).
// - No introducir aquí credenciales reales ni modificarlas directamente en el
//   código fuente versionado.

import { getFirebaseConfig } from './firebase-config.utils';

export const environment = {
  production: true,
  firebase: getFirebaseConfig(true)
};
