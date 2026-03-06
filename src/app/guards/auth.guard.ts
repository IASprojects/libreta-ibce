import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';

/**
 * Guard para proteger rutas que requieren autenticación
 */
export const authGuard: CanActivateFn = (route, state) => {
  const userService = inject(UserService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si la app aún no se ha inicializado, mostrar splash y bloquear navegación
  if (!authService.isInitialized()) {
    // Navegación será controlada por onAuthStateChanged cuando inicialice
    return new Promise(resolve => {
      const checkInit = () => {
        if (authService.isInitialized()) {
          resolve(userService.isLoggedIn() ? true : (router.navigate(['/login']), false));
        } else {
          setTimeout(checkInit, 100);
        }
      };
      checkInit();
    });
  }

  // Si el usuario está autenticado, permitir acceso
  if (userService.isLoggedIn()) {
    return true;
  }

  // Si no está autenticado, redirigir al login
  router.navigate(['/login']);
  return false;
};

/**
 * Guard para redirigir usuarios autenticados del login al dashboard
 */
export const loginRedirectGuard: CanActivateFn = (route, state) => {
  const userService = inject(UserService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si la app aún no se ha inicializado, esperar a que inicialice
  if (!authService.isInitialized()) {
    return new Promise(resolve => {
      const checkInit = () => {
        if (authService.isInitialized()) {
          resolve(userService.isLoggedIn() ? (router.navigate(['/dashboard']), false) : true);
        } else {
          setTimeout(checkInit, 100);
        }
      };
      checkInit();
    });
  }

  // Si el usuario ya está autenticado, redirigir al dashboard
  if (userService.isLoggedIn()) {
    router.navigate(['/dashboard']);
    return false;
  }

  // Si no está autenticado, permitir acceso al login
  return true;
};