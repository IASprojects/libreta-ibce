import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FilterBarComponent } from '../../../../shared/ui/filter-bar/filter-bar.component';

@Component({
  selector: 'app-planned-lesson-filters',
  imports: [FilterBarComponent],
  templateUrl: './planned-lesson-filters.component.html',
  styleUrl: './planned-lesson-filters.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlannedLessonFiltersComponent {
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
