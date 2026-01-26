import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService, User } from '../../services/user.service';
import { DateService } from '../../services/date.service';
import { DashboardMetrics } from './dashboard-metrics/dashboard-metrics';
import { DashboardUserinfo } from './dashboard-userinfo/dashboard-userinfo';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, DashboardMetrics, DashboardUserinfo],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private userService = inject(UserService);
  private router = inject(Router);
  private dateService = inject(DateService);
  
  // Usar el signal del servicio de fechas
  currentMonth = this.dateService.currentMonth;
  constructor() {
    // Effect para redirigir si no hay usuario autenticado
    effect(() => {
      const user = this.userService.user();
      if (!user) {
        this.router.navigate(['/login']);
      }
    });
  }

  logout() {
    this.userService.logout();
    console.log('👋 Sesión cerrada, redirigiendo al login');
  }
}
