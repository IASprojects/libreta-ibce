import { Component, inject, signal, computed, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlannedLessonService, CreatePlannedLessonInput } from '../../../services/planned-lesson.service';
import { PlannedLesson } from '../../../core/models/planned-lesson.model';
import { UserService } from '../../../services/user.service';
import { DateService } from '../../../services/date.service';
import { AppConfigService } from '../../../services/app-config.service';
import { TeacherNames } from '../../../core/models/enums';

/**
 * Datos del formulario
 */
interface LessonFormData {
  plannedDate: string;
  IsFormalClass: boolean;
  title: string;
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
export class PlannedLessonForm {
  private plannedLessonService = inject(PlannedLessonService);
  private userService = inject(UserService);
  private dateService = inject(DateService);
  private appConfigService = inject(AppConfigService);

  // Inputs
  lesson = input<PlannedLesson | null>(null);
  mode = input<FormMode>('create');

  // Outputs
  saved = output<void>();
  cancelled = output<void>();

  // Estados del formulario
  formData = signal<LessonFormData>({
    plannedDate: '',
    IsFormalClass: true,
    title: '',
    unitNumber: '',
    lessonNumber: '',
    plannedTeacherId: ''
  });

  // Estados de UI
  isSaving = signal(false);
  formError = signal<string | null>(null);
  fieldErrors = signal<Record<string, string>>({});

  // Usuario actual
  currentUser = this.userService.user;

  // Maestros disponibles
  teacherNames = computed(() => {
    const configuredTeachers = this.appConfigService.activeTeachers().map(teacher => teacher.name);
    return configuredTeachers.length > 0 ? configuredTeachers : Object.values(TeacherNames);
  });

  private legacyUnitNumbers = Array.from({ length: 52 }, (_, i) => (i + 1).toString());
  private legacyLessonNumbers = Array.from({ length: 7 }, (_, i) => (i + 1).toString());

  unitNumbers = computed(() => {
    const configuredUnits = this.appConfigService
      .lessonCatalog()
      .map(unit => unit.unitNumber.trim())
      .filter(unitNumber => unitNumber !== '');

    return configuredUnits.length > 0 ? configuredUnits : this.legacyUnitNumbers;
  });

  lessonNumbers = computed(() => {
    const selectedUnit = this.formData().unitNumber.trim();
    if (!selectedUnit) {
      return this.legacyLessonNumbers;
    }

    const configuredUnit = this.appConfigService
      .lessonCatalog()
      .find(unit => unit.unitNumber.trim() === selectedUnit);

    if (!configuredUnit) {
      return this.legacyLessonNumbers;
    }

    const configuredLessons = configuredUnit.lessons
      .filter(lesson => lesson.isActive)
      .map(lesson => lesson.lessonNumber.trim())
      .filter(lessonNumber => lessonNumber !== '');

    return configuredLessons.length > 0 ? configuredLessons : this.legacyLessonNumbers;
  });

  // Cuando el valor guardado no existe en el catálogo actual, se muestra como opción legada.
  customUnitOption = computed(() => {
    const value = this.formData().unitNumber.trim();
    if (!value) {
      return null;
    }

    return this.unitNumbers().includes(value) ? null : value;
  });

  customLessonOption = computed(() => {
    const value = this.formData().lessonNumber.trim();
    if (!value) {
      return null;
    }

    return this.lessonNumbers().includes(value) ? null : value;
  });

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

