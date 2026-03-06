import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { FirebaseService } from './firebase.service';
import { UserService, User } from './user.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private firebaseService = inject(FirebaseService);
  private userService = inject(UserService);
  private router = inject(Router);
  
  // Estados reactivos
  isLoading = signal(false);
  error = signal<string | null>(null);
  isInitialized = signal(false);
  
  // Email autorizado para los maestros
  private readonly AUTHORIZED_EMAIL = environment.sharedEmail || 'maestrosibce@gmail.com';
  
  constructor() {
    this.initAuthStateListener();
  }

  /**
   * Inicializar listener del estado de autenticación
   */
  private initAuthStateListener(): void {
    onAuthStateChanged(this.firebaseService.auth, (firebaseUser) => {
      console.log('🔄 Auth state changed:', firebaseUser?.email || 'No user');
      
      if (firebaseUser && this.isEmailAuthorized(firebaseUser.email)) {
        // Usuario autenticado y autorizado
        const user: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || 'Maestro',
          photoURL: firebaseUser.photoURL || ''
        };
        this.userService.setUser(user);
        console.log('✅ User authorized and logged in');
        
        // Navegar al dashboard si estamos en login
        if (this.router.url === '/login' || this.router.url === '/') {
          this.router.navigate(['/dashboard']);
        }
      } else if (firebaseUser && !this.isEmailAuthorized(firebaseUser.email)) {
        // Usuario autenticado pero no autorizado
        console.log('❌ User not authorized:', firebaseUser.email);
        this.handleUnauthorizedUser();
      } else {
        // No hay usuario autenticado
        console.log('👤 No user authenticated');
        this.userService.setUser(null);
        
        // Navegar al login si no estamos ya ahí
        if (this.router.url !== '/login') {
          this.router.navigate(['/login']);
        }
      }
      
      this.isInitialized.set(true);
    });
  }

  /**
   * Iniciar sesión con Google
   */
  async signInWithGoogle(): Promise<void> {
    try {
      this.isLoading.set(true);
      this.error.set(null);
      
      console.log('🔐 Starting Google sign in...');
      console.log('🌍 Current origin:', window.location.origin);
      console.log('🔥 Auth domain:', this.firebaseService.auth.config.authDomain);

      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      // Configurar para mostrar selector de cuenta siempre
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(this.firebaseService.auth, provider);
      
      if (!result.user?.email) {
        throw new Error('No se pudo obtener el email del usuario');
      }

      // Verificar email autorizado
      if (!this.isEmailAuthorized(result.user.email)) {
        await this.signOut();
        this.error.set('Acceso no autorizado. Usa la cuenta institucional: ' + this.AUTHORIZED_EMAIL);
        return;
      }

      // Usuario autorizado - el estado se maneja en onAuthStateChanged
      console.log('✅ Autenticación exitosa:', result.user.email);
      
    } catch (error: any) {
      console.error('❌ Error en autenticación:', error);
      console.error('📋 Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      if (error.code === 'auth/configuration-not-found') {
        this.error.set(`❌ CONFIGURACIÓN FIREBASE FALTANTE:\n\n` +
          `1. Ve a Firebase Console: https://console.firebase.google.com\n` +
          `2. Selecciona tu proyecto: libreta-ibce\n` +
          `3. Ve a Authentication > Settings > Authorized domains\n` + 
          `4. Agrega: localhost\n` +
          `5. Ve a Authentication > Sign-in method\n` +
          `6. Habilita "Google" como proveedor\n\n` +
          `Origen actual: ${window.location.origin}`);
      } else if (error.code === 'auth/popup-closed-by-user') {
        this.error.set('Autenticación cancelada por el usuario');
      } else if (error.code === 'auth/popup-blocked') {
        this.error.set('Popup bloqueado. Permite popups para este sitio');
      } else if (error.code === 'auth/network-request-failed') {
        this.error.set('Error de connectivity. Verifica tu conexión');
      } else {
        this.error.set(`Error de autenticación: ${error.message}`);
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Cerrar sesión
   */
  async signOut(): Promise<void> {
    try {
      await signOut(this.firebaseService.auth);
      console.log('👋 Sesión cerrada');
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
    }
  }

  /**
   * Verificar si un email está autorizado
   */
  private isEmailAuthorized(email: string | null): boolean {
    if (!email) return false;
    return email.toLowerCase() === this.AUTHORIZED_EMAIL.toLowerCase();
  }

  /**
   * Manejar usuario no autorizado
   */
  private async handleUnauthorizedUser(): Promise<void> {
    this.error.set('Acceso no autorizado. Usa la cuenta institucional: ' + this.AUTHORIZED_EMAIL);
    await this.signOut();
  }

  /**
   * Navegar al dashboard si está autenticado
   */
  navigateToDashboardIfAuthenticated(): void {
    if (this.userService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Navegar al login si no está autenticado
   */
  navigateToLoginIfNotAuthenticated(): void {
    if (!this.userService.isLoggedIn()) {
      this.router.navigate(['/login']);
    }
  }
}