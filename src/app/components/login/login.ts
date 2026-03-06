import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);
  
  // Estados reactivos del servicio de autenticación
  isLoading = this.authService.isLoading;
  error = this.authService.error;
  
  // Estado del usuario
  user = this.userService.user;
  isLoggedIn = this.userService.isLoggedIn;
  
  // Computed para mostrar el email autorizado
  authorizedEmail = computed(() => 'maestrosibce@gmail.com');

  async signInWithGoogle(): Promise<void> {
    await this.authService.signInWithGoogle();
  }

  async signOut(): Promise<void> {
    await this.authService.signOut();
  }

  /**
   * Limpiar error cuando se hace clic
   */
  clearError(): void {
    this.authService.error.set(null);
  }
}
