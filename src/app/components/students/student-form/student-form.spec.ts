import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { StudentForm } from './student-form';
import { StudentService } from '../../../services/student.service';
import { UserService } from '../../../services/user.service';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { ContactRelationship } from '../../../core/models/enums';

describe('StudentForm', () => {
  let component: StudentForm;
  let fixture: ComponentFixture<StudentForm>;
  let mockStudentService: Partial<StudentService>;
  let mockUserService: Partial<UserService>;

  beforeEach(async () => {
    mockStudentService = {
      createStudent: vi.fn(),
      updateStudent: vi.fn(),
      getStudentById: vi.fn()
    };
    
    mockUserService = {
      user: signal({ uid: 'test-user', email: 'test@example.com', displayName: 'Test User', photoURL: '' })
    };

    await TestBed.configureTestingModule({
      imports: [StudentForm, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: StudentService, useValue: mockStudentService },
        { provide: UserService, useValue: mockUserService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with create mode by default', () => {
    expect(component.mode()).toBe('create');
  });

  it('should initialize form with one contact', () => {
    expect(component.contacts.length).toBe(1);
  });

  it('should add new contact', () => {
    const initialLength = component.contacts.length;
    component.addContact();
    expect(component.contacts.length).toBe(initialLength + 1);
  });

  it('should remove contact when more than one exists', () => {
    component.addContact();
    component.addContact();
    const initialLength = component.contacts.length;
    component.removeContact(0);
    expect(component.contacts.length).toBe(initialLength - 1);
  });

  it('should not remove contact when only one exists', () => {
    component.removeContact(0);
    expect(component.contacts.length).toBe(1);
  });

  it('should set main contact correctly', () => {
    component.addContact();
    component.addContact();
    
    component.setMainContact(1);
    
    expect(component.contacts.at(0).get('isMain')?.value).toBe(false);
    expect(component.contacts.at(1).get('isMain')?.value).toBe(true);
    expect(component.contacts.at(2).get('isMain')?.value).toBe(false);
  });

  it('should validate required fields', () => {
    const form = component.studentForm;
    
    expect(form.valid).toBeFalsy();
    
    form.patchValue({
      name: 'Juan Pérez',
      phone: '8888-7777',
      birthDate: '2015-01-01'
    });
    
    component.contacts.at(0).patchValue({
      name: 'María Pérez',
      relationship: ContactRelationship.MADRE,
      phone: '12345678',
      isMain: true
    });
    
    expect(form.valid).toBeTruthy();
  });

  it('should validate phone format', () => {
    const phoneControl = component.contacts.at(0).get('phone');
    
    phoneControl?.setValue('123');
    expect(phoneControl?.hasError('invalidPhone')).toBeTruthy();
    
    phoneControl?.setValue('12345678');
    expect(phoneControl?.valid).toBeTruthy();
    
    phoneControl?.setValue('+506 1234-5678');
    expect(phoneControl?.valid).toBeTruthy();
  });

  it('should validate birth date is not in future', () => {
    const birthDateControl = component.studentForm.get('birthDate');
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    
    birthDateControl?.setValue(futureDate.toISOString().split('T')[0]);
    expect(birthDateControl?.hasError('futureDate')).toBeTruthy();
  });

  it('should validate birth date is not older than allowed range', () => {
    const birthDateControl = component.studentForm.get('birthDate');
    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 21);

    birthDateControl?.setValue(oldDate.toISOString().split('T')[0]);
    expect(birthDateControl?.hasError('tooOld')).toBeTruthy();
  });

  it('should create student successfully', () => {
    vi.mocked(mockStudentService.createStudent!).mockReturnValue(of('new-student-id'));
    
    component.studentForm.patchValue({
      name: 'Juan Pérez',
      phone: '8888-7777',
      birthDate: '2015-01-01'
    });
    
    component.contacts.at(0).patchValue({
      name: 'María Pérez',
      relationship: ContactRelationship.MADRE,
      phone: '12345678',
      isMain: true
    });
    
    component.onSubmit();
    
    expect(mockStudentService.createStudent).toHaveBeenCalled();
  });

  it('should handle create error', () => {
    vi.mocked(mockStudentService.createStudent!).mockReturnValue(
      throwError(() => new Error('Create failed'))
    );
    
    component.studentForm.patchValue({
      name: 'Juan Pérez',
      phone: '8888-7777',
      birthDate: '2015-01-01'
    });
    
    component.contacts.at(0).patchValue({
      name: 'María Pérez',
      relationship: ContactRelationship.MADRE,
      phone: '12345678',
      isMain: true
    });
    
    component.onSubmit();
    
    expect(component.submitError()).toBeTruthy();
  });

  it('should prevent save when contacts are empty', () => {
    vi.mocked(mockStudentService.createStudent!).mockReturnValue(of('new-student-id'));

    component.studentForm.patchValue({
      name: 'Juan Pérez',
      phone: '8888-7777',
      birthDate: '2015-01-01'
    });

    component.contacts.clear();
    component.onSubmit();

    expect(component.submitError()).toContain('corrija los errores en el formulario');
    expect(mockStudentService.createStudent).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
  });

  it('should show error and stop submitting when edit mode has no student id', () => {
    component.mode.set('edit');
    component.studentId.set(null);

    component.studentForm.patchValue({
      name: 'Juan Pérez',
      phone: '8888-7777',
      birthDate: '2015-01-01'
    });

    component.contacts.at(0).patchValue({
      name: 'María Pérez',
      relationship: ContactRelationship.MADRE,
      phone: '12345678',
      isMain: true
    });

    component.onSubmit();

    expect(component.submitError()).toContain('identificar el estudiante');
    expect(mockStudentService.updateStudent).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
  });

  it('should get correct error messages', () => {
    const nameControl = component.studentForm.get('name');
    
    nameControl?.setErrors({ required: true });
    nameControl?.markAsTouched();
    expect(component.getErrorMessage('name')).toContain('requerido');
    
    nameControl?.setErrors({ minlength: { requiredLength: 2, actualLength: 1 } });
    expect(component.getErrorMessage('name')).toContain('Mínimo');
  });

  it('should track contacts by index', () => {
    expect(component.trackByIndex(0)).toBe(0);
    expect(component.trackByIndex(5)).toBe(5);
  });
});
