import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService, User } from '../../services/user.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private userService = inject(UserService);
  private router = inject(Router);
  
  isLoading = signal(false);
  
  // Signal del usuario del servicio
  user = this.userService.user;

  // Variable para rastrear el estado anterior del usuario
  private previousUser: User | null | undefined = null;

  // Simular datos de usuario de Google
  private mockGoogleUser: User = {
    displayName: 'Usuario Demo',
    email: 'usuario.demo@gmail.com',
    photoURL: 'https://lh3.googleusercontent.com/a/ACg8ocK7XQ7aP1P2xQc9v_9o_1o1o1o1o1o1o1o1o1o=s96-c',
    uid: 'mock-uid-12345'
  };

  constructor() {
    // Effect para redirigir solo cuando se pasa de no tener usuario a tener uno
    effect(() => {
      const user = this.userService.user();

      // Navegar solo cuando antes no había usuario y ahora sí
      if (!this.previousUser && user) {
        this.router.navigate(['/dashboard']);
      }

      this.previousUser = user;
    });
  }

  async signInWithGoogle() {
    this.isLoading.set(true);
    
    // Simular delay de autenticación
    await this.delay(1500);
    
    // Simular login exitoso
    const user = { ...this.mockGoogleUser };
    this.userService.setUser(user);
    this.isLoading.set(false);
    
    console.log('✅ Login simulado exitoso:', user);
    
    // Navegar al dashboard
    this.router.navigate(['/dashboard']);
  }

  signOut() {
    this.userService.logout();
    console.log('👋 Usuario deslogueado');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
