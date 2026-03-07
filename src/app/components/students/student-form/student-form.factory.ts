import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContactRelationship } from '../../../core/models/enums';
import { StudentContact } from '../../../core/models/student.model';
import { birthDateValidator, phoneValidator } from './student-form.validators';

/**
 * Crea el formulario principal del estudiante.
 */
export function createStudentForm(
  fb: FormBuilder,
  minAllowedBirthDate: string,
  maxStudentAge: number
): FormGroup {
  return fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    phone: ['', [Validators.required, phoneValidator]],
    birthDate: [
      minAllowedBirthDate,
      [
        Validators.required,
        (control: AbstractControl) => birthDateValidator(control, minAllowedBirthDate, maxStudentAge)
      ]
    ],
    address: ['', [Validators.maxLength(200)]],
    notes: ['', [Validators.maxLength(500)]],
    contacts: fb.array([], [Validators.required, Validators.minLength(1)])
  });
}

/**
 * Crea un FormGroup para un contacto/tutor.
 */
export function createContactFormGroup(fb: FormBuilder, contact?: StudentContact): FormGroup {
  return fb.group({
    name: [contact?.name || '', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    relationship: [contact?.relationship || ContactRelationship.PADRE, [Validators.required]],
    phone: [contact?.phone || '', [Validators.required, phoneValidator]],
    isMain: [contact?.isMain || false]
  });
}

/**
 * Convierte el control contacts a FormArray con tipo seguro.
 */
export function getContactsFormArray(form: FormGroup): FormArray {
  return form.get('contacts') as FormArray;
}
