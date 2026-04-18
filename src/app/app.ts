import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  host: {
    '(window:scroll)': 'onWindowScroll()'
  }
})
export class App implements OnInit {
  private authService = inject(AuthService);
  private readonly scrollThreshold = 280;
  
  protected readonly title = signal('libreta-ibce');
  showScrollTopButton = signal(false);
  
  // Estado de inicialización de la app
  isAppInitialized = this.authService.isInitialized;
  
  // Computed para mostrar splash screen mientras inicializa
  showSplashScreen = computed(() => !this.isAppInitialized());

  ngOnInit(): void {
    console.log('🚀 App initialized');
    this.onWindowScroll();
    
    // Timeout de respaldo si Firebase tarda mucho en inicializar
    setTimeout(() => {
      if (!this.isAppInitialized()) {
        console.log('⚠️ Firebase taking too long, forcing initialization');
        this.authService.isInitialized.set(true);
      }
    }, 10000); // 10 segundos de timeout
  }

  onWindowScroll(): void {
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    const isVisible = scrollTop > this.scrollThreshold;
    this.showScrollTopButton.set(isVisible);
    document.body.classList.toggle('scroll-top-visible', isVisible);
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
