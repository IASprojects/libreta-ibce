import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-app-shell',
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShell {
  sidebarCollapsed = input(false);
  mobileMenuOpen = input(false);
  overlayClick = output<void>();

  onOverlayClick(): void {
    this.overlayClick.emit();
  }
}
