import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-topbar',
  imports: [ThemeToggleComponent],
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
