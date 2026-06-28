import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StudentService } from '../../../services/student.service';
import { DateService } from '../../../services/date.service';
import { Student } from '../../../core/models/student.model';
import { StudentCard, StudentCardData } from '../student-card/student-card';
import { ModuleHeader } from '../../ui/module-header/module-header';

/**
 * Estudiante con datos calculados para la vista
 */
interface StudentDisplay extends StudentCardData {
  age: number;
  hasUpcomingBirthday: boolean;
  lastContactFormatted: string;
}

@Component({
  selector: 'app-student-list',
  imports: [CommonModule, FormsModule, StudentCard, ModuleHeader],
  templateUrl: './student-list.html',
  styleUrl: './student-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentList {
  private studentService = inject(StudentService);
  private dateService = inject(DateService);
  private router = inject(Router);

  // Estados reactivos
  searchTerm = signal('');
  showInactives = signal(false);
  isLoading = this.studentService.isLoading;
  error = this.studentService.error;
  
  // Fuentes de datos del servicio
  private activeStudents = this.studentService.activeStudents;
  private inactiveStudents = this.studentService.inactiveStudents;

  // Estudiantes con datos calculados para la vista (activos o inactivos según toggle)
  studentsDisplay = computed(() => {
    const students = this.showInactives() ? this.inactiveStudents() : this.activeStudents();
    return students.map(student => this.enrichStudentData(student));
  });

  // Estudiantes filtrados por búsqueda
  filteredStudents = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const students = this.studentsDisplay();
    
    if (!search) {
      return students;
    }

    return students.filter(student => 
      student.name.toLowerCase().includes(search) ||
      (student.phone || '').toLowerCase().includes(search) ||
      student.age.toString().includes(search) ||
      (student.contacts || []).some(contact => 
        contact.name.toLowerCase().includes(search) ||
        (contact.phone || '').includes(search)
      )
    );
  });

  // Estadísticas de la lista
  totalStudents = computed(() => this.studentsDisplay().length);
  totalFiltered = computed(() => this.filteredStudents().length);
  upcomingBirthdays = computed(() => {
    if (this.showInactives()) return 0;
    return this.filteredStudents().filter(s => s.hasUpcomingBirthday).length;
  });
  studentSubtitle = computed(() => {
    const total = this.totalStudents();
    if (this.showInactives()) {
      return `${total} estudiante${total !== 1 ? 's' : ''} inactivo${total !== 1 ? 's' : ''}`;
    }
    return `${total} estudiante${total !== 1 ? 's' : ''} activo${total !== 1 ? 's' : ''}`;
  });

  // UI States
  showNoResults = computed(() => 
    this.searchTerm().trim() !== '' && this.filteredStudents().length === 0
  );

  constructor() {
    // Efecto para logging (desarrollo)
    effect(() => {
      console.log('📋 Estudiantes filtrados:', this.filteredStudents().length);
    });
  }

  /**
   * Enriquecer datos del estudiante con información calculada
   */
  private enrichStudentData(student: Student): StudentDisplay {
    const birthDate = new Date(student.birthDate);
    const age = this.dateService.calculateAge(birthDate);
    const hasUpcomingBirthday = this.dateService.isUpcomingBirthday(student.birthDate);
    
    let lastContactFormatted = 'Sin registro';
    if (student.lastAttendance) {
      const lastDate = new Date(student.lastAttendance);
      // Solo mostrar fecha relativa si el último contacto fue hace menos de 60 días
      if(lastDate > this.dateService.addDays(this.dateService.getCurrentDateValue(), -60)) {
        lastContactFormatted = this.dateService.getRelativeDate(lastDate);
      }
      else {
        lastContactFormatted = this.dateService.formatDate(lastDate, { year: 'numeric', month: 'short' });
      }
    }

    return {
      ...student,
      age,
      hasUpcomingBirthday,
      lastContactFormatted
    };
  }

  /**
   * Activar/desactivar vista de inactivos
   */
  toggleShowInactives(): void {
    this.showInactives.update(v => !v);
    this.searchTerm.set('');
  }

  /**
   * Actualizar término de búsqueda
   */
  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  /**
   * Limpiar búsqueda
   */
  clearSearch(): void {
    this.searchTerm.set('');
  }

  /**
   * Navegar a detalle de estudiante
   */
  viewStudentDetail(studentId: string): void {
    this.router.navigate(['/dashboard/estudiantes', studentId]);
  }

  /**
   * Generar y descargar backup CSV de estudiantes activos
   */
  downloadCsv(): void {
    const confirmed = window.confirm('¿Confirma que desea descargar el archivo con los estudiantes?');
    if (!confirmed) return;

    const students = this.activeStudents();

    const escapeField = (value: string): string => `"${value.replace(/"/g, '""')}"`;

    const header = [
      'Nombre',
      'Teléfono',
      'Encargado principal',
      'Teléfono encargado',
      'Total clases asistidas',
      'Porcentaje asistencia año actual',
      'Última clase asistida',
      'Racha actual',
    ].map(escapeField).join(';');

    const rows = students.map(student => {
      const mainContact = (student.contacts ?? []).find(c => c.isMain);
      const pct = student.stats?.lastYearPercentage != null
        ? `${student.stats.lastYearPercentage.toFixed(1)}%`
        : 'N/A';

      return [
        student.name,
        student.phone ?? '',
        mainContact?.name ?? '',
        mainContact?.phone ?? '',
        String(student.stats?.totalAttendances ?? 0),
        pct,
        student.lastAttendance ?? 'N/A',
        String(student.stats?.currentStreak ?? 0),
      ].map(escapeField).join(';');
    });

    const csvContent = '\uFEFF' + [header, ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    const now = new Date();
    const pad = (n: number): string => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const fileName = `estudiantes-backup-${timestamp}.csv`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Navegar a formulario de nuevo estudiante
   */
  addNewStudent(): void {
    this.router.navigate(['/dashboard/estudiantes/nuevo']);
  }

  /**
   * Refrescar lista manualmente
   */
  refresh(): void {
    this.studentService.refresh();
  }

  /**
   * Track by function para optimizar renderizado
   */
  trackByStudentId(index: number, student: StudentDisplay): string {
    return student.id;
  }
}
