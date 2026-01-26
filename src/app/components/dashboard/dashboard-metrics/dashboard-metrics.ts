import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardIndicators } from '../dashboard-indicators/dashboard-indicators';
import { DashboardBirthdays } from '../dashboard-birthdays/dashboard-birthdays';
import { DashboardNewstudents } from '../dashboard-newstudents/dashboard-newstudents';
import { DashboardSchedule } from '../dashboard-schedule/dashboard-schedule';

@Component({
  selector: 'app-dashboard-metrics',
  imports: [CommonModule, DashboardIndicators, DashboardBirthdays, DashboardNewstudents, DashboardSchedule],
  templateUrl: './dashboard-metrics.html',
  styleUrl: './dashboard-metrics.css',
})
export class DashboardMetrics {
  // Este componente ahora actúa como contenedor de los otros componentes
}