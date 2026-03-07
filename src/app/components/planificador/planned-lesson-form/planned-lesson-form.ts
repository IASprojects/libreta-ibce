import { Component, inject, signal, computed, input, output, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlannedLessonService, CreatePlannedLessonInput } from '../../../services/planned-lesson.service';
import { PlannedLesson } from '../../../core/models/planned-lesson.model';
import { UserService } from '../../../services/user.service';
import { DateService } from '../../../services/date.service';
import { TeacherNames } from '../../../core/models/enums';

/**
 * Datos del formulario
 */
interface LessonFormData {
  plannedDate: string;
  unitNumber: string;
  lessonNumber: string;
  plannedTeacherId: string;
}

/**
 * Modo del formulario
 */
type FormMode = 'create' | 'edit';

@Component({
  selector: 'app-planned-lesson-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './planned-lesson-form.html',
  styleUrl: './planned-lesson-form.css',
})
export class PlannedLessonForm implements OnInit {
  private plannedLessonService = inject(PlannedLessonService);
  private userService = inject(UserService);
  private dateService = inject(DateService);

  // Inputs
  lesson = input<PlannedLesson | null>(null);
  mode = input<FormMode>('create');

  // Outputs
  saved = output<void>();
  cancelled = output<void>();

  // Estados del formulario
  formData = signal<LessonFormData>({
    plannedDate: '',
    unitNumber: '1',
    lessonNumber: '1',
    plannedTeacherId: ''
  });

  // Estados de UI
  isSaving = signal(false);
  formError = signal<string | null>(null);
  fieldErrors = signal<Record<string, string>>({});

  // Usuario actual
  currentUser = this.userService.user;

  // Maestros disponibles
  teacherNames = Object.values(TeacherNames);

  // Unidades y lecciones disponibles (1-52 para unidades, 1-7 para lecciones)
  unitNumbers = Array.from({ length: 52 }, (_, i) => (i + 1).toString());
  lessonNumbers = Array.from({ length: 7 }, (_, i) => (i + 1).toString());

  // Título del formulario
  formTitle = computed(() => 
    this.mode() === 'create' ? 'Nueva Lección Planificada' : 'Editar Lección'
  );

  // Texto del botón
  submitButtonText = computed(() =>
    this.mode() === 'create' ? 'Crear Lección' : 'Guardar Cambios'
  );

  // Fecha mínima permitida (hoy)
  minDate = computed(() => this.dateService.getTodayDateString());

  ngOnInit(): void {
    // Si estamos editando, cargar los datos de la lección
    const currentLesson = this.lesson();
    if (currentLesson && this.mode() === 'edit') {
      // Normalizar la fecha para evitar problemas de zona horaria
      const normalizedDate = this.normalizeDateString(currentLesson.plannedDate);
      this.formData.set({
        plannedDate: normalizedDate,
        unitNumber: currentLesson.unitNumber,
        lessonNumber: currentLesson.lessonNumber,
        plannedTeacherId: currentLesson.plannedTeacherId
      });
    } else {
      // Modo creación: establecer fecha de hoy por defecto
      this.formData.update(data => ({
        ...data,
        plannedDate: this.dateService.getTodayDateString()
      }));
    }
  }

  /**
   * Normalizar string de fecha para evitar problemas de zona horaria
   * Asegura que la fecha se interprete correctamente en la zona horaria local
   */
  private normalizeDateString(dateString: string): string {
    // Si ya está en formato YYYY-MM-DD, mantenerlo así
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // Si viene en otro formato, convertir usando zona horaria local
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Validar formulario
   */
  private validateForm(): boolean {
    const data = this.formData();
    const errors: Record<string, string> = {};

    // Validar fecha planificada
    if (!data.plannedDate) {
      errors['plannedDate'] = 'La fecha es obligatoria';
    } else {
      // Crear fecha usando componentes locales para evitar problemas de zona horaria
      const [year, month, day] = data.plannedDate.split('-').map(Number);
      const plannedDate = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (plannedDate < today) {
        errors['plannedDate'] = 'No se puede planificar en el pasado';
      }
    }

    // Validar unidad
    if (!data.unitNumber || data.unitNumber === '') {
      errors['unitNumber'] = 'La unidad es obligatoria';
    }

    // Validar lección
    if (!data.lessonNumber || data.lessonNumber === '') {
      errors['lessonNumber'] = 'La lección es obligatoria';
    }

    // Validar maestro
    if (!data.plannedTeacherId || data.plannedTeacherId === '') {
      errors['plannedTeacherId'] = 'El maestro es obligatorio';
    }

    this.fieldErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  /**
   * Actualizar campo del formulario
   */
  updateField<K extends keyof LessonFormData>(field: K, value: LessonFormData[K]): void {
    this.formData.update(data => ({
      ...data,
      [field]: value
    }));
    
    // Limpiar error del campo
    this.fieldErrors.update(errors => {
      const newErrors = { ...errors };
      delete newErrors[field];
      return newErrors;
    });
  }

  /**
   * Guardar lección
   */
  async onSubmit(): Promise<void> {
    // Limpiar errores previos
    this.formError.set(null);
    this.fieldErrors.set({});

    // Validar
    if (!this.validateForm()) {
      this.formError.set('Por favor, corrige los errores en el formulario');
      return;
    }

    // Verificar usuario
    const user = this.currentUser();
    if (!user) {
      this.formError.set('Debes iniciar sesión para guardar');
      return;
    }

    const data = this.formData();
    this.isSaving.set(true);

    try {
      if (this.mode() === 'edit') {
        // Actualizar lección existente
        const currentLesson = this.lesson();
        if (!currentLesson) {
          throw new Error('No se encontró la lección a editar');
        }

        await this.plannedLessonService.update(currentLesson.id, {
          plannedDate: data.plannedDate,
          unitNumber: data.unitNumber,
          lessonNumber: data.lessonNumber,
          plannedTeacherId: data.plannedTeacherId
        }).toPromise();
        
        console.log('✅ Lección actualizada');
      } else {
        // Crear nueva lección
        const createInput: CreatePlannedLessonInput = {
          plannedDate: data.plannedDate,
          unitNumber: data.unitNumber,
          lessonNumber: data.lessonNumber,
          plannedTeacherId: data.plannedTeacherId
        };

        await this.plannedLessonService.create(createInput, user.uid).toPromise();
        console.log('✅ Lección creada');
      }

      // Emitir evento de guardado exitoso
      this.saved.emit();
    } catch (error: any) {
      console.error('Error al guardar lección:', error);
      this.formError.set(error.message || 'Error al guardar la lección');
    } finally {
      this.isSaving.set(false);
    }
  }

  /**
   * Cancelar formulario
   */
  onCancel(): void {
    this.cancelled.emit();
  }

  /**
   * Limpiar errores
   */
  clearErrors(): void {
    this.formError.set(null);
    this.fieldErrors.set({});
  }

  /**
   * Verificar si un campo tiene error
   */
  hasFieldError(field: keyof LessonFormData): boolean {
    return !!this.fieldErrors()[field];
  }

  /**
   * Obtener mensaje de error de un campo
   */
  getFieldError(field: keyof LessonFormData): string | null {
    return this.fieldErrors()[field] || null;
  }
}
