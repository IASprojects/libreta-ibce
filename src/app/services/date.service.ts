import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateService {
  // Signal que contiene la fecha actual
  private currentDate = signal(new Date());

  // Computed signals para diferentes formatos de fecha
  currentMonth = computed(() => 
    this.currentDate().toLocaleString('es-ES', { month: 'long' })
  );

  currentMonthCapitalized = computed(() => {
    const month = this.currentMonth();
    return month.charAt(0).toUpperCase() + month.slice(1);
  });

  currentYear = computed(() => 
    this.currentDate().getFullYear()
  );

  currentMonthNumber = computed(() => 
    this.currentDate().getMonth()
  );

  // Método para actualizar la fecha (útil para testing o cambios manuales)
  updateCurrentDate(date: Date = new Date()) {
    this.currentDate.set(date);
  }

  // Método para obtener nombres de meses
  getMonthNames(): string[] {
    return [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
  }

  // Método para obtener el nombre del mes por índice
  getMonthName(monthIndex: number): string {
    const monthNames = this.getMonthNames();
    return monthNames[monthIndex] || '';
  }

  // Método para formatear fecha completa
  formatDate(date: Date, options: Intl.DateTimeFormatOptions = {}): string {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleString('es-ES', { ...defaultOptions, ...options });
  }

  // Método para calcular edad
  calculateAge(birthDate: Date, referenceDate: Date = new Date()): number {
    const age = referenceDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    
    return age;
  }
}