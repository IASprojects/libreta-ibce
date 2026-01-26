import { getFirebaseConfig } from './firebase-config.utils';

export const environment = {
  production: false,
  firebase: getFirebaseConfig(false)
};
