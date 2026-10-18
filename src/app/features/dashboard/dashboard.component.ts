import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../shared/user.service';
import { AuthService } from '../../core/services/auth.service';
import { DateService } from '../../shared/date.service';
import { DashboardMetricsComponent } from './dashboard-metrics/dashboard-metrics.component';
import { ModuleHeaderComponent } from '../../shared/ui/module-header/module-header.component';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, DashboardMetricsComponent, ModuleHeaderComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private dateService = inject(DateService);
  
  // Estados reactivos
  user = this.userService.user;
  currentMonth = this.dateService.currentMonth;
  
 
}
