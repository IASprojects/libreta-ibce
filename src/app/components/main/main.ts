import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { DashboardMenu } from '../dashboard/dashboard-menu/dashboard-menu';
import { AppShell } from '../ui/app-shell/app-shell';
import { Topbar } from '../ui/topbar/topbar';

@Component({
  selector: 'app-main',
  imports: [RouterOutlet, DashboardMenu, AppShell, Topbar],
  templateUrl: './main.html',
  styleUrl: './main.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'closeMobileMenu()'
  }
})
export class Main {
  private router = inject(Router);


  sidebarCollapsed = signal(false);
  mobileMenuOpen = signal(false);
  private currentPath = signal(this.router.url);

  currentSectionTitle = computed(() => {
    const path = this.currentPath();

    if (path.startsWith('/dashboard/estudiantes')) {
      return 'Estudiantes';
    }

    if (path.startsWith('/dashboard/planificador')) {
      return 'Planificador';
    }

    if (path.startsWith('/dashboard/clases')) {
      return 'Clases';
    }

    if (path.startsWith('/dashboard/configuracion')) {
      return 'Configuracion';
    }

    return 'Dashboard';
  });

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentPath.set(event.urlAfterRedirects);
        this.mobileMenuOpen.set(false);
      });
  }

  toggleSidebarCollapsed(): void {
    this.sidebarCollapsed.update((value) => !value);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((value) => !value);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
  
}
