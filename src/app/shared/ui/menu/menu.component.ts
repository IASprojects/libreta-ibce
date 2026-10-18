import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UserinfoComponent } from '../userinfo/userinfo.component';
import { AuthService } from '../../../core/services/auth.service';

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
  imports: [CommonModule, RouterLink, RouterLinkActive, UserinfoComponent],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuComponent {
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
