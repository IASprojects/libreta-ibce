import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StudentService } from '../../../services/student.service';
import { DateService } from '../../../services/date.service';
import { Student } from '../../../core/models/student.model';
import { StudentCard, StudentCardData } from '../student-card/student-card';

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
  imports: [CommonModule, FormsModule, StudentCard],
  templateUrl: './student-list.html',
  styleUrl: './student-list.css',
})
export class StudentList {
  private studentService = inject(StudentService);
  private dateService = inject(DateService);
  private router = inject(Router);

  // Estados reactivos
  searchTerm = signal('');
  isLoading = this.studentService.isLoading;
  error = this.studentService.error;
  
  // Estudiantes activos del servicio
  private activeStudents = this.studentService.activeStudents;

  // Estudiantes con datos calculados para la vista
  studentsDisplay = computed(() => {
    const students = this.activeStudents();
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
      student.age.toString().includes(search) ||
      student.contacts.some(contact => 
        contact.name.toLowerCase().includes(search) ||
        contact.phone.includes(search)
      )
    );
  });

  // Estadísticas de la lista
  totalStudents = computed(() => this.studentsDisplay().length);
  totalFiltered = computed(() => this.filteredStudents().length);
  upcomingBirthdays = computed(() => 
    this.filteredStudents().filter(s => s.hasUpcomingBirthday).length
  );

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
      lastContactFormatted = this.dateService.getRelativeDate(lastDate);
    }

    return {
      ...student,
      age,
      hasUpcomingBirthday,
      lastContactFormatted
    };
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
