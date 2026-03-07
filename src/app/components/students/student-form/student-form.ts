import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { StudentService } from '../../../services/student.service';
import { UserService } from '../../../services/user.service';
import { Student, StudentContact } from '../../../core/models/student.model';
import { ContactRelationship } from '../../../core/models/enums';
import {
  createStudentForm,
  createContactFormGroup,
  getContactsFormArray,
} from './student-form.factory';
import { getBirthDateBoundary } from './student-form.validators';

/**
 * Modo del formulario
 */
type FormMode = 'create' | 'edit';

/**
 * Opciones para el select de relación
 */
interface RelationshipOption {
  value: ContactRelationship;
  label: string;
}

interface StudentFormData {
  name: string;
  phone: string;
  birthDate: string;
  address: string;
  notes: string;
  contacts: StudentContact[];
}

@Component({
  selector: 'app-student-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './student-form.html',
  styleUrl: './student-form.css',
})
export class StudentForm implements OnInit {
  private readonly SAVE_TIMEOUT_MS = 45000;
  private readonly MIN_STUDENT_AGE = 11;
  private readonly MAX_STUDENT_AGE = 20;

  private fb = inject(FormBuilder);
  private studentService = inject(StudentService);
  private userService = inject(UserService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Estados reactivos
  mode = signal<FormMode>('create');
  studentId = signal<string | null>(null);
  isSubmitting = signal(false);
  submitError = signal<string | null>(null);
  submitSuccess = signal(false);

  // Título del formulario
  formTitle = computed(() => (this.mode() === 'create' ? 'Nuevo Estudiante' : 'Editar Estudiante'));

  // Botón de envío
  submitButtonText = computed(() =>
    this.mode() === 'create' ? 'Crear Estudiante' : 'Guardar Cambios',
  );

  // Opciones de relación para el select
  relationshipOptions: RelationshipOption[] = [
    { value: ContactRelationship.PADRE, label: 'Padre' },
    { value: ContactRelationship.MADRE, label: 'Madre' },
    { value: ContactRelationship.ABUELO, label: 'Abuelo/a' },
    { value: ContactRelationship.TUTOR, label: 'Tutor/a' },
    { value: ContactRelationship.OTRO, label: 'Otro' },
  ];

  // Formulario reactivo
  studentForm: FormGroup;
  readonly minAllowedBirthDate = getBirthDateBoundary(this.MIN_STUDENT_AGE);

  constructor() {
    // Inicializar formulario
    this.studentForm = createStudentForm(this.fb, this.minAllowedBirthDate, this.MAX_STUDENT_AGE);

    // Efecto para monitorear cambios en el formulario
    effect(() => {
      if (this.submitSuccess()) {
        console.log('✅ Formulario enviado exitosamente');
      }
    });
  }

  ngOnInit(): void {
    // Determinar modo del formulario según la ruta
    const studentId = this.route.snapshot.paramMap.get('id');

    if (studentId && studentId !== 'nuevo') {
      this.mode.set('edit');
      this.studentId.set(studentId);
      this.loadStudent(studentId);
    } else {
      this.mode.set('create');
    }
  }

  /**
   * Obtener FormArray de contactos
   */
  get contacts(): FormArray {
    return getContactsFormArray(this.studentForm);
  }

  /**
   * Agregar nuevo contacto
   */
  addContact(): void {
    this.contacts.push(createContactFormGroup(this.fb));
  }

  /**
   * Remover contacto por índice
   */
  removeContact(index: number): void {
    if (this.contacts.length > 1) {
      this.contacts.removeAt(index);
    }
  }

  /**
   * Marcar un contacto como principal y desmarcar los demás
   */
  setMainContact(index: number): void {
    this.contacts.controls.forEach((control, i) => {
      control.get('isMain')?.setValue(i === index);
    });
  }

  /**
   * Cargar datos del estudiante para edición
   */
  private loadStudent(studentId: string): void {
    this.studentService.getStudentById(studentId).subscribe({
      next: (student) => {
        if (student) {
          this.populateForm(student);
        } else {
          this.submitError.set('Estudiante no encontrado');
          this.router.navigate(['/dashboard/estudiantes']);
        }
      },
      error: (error) => {
        console.error('Error al cargar estudiante:', error);
        this.submitError.set('Error al cargar datos del estudiante');
      },
    });
  }

  /**
   * Poblar formulario con datos del estudiante
   */
  private populateForm(student: Student): void {
    this.studentForm.patchValue({
      name: student.name,
      phone: student.phone,
      birthDate: student.birthDate || this.minAllowedBirthDate,
      address: student.address || '',
      notes: student.notes || '',
    });

    const contacts = this.normalizeContactsForForm(
      student.contacts,
      student as unknown as Record<string, unknown>,
    );

    // Caso especial: mantener el primer FormGroup evita glitches de renderizado
    if (contacts.length === 1) {
      while (this.contacts.length > 1) {
        this.contacts.removeAt(this.contacts.length - 1);
      }

      if (this.contacts.length === 0) {
        this.contacts.push(createContactFormGroup(this.fb, contacts[0]));
      } else {
        this.contacts.at(0).patchValue(contacts[0]);
      }
      return;
    }

    // Múltiples contactos: reemplazar completamente
    this.contacts.clear();
    contacts.forEach((contact) => {
      this.contacts.push(createContactFormGroup(this.fb, contact));
    });

    // Asegurar al menos un contacto si no hay ninguno
    if (this.contacts.length === 0) {
      this.contacts.push(createContactFormGroup(this.fb));
    }
  }

  /**
   * Normaliza contactos para evitar fallos con datos incompletos/legacy.
   */
  private normalizeContactsForForm(
    contacts: unknown,
    fallbackSource?: Record<string, unknown>,
  ): StudentContact[] {
    const source = Array.isArray(contacts)
      ? contacts
      : this.extractContactsFallback(fallbackSource);

    return source.filter((contact): contact is StudentContact => {
      if (!contact || typeof contact !== 'object') {
        return false;
      }

      const candidate = contact as Partial<StudentContact>;
      return (
        typeof candidate.name === 'string' &&
        candidate.name.trim() !== '' &&
        typeof candidate.phone === 'string' &&
        candidate.phone.trim() !== ''
      );
    });
  }

  /**
   * Fallback para formatos de contacto legacy a nivel del formulario.
   */
  private extractContactsFallback(source?: Record<string, unknown>): unknown[] {
    if (!source) {
      return [];
    }

    const candidates = [
      source['contacts'],
      source['contactos'],
      source['guardians'],
      source['tutors'],
      source['responsables'],
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }

      if (candidate && typeof candidate === 'object') {
        const recordCandidate = candidate as Record<string, unknown>;

        if (this.isLikelyContactRecord(recordCandidate)) {
          return [recordCandidate];
        }

        return Object.values(candidate as Record<string, unknown>);
      }
    }

    return source['contact'] ? [source['contact']] : [];
  }

