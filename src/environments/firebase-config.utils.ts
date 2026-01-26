/**
 * Utilidad para obtener y validar variables de configuración de Firebase
 * desde el entorno global en tiempo de ejecución.
 * 
 * Esta utilidad centraliza la lógica de acceso a variables de entorno
 * para evitar duplicación de código entre archivos de environment.
 */

// Declaración global tipada para las variables de entorno de Firebase
declare global {
  interface Window {
    NG_APP_FIREBASE_API_KEY?: string;
    NG_APP_FIREBASE_AUTH_DOMAIN?: string;
    NG_APP_FIREBASE_PROJECT_ID?: string;
    NG_APP_FIREBASE_STORAGE_BUCKET?: string;
    NG_APP_FIREBASE_MESSAGING_SENDER_ID?: string;
    NG_APP_FIREBASE_APP_ID?: string;
  }
}

type FirebaseEnvKey = keyof Pick<Window, 
  | 'NG_APP_FIREBASE_API_KEY'
  | 'NG_APP_FIREBASE_AUTH_DOMAIN' 
  | 'NG_APP_FIREBASE_PROJECT_ID'
  | 'NG_APP_FIREBASE_STORAGE_BUCKET'
  | 'NG_APP_FIREBASE_MESSAGING_SENDER_ID'
  | 'NG_APP_FIREBASE_APP_ID'
>;

/**
 * Obtiene y valida una variable de configuración de Firebase desde el entorno global.
 * 
 * @param key - Nombre de la variable de configuración de Firebase
 * @param isProduction - Indica si es entorno de producción para personalizar el mensaje de error
 * @returns El valor de la variable de configuración
 * @throws Error si la variable no existe, está vacía o no es una cadena válida
 */
export function getFirebaseEnvVariable(key: FirebaseEnvKey, isProduction = false): string {
  // Usar window tipado para acceder a las variables de entorno
  const value = typeof window !== 'undefined' ? window[key] : (globalThis as any)[key];

  // Validar que el valor existe y es una cadena no vacía
  if (typeof value !== 'string' || value.trim() === '') {
    const environmentType = isProduction ? 'producción' : 'desarrollo';
    const troubleshootingHint = isProduction 
      ? 'Revisa la configuración del build/despliegue.'
      : 'Asegúrate de que todas las variables de configuración de Firebase estén definidas.';

    throw new Error(
      `Configuración de Firebase inválida en entorno de ${environmentType}: ` +
      `la variable "${key}" no está definida o está vacía. ${troubleshootingHint}`
    );
  }

  return value;
}

/**
 * Obtiene toda la configuración de Firebase validando cada variable requerida.
 * 
 * @param isProduction - Indica si es entorno de producción
 * @returns Objeto con la configuración completa de Firebase
 */
export function getFirebaseConfig(isProduction = false) {
  return {
    apiKey: getFirebaseEnvVariable('NG_APP_FIREBASE_API_KEY', isProduction),
    authDomain: getFirebaseEnvVariable('NG_APP_FIREBASE_AUTH_DOMAIN', isProduction),
    projectId: getFirebaseEnvVariable('NG_APP_FIREBASE_PROJECT_ID', isProduction),
    storageBucket: getFirebaseEnvVariable('NG_APP_FIREBASE_STORAGE_BUCKET', isProduction),
    messagingSenderId: getFirebaseEnvVariable('NG_APP_FIREBASE_MESSAGING_SENDER_ID', isProduction),
    appId: getFirebaseEnvVariable('NG_APP_FIREBASE_APP_ID', isProduction)
  };
}