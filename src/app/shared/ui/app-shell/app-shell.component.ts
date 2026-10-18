import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-app-shell',
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  sidebarCollapsed = input(false);
  mobileMenuOpen = input(false);
  overlayClick = output<void>();

  onOverlayClick(): void {
    this.overlayClick.emit();
  }
}
