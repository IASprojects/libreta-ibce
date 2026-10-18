import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent {
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
