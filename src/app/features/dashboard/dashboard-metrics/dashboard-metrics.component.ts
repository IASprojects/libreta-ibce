import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardIndicatorsComponent } from '../dashboard-indicators/dashboard-indicators.component';
import { DashboardBirthdaysComponent } from '../dashboard-birthdays/dashboard-birthdays.component';
import { DashboardNewstudentsComponent } from '../dashboard-newstudents/dashboard-newstudents.component';
import { DashboardScheduleComponent } from '../dashboard-schedule/dashboard-schedule.component';

@Component({
  selector: 'app-dashboard-metrics',
  imports: [CommonModule, DashboardIndicatorsComponent, DashboardBirthdaysComponent, DashboardNewstudentsComponent, DashboardScheduleComponent],
  templateUrl: './dashboard-metrics.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './dashboard-metrics.component.css',
})
export class DashboardMetricsComponent {
  // Este componente ahora actúa como contenedor de los otros componentes
}