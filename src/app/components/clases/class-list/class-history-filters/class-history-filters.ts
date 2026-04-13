import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FilterBar } from '../../../ui/filter-bar/filter-bar';

@Component({
  selector: 'app-class-history-filters',
  imports: [FilterBar],
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

  showMobileFilters = signal(false);

  onTeacherChange(value: string): void {
    this.filterTeacherChange.emit(value);
  }

  onPeriodChange(value: string): void {
    this.filterPeriodChange.emit(value);
    this.closeMobileFilters();
  }

  onSearchChange(value: string): void {
    this.searchTermChange.emit(value);
  }

  onClearSearch(): void {
    this.searchClear.emit();
  }

  onClearFilters(): void {
    this.filtersClear.emit();
    this.closeMobileFilters();
  }

  toggleMobileFilters(): void {
    this.showMobileFilters.update(current => !current);
  }

  closeMobileFilters(): void {
    this.showMobileFilters.set(false);
  }
}
