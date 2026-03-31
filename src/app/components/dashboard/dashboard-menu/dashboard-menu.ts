import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DashboardUserinfo } from '../dashboard-userinfo/dashboard-userinfo';
import { AuthService } from '../../../services/auth.service';

type MenuIcon = 'dashboard' | 'students' | 'planner' | 'classes' | 'settings';

/**
 * Elemento del menú de navegación
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
  templateUrl: './dashboard-menu.html',
  styleUrl: './dashboard-menu.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardMenu {
  private authService = inject(AuthService);
  collapsed = input(false);
  mobileOpen = input(false);
  navigated = output<void>();
 /**
   * Cerrar sesión
   */
  async signOut(): Promise<void> {
    await this.authService.signOut();
  }
  // Elementos del menú
  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: 'dashboard',
      description: 'Vista general y resumen'
    },
    {
      label: 'Estudiantes',
      route: '/dashboard/estudiantes',
      icon: 'students',
      description: 'Gestión de estudiantes'
    },
    {
      label: 'Planificador',
      route: '/dashboard/planificador',
      icon: 'planner',
      description: 'Planificación de clases'
    },
    {
      label: 'Clases',
      route: '/dashboard/clases',
      icon: 'classes',
      description: 'Registro de clases'
    },
    {
      label: 'Configuración',
      route: '/dashboard/configuracion',
      icon: 'settings',
      description: 'Ajustes del sistema'
    }
  ];

  onNavigate(): void {
    this.navigated.emit();
  }
  
}