  constructor() {
    // Reaccionar a cambios de input para asegurar carga correcta en edición.
    effect(() => {
      const currentLesson = this.lesson();
      this.mode();
      this.appConfigService.lessonCatalog();
      this.appConfigService.activeTeachers();

      // Si hay lección, siempre hidratar como edición para evitar problemas de orden de inputs.
      if (currentLesson) {
        const normalizedDate = this.normalizeDateString(currentLesson.plannedDate);
        const normalizedUnitNumber = this.normalizeUnitSelectValue(currentLesson.unitNumber);
        const normalizedLessonNumber = this.normalizeLessonSelectValue(
          currentLesson.lessonNumber,
          normalizedUnitNumber
        );

        this.formData.set({
          plannedDate: normalizedDate,
          IsFormalClass: currentLesson.IsFormalClass ?? true,
          title: currentLesson.title || '',
          unitNumber: normalizedUnitNumber,
          lessonNumber: normalizedLessonNumber,
          plannedTeacherId: currentLesson.plannedTeacherId
        });
        return;
      }

      this.formData.set({
        plannedDate: this.dateService.getTodayDateString(),
        IsFormalClass: true,
        title: '',
        unitNumber: '',
        lessonNumber: '',
        plannedTeacherId: ''
      });
    });
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

  private normalizeUnitSelectValue(value: unknown): string {
    return this.normalizeSelectValue(value, this.unitNumbers());
  }

  private normalizeLessonSelectValue(value: unknown, unitNumber?: string): string {
    return this.normalizeSelectValue(value, this.getAllowedLessonNumbers(unitNumber));
  }

  private getAllowedLessonNumbers(unitNumber?: string): string[] {
    const selectedUnit = unitNumber?.trim() || this.formData().unitNumber.trim();
    if (!selectedUnit) {
      return this.legacyLessonNumbers;
    }

    const configuredUnit = this.appConfigService
      .lessonCatalog()
      .find(unit => unit.unitNumber.trim() === selectedUnit);

    if (!configuredUnit) {
      return this.legacyLessonNumbers;
    }

    const configuredLessons = configuredUnit.lessons
      .filter(lesson => lesson.isActive)
      .map(lesson => lesson.lessonNumber.trim())
      .filter(lessonNumber => lessonNumber !== '');

    return configuredLessons.length > 0 ? configuredLessons : this.legacyLessonNumbers;
  }

  private normalizeSelectValue(value: unknown, allowedValues: string[]): string {
    if (value === null || value === undefined) {
      return '';
    }

    const raw = String(value).trim();
    if (!raw) {
      return '';
    }

    if (allowedValues.includes(raw)) {
      return raw;
    }

    const numericMatch = raw.match(/\d+/);
    if (!numericMatch) {
      return raw;
    }

    const numeric = Number(numericMatch[0]);
    if (!Number.isFinite(numeric)) {
      return '';
    }

    const normalized = String(numeric);
    return allowedValues.includes(normalized) ? normalized : raw;
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

    // Validar maestro
    if (!data.plannedTeacherId || data.plannedTeacherId === '') {
      errors['plannedTeacherId'] = 'El maestro es obligatorio';
    }

    // Validaciones condicionales por tipo de clase
    if (data.IsFormalClass) {
      if (!data.unitNumber.trim()) {
        errors['unitNumber'] = 'La unidad es obligatoria en clases formales';
      }
      if (!data.lessonNumber.trim()) {
        errors['lessonNumber'] = 'La lección es obligatoria en clases formales';
      }
    } else if (!data.title.trim()) {
      errors['title'] = 'El título es obligatorio en clases no formales';
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

    if (field === 'unitNumber') {
      this.formData.update(data => {
        const availableLessons = this.lessonNumbers();
        const normalizedLesson = this.normalizeLessonSelectValue(data.lessonNumber, data.unitNumber);

        return {
          ...data,
          lessonNumber: availableLessons.includes(normalizedLesson) ? normalizedLesson : ''
        };
      });
    }

    if (field === 'IsFormalClass') {
      this.formData.update(data => {
        if (value) {
          return { ...data, title: '' };
        }

        return { ...data, unitNumber: '', lessonNumber: '' };
      });
    }
    
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
      const currentLesson = this.lesson();
      const isEditMode = this.mode() === 'edit' || !!currentLesson;

      if (isEditMode) {
        // Actualizar lección existente
        if (!currentLesson) {
          throw new Error('No se encontró la lección a editar');
        }

        await this.plannedLessonService.update(currentLesson.id, {
          plannedDate: data.plannedDate,
          IsFormalClass: data.IsFormalClass,
          title: data.title || '',
          unitNumber: data.unitNumber,
          lessonNumber: data.lessonNumber,
          plannedTeacherId: data.plannedTeacherId
        }).toPromise();
        
        console.log('✅ Lección actualizada');
      } else {
        // Crear nueva lección
        const createInput: CreatePlannedLessonInput = {
          plannedDate: data.plannedDate,
          IsFormalClass: data.IsFormalClass,
          title: data.title || '',
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