  /**
   * Determina si un objeto parece un único contacto y no un mapa de contactos.
   */
  private isLikelyContactRecord(value: Record<string, unknown>): boolean {
    const contactKeys = [
      'name',
      'nombre',
      'fullName',
      'contactName',
      'phone',
      'telefono',
      'phoneNumber',
      'relationship',
      'parentesco',
    ];

    return Object.keys(value).some((key) => contactKeys.includes(key));
  }

  /**
   * Enviar formulario - Guardar y volver
   */
  onSubmit(): void {
    if (this.studentForm.valid) {
      this.saveStudent(false);
    } else {
      this.markFormGroupTouched(this.studentForm);
      this.submitError.set('Por favor, corrija los errores en el formulario');
    }
  }

  /**
   * Guardar y continuar agregando
   */
  onSubmitAndContinue(): void {
    if (this.studentForm.valid) {
      this.saveStudent(true);
    } else {
      this.markFormGroupTouched(this.studentForm);
      this.submitError.set('Por favor, corrija los errores en el formulario');
    }
  }

  /**
   * Guardar estudiante
   */
  private saveStudent(continueAdding: boolean): void {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.submitError.set('No hay conexion a internet. Verifique su red e intente nuevamente.');
      this.isSubmitting.set(false);
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);

    const formData = this.studentForm.getRawValue() as StudentFormData;

    if (!formData.contacts || formData.contacts.length === 0) {
      this.isSubmitting.set(false);
      this.submitError.set('Debe agregar al menos un contacto');
      return;
    }

    // Asegurar que hay al menos un contacto principal
    const hasMainContact = formData.contacts.some((c: StudentContact) => c.isMain);
    if (!hasMainContact && formData.contacts.length > 0) {
      formData.contacts[0].isMain = true;
    }

