import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DashboardUserinfo } from '../userinfo/userinfo';
import { AuthService } from '../../../services/auth.service';

type MenuIcon = 'dashboard' | 'students' | 'planner' | 'classes' | 'settings';

/**
 * Elemento del menu de navegacion
 */
interface MenuItem {
  label: string;
  route: string;
  icon: MenuIcon;
  description: string;
}

@Component({
  selector: 'app-dashboard-menu',
  imports: [CommonModule, RouterLink, RouterLinkActive, DashboardUserinfo],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardMenu {
  private authService = inject(AuthService);
  collapsed = input(false);
  mobileOpen = input(false);
  navigated = output<void>();

  /**
   * Cerrar sesion
   */
  async signOut(): Promise<void> {
    await this.authService.signOut();
  }

  // Elementos del menu
  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: 'dashboard',
      description: 'Vista general y resumen',
    },
    {
      label: 'Estudiantes',
      route: '/dashboard/estudiantes',
      icon: 'students',
      description: 'Gestion de estudiantes',
    },
    {
      label: 'Planificador',
      route: '/dashboard/planificador',
      icon: 'planner',
      description: 'Planificacion de clases',
    },
    {
      label: 'Clases',
      route: '/dashboard/clases',
      icon: 'classes',
      description: 'Registro de clases',
    },
    {
      label: 'Configuracion',
      route: '/dashboard/configuracion',
      icon: 'settings',
      description: 'Ajustes del sistema',
    },
  ];

  onNavigate(): void {
    this.navigated.emit();
  }
}
