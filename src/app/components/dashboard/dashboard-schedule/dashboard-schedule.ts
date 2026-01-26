import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface UpcomingClass {
  day: string;
  month: string;
  topic: string;
  teacher: string;
  time: string;
}

@Component({
  selector: 'app-dashboard-schedule',
  imports: [CommonModule],
  templateUrl: './dashboard-schedule.html',
  styleUrl: './dashboard-schedule.css',
})
export class DashboardSchedule implements OnInit {
  upcomingClasses: UpcomingClass[] = [];

  ngOnInit() {
    this.loadScheduleData();
  }

  private loadScheduleData() {
    // Datos de ejemplo
    this.upcomingClasses = [
      {
        day: '26',
        month: 'ENE',
        topic: 'Los Valores Cristianos',
        teacher: 'Prof. Juan Pérez',
        time: '10:00 AM'
      },
      {
        day: '02',
        month: 'FEB',
        topic: 'La Oración y Fe',
        teacher: 'Prof. Ana García',
        time: '10:00 AM'
      },
      {
        day: '09',
        month: 'FEB',
        topic: 'Servicio a la Comunidad',
        teacher: 'Prof. Luis Morales',
        time: '10:00 AM'
      },
    ];
  }
}