import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

/**
 * Elemento del menú de navegación
 */
interface MenuItem {
  label: string;
  route: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-dashboard-menu',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './dashboard-menu.html',
  styleUrl: './dashboard-menu.css',
})
export class DashboardMenu {
  // Control de menú móvil
  isMenuOpen = signal(false);

  // Elementos del menú
  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: '📊',
      description: 'Vista general y resumen'
    },
    {
      label: 'Estudiantes',
      route: '/dashboard/estudiantes',
      icon: '👥',
      description: 'Gestión de estudiantes'
    },
    {
      label: 'Planificador',
      route: '/dashboard/planificador',
      icon: '📅',
      description: 'Planificación de clases'
    },
    {
      label: 'Clases',
      route: '/dashboard/clases',
      icon: '📚',
      description: 'Registro de clases'
    },
    {
      label: 'Configuración',
      route: '/dashboard/configuracion',
      icon: '⚙️',
      description: 'Ajustes del sistema'
    }
  ];

  /**
   * Toggle del menú en móviles
   */
  toggleMenu(): void {
    this.isMenuOpen.update(value => !value);
  }

  /**
   * Cerrar menú (útil en móviles después de selección)
   */
  closeMenu(): void {
    this.isMenuOpen.set(false);
  }
}
