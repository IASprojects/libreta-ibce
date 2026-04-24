import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditableLesson, EditableUnit, LessonFieldChange, LessonRemove, UnitFieldChange } from '../configuracion.types';

@Component({
  selector: 'app-configuracion-catalog-panel',
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracion-catalog-panel.html',
  styleUrl: './configuracion-catalog-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfiguracionCatalogPanel {
  lessonCatalog = input.required<EditableUnit[]>();
  catalogMessage = input<string | null>(null);
  hasLessonCatalog = input(false);
  catalogSaving = input(false);
  isLoading = input(false);

  addUnit = output<void>();
  removeUnit = output<number>();
  updateUnitField = output<UnitFieldChange>();
  addLesson = output<number>();
  removeLesson = output<LessonRemove>();
  updateLessonField = output<LessonFieldChange>();
  saveLessonCatalog = output<void>();

  trackByUnit(index: number, unit: EditableUnit): string {
    return `${unit.unitNumber || 'new'}-${index}`;
  }

  trackByLesson(index: number, lesson: EditableLesson): string {
    return `${lesson.lessonNumber || 'new'}-${index}`;
  }

  onAddUnit(): void {
    this.addUnit.emit();
  }

  onRemoveUnit(index: number): void {
    this.removeUnit.emit(index);
  }

  onUpdateUnitField<K extends keyof EditableUnit>(index: number, field: K, value: EditableUnit[K]): void {
    this.updateUnitField.emit({ index, field, value });
  }

  onAddLesson(unitIndex: number): void {
    this.addLesson.emit(unitIndex);
  }

  onRemoveLesson(unitIndex: number, lessonIndex: number): void {
    this.removeLesson.emit({ unitIndex, lessonIndex });
  }

  onUpdateLessonField<K extends keyof EditableLesson>(
    unitIndex: number,
    lessonIndex: number,
    field: K,
    value: EditableLesson[K]
  ): void {
    this.updateLessonField.emit({ unitIndex, lessonIndex, field, value });
  }

  onSaveLessonCatalog(): void {
    this.saveLessonCatalog.emit();
  }
}