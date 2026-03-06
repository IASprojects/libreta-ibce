import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private authService = inject(AuthService);
  
  protected readonly title = signal('libreta-ibce');
  
  // Estado de inicialización de la app
  isAppInitialized = this.authService.isInitialized;
  
  // Computed para mostrar splash screen mientras inicializa
  showSplashScreen = computed(() => !this.isAppInitialized());

  ngOnInit(): void {
    console.log('🚀 App initialized');
    
    // Timeout de respaldo si Firebase tarda mucho en inicializar
    setTimeout(() => {
      if (!this.isAppInitialized()) {
        console.log('⚠️ Firebase taking too long, forcing initialization');
        this.authService.isInitialized.set(true);
      }
    }, 10000); // 10 segundos de timeout
  }
}
