import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-filter-bar',
  templateUrl: './filter-bar.html',
  styleUrl: './filter-bar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape()'
  }
})
export class FilterBar {
  mobileOpen = input(false);
  mobileTitle = input('Filtros');

  toggleMobile = output<void>();
  closeMobile = output<void>();
  applyMobile = output<void>();

  onToggleMobile(): void {
    this.toggleMobile.emit();
  }

  onCloseMobile(): void {
    this.closeMobile.emit();
  }

  onApplyMobile(): void {
    this.applyMobile.emit();
  }

  onEscape(): void {
    if (this.mobileOpen()) {
      this.closeMobile.emit();
    }
  }
}
