import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Topbar {
  title = input('Dashboard');
  eyebrow = input('Libreta IBCE');
  mobileMenuOpen = input(false);
  sidebarCollapsed = input(false);

  mobileMenuToggle = output<void>();
  sidebarToggle = output<void>();

  onMobileMenuToggle(): void {
    this.mobileMenuToggle.emit();
  }

  onSidebarToggle(): void {
    this.sidebarToggle.emit();
  }
}