    if (this.mode() === 'create') {
      this.createStudent(formData, continueAdding);
    } else {
      this.updateStudent(formData);
    }
  }

  /**
   * Crear nuevo estudiante
   */
  private createStudent(formData: StudentFormData, continueAdding: boolean): void {
    // Debug: Verificar estado de autenticación
    console.log('🔐 Verificando autenticación antes de guardar...');
    console.log('Usuario actual:', this.userService.user());
    console.log('Auth UID:', this.userService.user()?.uid);

    this.studentService
      .createStudent(formData)
      .pipe(
        timeout(this.SAVE_TIMEOUT_MS),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: (studentId) => {
          console.log('✅ Estudiante creado con ID:', studentId);
          this.submitSuccess.set(true);

          if (continueAdding) {
            // Reset formulario y mantener en la página
            this.studentForm.reset({
              name: '',
              phone: '',
              birthDate: this.minAllowedBirthDate,
              address: '',
              notes: '',
            });
            this.contacts.clear();
            this.addContact();
            this.submitSuccess.set(false);

            // Scroll al inicio
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            // Navegar de inmediato a la lista para evitar espera percibida
            void this.router.navigate(['/dashboard/estudiantes']);
          }
        },
        error: (error) => {
          console.error('❌ Error al crear estudiante:', error);
          console.error('📋 Error details:', {
            name: error?.name,
            code: error?.code,
            message: error?.message,
            fullError: error,
          });

          this.submitError.set(
            error?.name === 'TimeoutError'
              ? 'No se pudo confirmar el guardado por conexion lenta. Revise la lista de estudiantes y luego intente nuevamente.'
              : `Error al crear el estudiante: ${error?.code || error?.message || 'Error desconocido'}`,
          );
        },
      });
  }

  /**
   * Actualizar estudiante existente
   */
  private updateStudent(formData: StudentFormData): void {
    const studentId = this.studentId();
    if (!studentId) {
      this.isSubmitting.set(false);
      this.submitError.set('No se pudo identificar el estudiante a actualizar');
      return;
    }

    this.studentService
      .updateStudent(studentId, formData)
      .pipe(
        timeout(this.SAVE_TIMEOUT_MS),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: () => {
          console.log('✅ Estudiante actualizado');
          this.submitSuccess.set(true);

          // En modo edición, volver de inmediato a la lista
          void this.router.navigate(['/dashboard/estudiantes']);
        },
        error: (error) => {
          console.error('❌ Error al actualizar estudiante:', error);
          console.error('📋 Error details:', {
            name: error?.name,
            code: error?.code,
            message: error?.message,
            fullError: error,
          });

          this.submitError.set(
            error?.name === 'TimeoutError'
              ? 'No se pudo confirmar el guardado por conexion lenta. Revise la lista de estudiantes y luego intente nuevamente.'
              : `Error al actualizar el estudiante: ${error?.code || error?.message || 'Error desconocido'}`,
          );
        },
      });
  }

  /**
   * Marcar todos los campos como touched para mostrar errores
   */
  private markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Cancelar y volver
   */
  cancel(): void {
    if (this.studentForm.dirty) {
      const confirm = window.confirm(
        '¿Está seguro de que desea cancelar? Los cambios no guardados se perderán.',
      );
      if (confirm) {
        this.router.navigate(['/dashboard/estudiantes']);
      }
    } else {
      this.router.navigate(['/dashboard/estudiantes']);
    }
  }

  /**
   * Verificar si un campo tiene error
   */
  hasError(fieldName: string): boolean {
    const field = this.studentForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Obtener mensaje de error para un campo
   */
  getErrorMessage(fieldName: string): string {
    const field = this.studentForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'Este campo es requerido';
    if (field.errors['minlength'])
      return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    if (field.errors['maxlength'])
      return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
    if (field.errors['futureDate']) return 'La fecha no puede ser futura';
    if (field.errors['tooYoung']) return `El estudiante debe tener al menos ${this.MIN_STUDENT_AGE} años`;
    if (field.errors['tooOld']) return `El estudiante debe tener ${this.MAX_STUDENT_AGE} años o menos`;
    if (field.errors['invalidPhone']) return 'Teléfono inválido';
    if (field.errors['tooShort']) return 'Mínimo 8 dígitos';

    return 'Campo inválido';
  }

  /**
   * Verificar si un campo de contacto tiene error
   */
  hasContactError(index: number, fieldName: string): boolean {
    const field = this.contacts.at(index).get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Obtener mensaje de error para campo de contacto
   */
  getContactErrorMessage(index: number, fieldName: string): string {
    const field = this.contacts.at(index).get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'Requerido';
    if (field.errors['minlength']) return `Mín. ${field.errors['minlength'].requiredLength}`;
    if (field.errors['maxlength']) return `Máx. ${field.errors['maxlength'].requiredLength}`;
    if (field.errors['invalidPhone']) return 'Teléfono inválido';
    if (field.errors['tooShort']) return 'Mínimo 8 dígitos';

    return 'Inválido';
  }

  /**
   * Track by para contactos
   */
  trackByIndex(index: number): number {
    return index;
  }
}
