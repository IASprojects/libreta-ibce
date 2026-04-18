import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FilterBar } from '../../../ui/filter-bar/filter-bar';

@Component({
  selector: 'app-planned-lesson-filters',
  imports: [FilterBar],
  templateUrl: './planned-lesson-filters.html',
  styleUrl: './planned-lesson-filters.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlannedLessonFilters {
  showMobileFilters = input(false);
  filterTeacher = input('all');
  filterDate = input('all');
  searchTerm = input('');
  uniqueTeachers = input<string[]>([]);
  showClearFilters = input(false);
  showResultsText = input(false);
  totalFiltered = input(0);

  searchChange = output<string>();
  clearSearchClick = output<void>();
  filterTeacherChange = output<string>();
  filterDateChange = output<string>();
  clearFiltersClick = output<void>();
  toggleMobileFiltersClick = output<void>();
  closeMobileFiltersClick = output<void>();

  onSearchChange(value: string): void {
    this.searchChange.emit(value);
  }

  onClearSearch(): void {
    this.clearSearchClick.emit();
  }

  onFilterTeacherChange(value: string): void {
    this.filterTeacherChange.emit(value);
  }

  onFilterDateChange(value: string): void {
    this.filterDateChange.emit(value);
  }

  onClearFilters(): void {
    this.clearFiltersClick.emit();
  }

  onToggleMobileFilters(): void {
    this.toggleMobileFiltersClick.emit();
  }

  onCloseMobileFilters(): void {
    this.closeMobileFiltersClick.emit();
  }
}
