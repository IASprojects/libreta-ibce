import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-class-history-filters',
  templateUrl: './class-history-filters.html',
  styleUrl: './class-history-filters.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassHistoryFilters {
  filterTeacher = input('all');
  filterPeriod = input('all');
  searchTerm = input('');
  uniqueTeachers = input<string[]>([]);
  showClearFilters = input(false);

  filterTeacherChange = output<string>();
  filterPeriodChange = output<string>();
  searchTermChange = output<string>();
  searchClear = output<void>();
  filtersClear = output<void>();

  onTeacherChange(value: string): void {
    this.filterTeacherChange.emit(value);
  }

  onPeriodChange(value: string): void {
    this.filterPeriodChange.emit(value);
  }

  onSearchChange(value: string): void {
    this.searchTermChange.emit(value);
  }

  onClearSearch(): void {
    this.searchClear.emit();
  }

  onClearFilters(): void {
    this.filtersClear.emit();
  }
}
