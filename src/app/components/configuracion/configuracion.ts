import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeacherNames } from '../../core/models/enums';
import { LessonCatalogUnit } from '../../core/models/app-config.model';
import { AppConfigService } from '../../services/app-config.service';
import {
  EditableLesson,
  EditableTeacher,
  EditableUnit,
  LessonFieldChange,
  LessonRemove,
  TeacherFieldChange,
  TeacherNameChange,
  UnitFieldChange,
} from './configuracion.types';
import { ConfiguracionTeachersPanel } from './configuracion-teachers-panel/configuracion-teachers-panel';
import { ConfiguracionCatalogPanel } from './configuracion-catalog-panel/configuracion-catalog-panel';

@Component({
  selector: 'app-configuracion',
  imports: [CommonModule, ConfiguracionTeachersPanel, ConfiguracionCatalogPanel],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Configuracion {
  private appConfigService = inject(AppConfigService);

  readonly availableTeacherNames = Object.values(TeacherNames);
  readonly config = this.appConfigService.config;
  readonly isLoading = this.appConfigService.isLoading;
  readonly serviceError = this.appConfigService.error;

  teachers = signal<EditableTeacher[]>([]);
  lessonCatalog = signal<EditableUnit[]>([]);

  teachersDirty = signal(false);
  catalogDirty = signal(false);
  teachersSaving = signal(false);
  catalogSaving = signal(false);
  teachersMessage = signal<string | null>(null);
  catalogMessage = signal<string | null>(null);

  availableTeacherOptions = computed(() => {
    const selectedNames = new Set(this.teachers().map(teacher => teacher.name));
    return this.availableTeacherNames.filter(name => !selectedNames.has(name));
  });

  hasTeachers = computed(() => this.teachers().length > 0);
  hasLessonCatalog = computed(() => this.lessonCatalog().length > 0);

  constructor() {
    effect(() => {
      const config = this.config();
      if (!config) {
        return;
      }

      if (!this.teachersDirty()) {
        this.teachers.set(
          (config.teachers ?? []).map(teacher => ({
            ...teacher,
            phone: teacher.phone || '',
            email: teacher.email || '',
            joinedAt: teacher.joinedAt || this.getTodayString()
          }))
        );
      }

      if (!this.catalogDirty()) {
        this.lessonCatalog.set(
          (config.lessonCatalog ?? []).map(unit => ({
            unitNumber: unit.unitNumber || '',
            unitTitle: unit.unitTitle || '',
            isActive: unit.isActive,
            lessons: (unit.lessons ?? []).map(lesson => ({
              lessonNumber: lesson.lessonNumber || '',
              lessonTitle: lesson.lessonTitle || '',
              isActive: lesson.isActive
            }))
          }))
        );
      }
    });
  }

  addTeacher(): void {
    const nextName = this.availableTeacherOptions()[0];
    if (!nextName) {
      this.teachersMessage.set('No hay más nombres de maestros disponibles en la configuración actual.');
      return;
    }

    this.teachers.update(teachers => [
      ...teachers,
      {
        id: nextName,
        name: nextName,
        phone: '',
        email: '',
        isActive: true,
        joinedAt: this.getTodayString()
      }
    ]);

    this.teachersDirty.set(true);
    this.teachersMessage.set(null);
  }

  removeTeacher(index: number): void {
    this.teachers.update(teachers => teachers.filter((_, currentIndex) => currentIndex !== index));
    this.teachersDirty.set(true);
    this.teachersMessage.set(null);
  }

  updateTeacherName(index: number, name: TeacherNames): void {
    this.teachers.update(teachers =>
      teachers.map((teacher, currentIndex) =>
        currentIndex === index
          ? { ...teacher, id: name, name }
          : teacher
      )
    );
    this.teachersDirty.set(true);
    this.teachersMessage.set(null);
  }

  updateTeacherField<K extends keyof EditableTeacher>(index: number, field: K, value: EditableTeacher[K]): void {
    this.teachers.update(teachers =>
      teachers.map((teacher, currentIndex) =>
        currentIndex === index
          ? { ...teacher, [field]: value }
          : teacher
      )
    );
    this.teachersDirty.set(true);
    this.teachersMessage.set(null);
  }

  async saveTeachers(): Promise<void> {
    this.teachersMessage.set(null);

    const normalizedTeachers = this.teachers().map(teacher => ({
      ...teacher,
      id: teacher.name,
      phone: teacher.phone.trim(),
      email: (teacher.email || '').trim(),
      joinedAt: teacher.joinedAt || this.getTodayString()
    }));

    const duplicateNames = normalizedTeachers.filter(
      (teacher, index, teachers) => teachers.findIndex(current => current.name === teacher.name) !== index
    );

    if (duplicateNames.length > 0) {
      this.teachersMessage.set('No puede haber maestros duplicados.');
      return;
    }

    this.teachersSaving.set(true);
    try {
      await this.appConfigService.saveTeachers(normalizedTeachers);
      this.teachersDirty.set(false);
      this.teachersMessage.set('Maestros guardados correctamente.');
    } catch {
      this.teachersMessage.set('No se pudieron guardar los maestros.');
    } finally {
      this.teachersSaving.set(false);
    }
  }

  addUnit(): void {
    this.lessonCatalog.update(units => [
      ...units,
      {
        unitNumber: '',
        unitTitle: '',
        isActive: true,
        lessons: []
      }
    ]);
    this.catalogDirty.set(true);
    this.catalogMessage.set(null);
  }

  removeUnit(index: number): void {
    this.lessonCatalog.update(units => units.filter((_, currentIndex) => currentIndex !== index));
    this.catalogDirty.set(true);
    this.catalogMessage.set(null);
  }

  updateUnitField<K extends keyof EditableUnit>(index: number, field: K, value: EditableUnit[K]): void {
    this.lessonCatalog.update(units =>
      units.map((unit, currentIndex) =>
        currentIndex === index
          ? { ...unit, [field]: value }
          : unit
      )
    );
    this.catalogDirty.set(true);
    this.catalogMessage.set(null);
  }

  addLesson(unitIndex: number): void {
    this.lessonCatalog.update(units =>
      units.map((unit, currentIndex) =>
        currentIndex === unitIndex
          ? {
              ...unit,
              lessons: [
                ...unit.lessons,
                {
                  lessonNumber: '',
                  lessonTitle: '',
                  isActive: true
                }
              ]
            }
          : unit
      )
    );
    this.catalogDirty.set(true);
    this.catalogMessage.set(null);
  }

  removeLesson(unitIndex: number, lessonIndex: number): void {
    this.lessonCatalog.update(units =>
      units.map((unit, currentIndex) =>
        currentIndex === unitIndex
          ? { ...unit, lessons: unit.lessons.filter((_, currentLessonIndex) => currentLessonIndex !== lessonIndex) }
          : unit
      )
    );
    this.catalogDirty.set(true);
    this.catalogMessage.set(null);
  }

  updateLessonField<K extends keyof EditableLesson>(
    unitIndex: number,
    lessonIndex: number,
    field: K,
    value: EditableLesson[K]
  ): void {
    this.lessonCatalog.update(units =>
      units.map((unit, currentUnitIndex) => {
        if (currentUnitIndex !== unitIndex) {
          return unit;
        }

        return {
          ...unit,
          lessons: unit.lessons.map((lesson, currentLessonIndex) =>
            currentLessonIndex === lessonIndex
              ? { ...lesson, [field]: value }
              : lesson
          )
        };
      })
    );
    this.catalogDirty.set(true);
    this.catalogMessage.set(null);
  }

  async saveLessonCatalog(): Promise<void> {
    this.catalogMessage.set(null);

    const normalizedCatalog: LessonCatalogUnit[] = this.lessonCatalog().map(unit => ({
      unitNumber: unit.unitNumber.trim(),
      unitTitle: unit.unitTitle.trim(),
      isActive: unit.isActive,
      lessons: unit.lessons.map(lesson => ({
        lessonNumber: lesson.lessonNumber.trim(),
        lessonTitle: lesson.lessonTitle.trim(),
        isActive: lesson.isActive
      }))
    }));

    if (normalizedCatalog.some(unit => unit.unitNumber === '')) {
      this.catalogMessage.set('Cada unidad debe tener un número.');
      return;
    }

    const duplicateUnits = normalizedCatalog.filter(
      (unit, index, units) => units.findIndex(current => current.unitNumber === unit.unitNumber) !== index
    );
    if (duplicateUnits.length > 0) {
      this.catalogMessage.set('No puede haber unidades duplicadas.');
      return;
    }

    const hasInvalidLessons = normalizedCatalog.some(unit => {
      if (unit.lessons.some(lesson => lesson.lessonNumber === '')) {
        return true;
      }

      return unit.lessons.some(
        (lesson, index, lessons) => lessons.findIndex(current => current.lessonNumber === lesson.lessonNumber) !== index
      );
    });

    if (hasInvalidLessons) {
      this.catalogMessage.set('Cada lección debe tener número y no repetirse dentro de su unidad.');
      return;
    }

    this.catalogSaving.set(true);
    try {
      await this.appConfigService.saveLessonCatalog(normalizedCatalog);
      this.catalogDirty.set(false);
      this.catalogMessage.set('Catálogo guardado correctamente.');
    } catch {
      this.catalogMessage.set('No se pudo guardar el catálogo.');
    } finally {
      this.catalogSaving.set(false);
    }
  }

  handleTeacherNameChange(event: TeacherNameChange): void {
    this.updateTeacherName(event.index, event.name);
  }

  handleTeacherFieldChange(event: TeacherFieldChange): void {
    this.updateTeacherField(event.index, event.field, event.value);
  }

  handleUnitFieldChange(event: UnitFieldChange): void {
    this.updateUnitField(event.index, event.field, event.value);
  }

  handleLessonRemove(event: LessonRemove): void {
    this.removeLesson(event.unitIndex, event.lessonIndex);
  }

  handleLessonFieldChange(event: LessonFieldChange): void {
    this.updateLessonField(event.unitIndex, event.lessonIndex, event.field, event.value);
  }

  private getTodayString(): string {
    return new Date().toISOString().split('T')[0] || '2026-03-29';
  }
}
