import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeacherNames } from '../../../core/models/enums';
import { EditableTeacher, TeacherFieldChange, TeacherNameChange } from '../configuracion.types';

@Component({
  selector: 'app-configuracion-teachers-panel',
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracion-teachers-panel.html',
  styleUrl: './configuracion-teachers-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfiguracionTeachersPanel {
  teachers = input.required<EditableTeacher[]>();
  teachersMessage = input<string | null>(null);
  hasTeachers = input(false);
  teachersSaving = input(false);
  isLoading = input(false);
  availableTeacherOptionsCount = input(0);
  availableTeacherNames = input.required<TeacherNames[]>();

  addTeacher = output<void>();
  removeTeacher = output<number>();
  updateTeacherName = output<TeacherNameChange>();
  updateTeacherField = output<TeacherFieldChange>();
  saveTeachers = output<void>();

  trackByTeacher(index: number, teacher: EditableTeacher): string {
    return `${teacher.name}-${index}`;
  }

  canUseTeacherName(name: TeacherNames, currentName: TeacherNames): boolean {
    return name === currentName || !this.teachers().some(teacher => teacher.name === name);
  }

  onAddTeacher(): void {
    this.addTeacher.emit();
  }

  onRemoveTeacher(index: number): void {
    this.removeTeacher.emit(index);
  }

  onUpdateTeacherName(index: number, name: TeacherNames): void {
    this.updateTeacherName.emit({ index, name });
  }

  onUpdateTeacherField<K extends keyof EditableTeacher>(
    index: number,
    field: K,
    value: EditableTeacher[K]
  ): void {
    this.updateTeacherField.emit({ index, field, value });
  }

  onSaveTeachers(): void {
    this.saveTeachers.emit();
  }
}