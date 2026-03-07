import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StudentList } from './student-list';
import { StudentService } from '../../../services/student.service';
import { DateService } from '../../../services/date.service';
import { Router } from '@angular/router';
import { signal } from '@angular/core';

describe('StudentList', () => {
  let component: StudentList;
  let fixture: ComponentFixture<StudentList>;
  let mockStudentService: Partial<StudentService>;
  let mockDateService: Partial<DateService>;
  let mockRouter: Partial<Router>;

  beforeEach(async () => {
    // Mock services
    mockStudentService = {
      refresh: vi.fn(),
      isLoading: signal(false),
      error: signal(null),
      activeStudents: signal([])
    };

    mockDateService = {
      calculateAge: vi.fn(),
      isUpcomingBirthday: vi.fn(),
      getRelativeDate: vi.fn()
    };

    mockRouter = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [StudentList],
      providers: [
        { provide: StudentService, useValue: mockStudentService },
        { provide: DateService, useValue: mockDateService },
        { provide: Router, useValue: mockRouter }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty search term', () => {
    expect(component.searchTerm()).toBe('');
  });

  it('should update search term on change', () => {
    component.onSearchChange('Juan');
    expect(component.searchTerm()).toBe('Juan');
  });

  it('should clear search term', () => {
    component.onSearchChange('Pedro');
    component.clearSearch();
    expect(component.searchTerm()).toBe('');
  });

  it('should navigate to student detail', () => {
    const studentId = 'student-123';
    component.viewStudentDetail(studentId);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard/estudiantes', studentId]);
  });

  it('should navigate to add new student', () => {
    component.addNewStudent();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard/estudiantes/nuevo']);
  });

  it('should get initials from name', () => {
    expect(component.getInitials('Juan Pérez')).toBe('JP');
    expect(component.getInitials('María')).toBe('MA');
  });

  it('should call refresh on service', () => {
    component.refresh();
    expect(mockStudentService.refresh).toHaveBeenCalled();
  });
});
