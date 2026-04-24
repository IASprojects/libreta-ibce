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

  // Método para obtener fecha actual en formato string (YYYY-MM-DD)
  getTodayDateString(): string {
    const today = new Date();
    return this.getDateString(today);
  }

  // Método para convertir Date a string (YYYY-MM-DD)
  getDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Método para obtener diferencia en días entre dos fechas
  getDaysDifference(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date1.getTime() - date2.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Método para verificar si el cumpleaños es próximo (próximos 7 días)
  isUpcomingBirthday(birthDate: string | Date, daysAhead: number = 7): boolean {
    const today = new Date();
    const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    
    // Ajustar cumpleaños al año actual
    const thisYearBirthday = new Date(
      today.getFullYear(),
      birth.getUTCMonth(),
      birth.getUTCDate()
    );
    
    // Calcular diferencia en días
    const diffDays = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 && diffDays <= daysAhead;
  }

  // Método para formatear fecha relativa (hace X días, en X días)
  getRelativeDate(date: Date): string {
    const today = new Date();
    const diffDays = this.getDaysDifference(date, today);
    
    if (date > today) {
      if (diffDays === 0) return 'Hoy';
      if (diffDays === 1) return 'Mañana';
      return `En ${diffDays} días`;
    } else {
      if (diffDays === 0) return 'Hoy';
      if (diffDays === 1) return 'Ayer';
      return `Hace ${diffDays} días`;
    }
  }
}