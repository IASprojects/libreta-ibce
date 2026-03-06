import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
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
  private authService = inject(AuthService);
  private dateService = inject(DateService);
  
  // Estados reactivos
  user = this.userService.user;
  currentMonth = this.dateService.currentMonth;
  
  /**
   * Cerrar sesión
   */
  async signOut(): Promise<void> {
    await this.authService.signOut();
  }
}
