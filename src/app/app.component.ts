import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './shared/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
  host: {
    '(window:scroll)': 'onWindowScroll()'
  }
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  private readonly scrollThreshold = 280;
  
  protected readonly title = signal('libreta-ibce');
  showScrollTopButton = signal(false);
  
  // Estado de inicialización de la app
  isAppInitialized = this.authService.isInitialized;
  
  // Computed para mostrar splash screen mientras inicializa
  showSplashScreen = computed(() => !this.isAppInitialized());

  constructor() {
    inject(ThemeService);
  }

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
