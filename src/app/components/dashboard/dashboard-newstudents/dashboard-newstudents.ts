import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Student {
  name: string;
  initials: string;
  joinedDate: string;
}

@Component({
  selector: 'app-dashboard-newstudents',
  imports: [CommonModule],
  templateUrl: './dashboard-newstudents.html',
  styleUrl: './dashboard-newstudents.css',
})
export class DashboardNewstudents implements OnInit {
  recentStudents: Student[] = [];

  ngOnInit() {
    this.loadStudentsData();
  }

  private loadStudentsData() {
    // Datos de ejemplo
    this.recentStudents = [
      { name: 'Pedro Martínez', initials: 'PM', joinedDate: '10 Enero 2026' },
      { name: 'Lucía Fernández', initials: 'LF', joinedDate: '08 Enero 2026' },
      { name: 'Diego Herrera', initials: 'DH', joinedDate: '03 Enero 2026' },
    ];
  }
}