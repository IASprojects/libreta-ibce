import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DateService } from '../../../services/date.service';

interface Birthday {
  name: string;
  initials: string;
  date: string;
}

@Component({
  selector: 'app-dashboard-birthdays',
  imports: [CommonModule],
  templateUrl: './dashboard-birthdays.html',
  styleUrl: './dashboard-birthdays.css',
})
export class DashboardBirthdays {
  private dateService = inject(DateService);
  
  // Usar el signal del servicio de fechas
  currentMonth = this.dateService.currentMonthCapitalized;
  
  // Signal para los cumpleaños
  monthlyBirthdays = signal<Birthday[]>([
    { name: 'Ana López', initials: 'AL', date: `15 enero (14 años)` },
    { name: 'Carlos Ruiz', initials: 'CR', date: `22 enero (13 años)` },
    { name: 'María Torres', initials: 'MT', date: `28 enero (15 años)` },
  ]);
}