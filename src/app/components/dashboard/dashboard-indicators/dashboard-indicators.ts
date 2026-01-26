import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-indicators',
  imports: [CommonModule],
  templateUrl: './dashboard-indicators.html',
  styleUrl: './dashboard-indicators.css',
})
export class DashboardIndicators implements OnInit {
  // Indicadores principales
  totalClasses: number = 0;
  averageAttendance: number = 0;
  lastClassDate: string = '';
  lastTeacher: string = '';

  ngOnInit() {
    this.loadIndicatorsData();
  }

  private loadIndicatorsData() {
    // Datos de ejemplo - estos vendrían del servicio real
    this.totalClasses = 28;
    this.averageAttendance = 12;
    this.lastClassDate = '20 Enero';
    this.lastTeacher = 'Prof. María González';
  }
}