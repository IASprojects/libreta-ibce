import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Convierte un string YYYY-MM-DD a Date sin sesgos de zona horaria.
 */
export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Calcula la fecha límite en formato YYYY-MM-DD usando 01/01/(año actual - edad).
 */
export function getBirthDateBoundary(age: number): string {
  const year = new Date().getFullYear() - age;
  return `${year}-01-01`;
}

/**
 * Validador de fecha de nacimiento por rango de edad.
 */
export function birthDateValidator(
  control: AbstractControl,
  minAllowedBirthDate: string,
  maxStudentAge: number
): ValidationErrors | null {
  if (!control.value) {
    return null;
  }

  const birthDate = new Date(control.value);
  const today = new Date();
  const maxDate = parseDateOnly(minAllowedBirthDate);
  const minDate = parseDateOnly(getBirthDateBoundary(maxStudentAge));

  if (birthDate > today) {
    return { futureDate: true };
  }

  if (birthDate > maxDate) {
    return { tooYoung: true };
  }

  if (birthDate < minDate) {
    return { tooOld: true };
  }

  return null;
}

/**
 * Validador de teléfono con formato flexible.
 */
export function phoneValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null;
  }

  const phoneRegex = /^[\d\s\-\+\(\)]{8,20}$/;
  if (!phoneRegex.test(control.value)) {
    return { invalidPhone: true };
  }

  const digitsOnly = control.value.replace(/\D/g, '');
  if (digitsOnly.length < 8) {
    return { tooShort: true };
  }

  return null;
}
