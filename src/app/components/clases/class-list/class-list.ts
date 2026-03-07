import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LessonClassService } from '../../../services/lesson-class.service';
import { DateService } from '../../../services/date.service';
import { LessonClass } from '../../../core/models/lesson-class.model';

/**
 * Clase con datos calculados para la vista
 */
interface LessonClassDisplay extends LessonClass {
  formattedDate: string;
  formattedShortDate: string;
  isToday: boolean;
  isRecent: boolean;
  isPast: boolean;
  daysSinceClass: number;
}

@Component({
  selector: 'app-class-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './class-list.html',
  styleUrl: './class-list.css',
})
export class ClassList {
  private lessonClassService = inject(LessonClassService);
  private dateService = inject(DateService);

  // Estados reactivos del servicio
  isLoading = this.lessonClassService.isLoading;
  error = this.lessonClassService.error;
  classStats = this.lessonClassService.classStats;
  todayClass = this.lessonClassService.todayClass;
  hasTodayClass = this.lessonClassService.hasTodayClass;
  
  // Clases del servicio
  private activeClasses = this.lessonClassService.activeClasses;

  // Filtros
  filterTeacher = signal<string>('all');
  filterPeriod = signal<string>('all'); // 'all', 'today', 'week', 'month', 'year'
  searchTerm = signal('');

  // Clases con datos calculados para la vista
  classesDisplay = computed(() => {
    const classes = this.activeClasses();
    return classes.map(lessonClass => this.enrichClassData(lessonClass));
  });

  // Clases filtradas
  filteredClasses = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const teacher = this.filterTeacher();
    const period = this.filterPeriod();
    let classes = this.classesDisplay();

    // Filtrar por maestro
    if (teacher !== 'all') {
      classes = classes.filter(c => c.teacherId === teacher);
    }

    // Filtrar por período
    if (period !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (period === 'today') {
        classes = classes.filter(c => c.isToday);
      } else if (period === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        classes = classes.filter(c => {
          const [year, month, day] = c.date.split('-').map(Number);
          const classDate = new Date(year, month - 1, day);
          return classDate >= weekAgo && classDate <= today;
        });
      } else if (period === 'month') {
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        classes = classes.filter(c => {
          const [year, month] = c.date.split('-').map(Number);
          return month - 1 === currentMonth && year === currentYear;
        });
      } else if (period === 'year') {
        const currentYear = today.getFullYear();
        classes = classes.filter(c => {
          const [year] = c.date.split('-').map(Number);
          return year === currentYear;
        });
      }
    }

    // Filtrar por búsqueda
    if (search) {
      classes = classes.filter(lessonClass => 
        lessonClass.unitNumber.toLowerCase().includes(search) ||
        lessonClass.lessonNumber.toLowerCase().includes(search) ||
        lessonClass.teacherId.toLowerCase().includes(search) ||
        lessonClass.formattedDate.toLowerCase().includes(search) ||
        (lessonClass.notes && lessonClass.notes.toLowerCase().includes(search))
      );
    }

    return classes;
  });

  // Estadísticas de la lista
  totalClasses = computed(() => this.classesDisplay().length);
  totalFiltered = computed(() => this.filteredClasses().length);
  recentCount = computed(() => 
    this.classesDisplay().filter(c => c.isRecent).length
  );

  // UI States
  showNoResults = computed(() => 
    (this.searchTerm().trim() !== '' || this.filterTeacher() !== 'all' || this.filterPeriod() !== 'all') 
    && this.filteredClasses().length === 0
  );

  // Lista de maestros únicos
  uniqueTeachers = computed(() => {
    const teachers = new Set(this.classesDisplay().map(c => c.teacherId));
    return Array.from(teachers).sort();
  });

  constructor() {
    effect(() => {
      console.log('📚 Clases filtradas:', this.filteredClasses().length);
    });
  }

  /**
   * Enriquecer datos de clase para la vista
   */
  private enrichClassData(lessonClass: LessonClass): LessonClassDisplay {
    // Parsear fecha usando componentes locales para evitar problemas de zona horaria
    const [year, month, day] = lessonClass.date.split('-').map(Number);
    const classDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    classDate.setHours(0, 0, 0, 0);

    // Calcular días desde la clase
    const diffTime = today.getTime() - classDate.getTime();
    const daysSinceClass = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Una clase es reciente si fue en los últimos 7 días
    const isRecent = daysSinceClass >= 0 && daysSinceClass <= 7;

    return {
      ...lessonClass,
      formattedDate: this.formatDate(lessonClass.date),
      formattedShortDate: this.formatShortDate(lessonClass.date),
      isToday: classDate.getTime() === today.getTime(),
      isRecent,
      isPast: classDate < today,
      daysSinceClass
    };
  }

  /**
   * Formatear fecha completa
   */
  private formatDate(dateString: string): string {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    };
    return date.toLocaleDateString('es-ES', options);
  }

  /**
   * Formatear fecha corta
   */
  private formatShortDate(dateString: string): string {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric'
    };
    return date.toLocaleDateString('es-ES', options);
  }

  /**
   * Obtener texto de tiempo relativo
   */
  getRelativeTime(daysSince: number): string {
    if (daysSince === 0) return 'Hoy';
    if (daysSince === 1) return 'Ayer';
    if (daysSince < 7) return `Hace ${daysSince} días`;
    if (daysSince < 30) return `Hace ${Math.floor(daysSince / 7)} semanas`;
    if (daysSince < 365) return `Hace ${Math.floor(daysSince / 30)} meses`;
    return `Hace ${Math.floor(daysSince / 365)} años`;
  }

  // Métodos de interacción

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  onFilterTeacherChange(value: string): void {
    this.filterTeacher.set(value);
  }

  onFilterPeriodChange(value: string): void {
    this.filterPeriod.set(value);
  }

  clearFilters(): void {
    this.filterTeacher.set('all');
    this.filterPeriod.set('all');
    this.searchTerm.set('');
  }

  refresh(): void {
    this.lessonClassService.refresh();
  }

  clearError(): void {
    this.lessonClassService.clearError();
  }

  // Navegación

  viewClassDetail(classId: string): void {
    console.log('Ver detalles de clase:', classId);
    // TODO: Implementar navegación a detalle
  }

  // Track by para rendimiento
  trackByClassId(index: number, lessonClass: LessonClassDisplay): string {
    return lessonClass.id;
  }
}
