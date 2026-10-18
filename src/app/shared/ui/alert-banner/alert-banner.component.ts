import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-alert-banner',
  templateUrl: './alert-banner.component.html',
  styleUrl: './alert-banner.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertBannerComponent {
  variant = input<'error' | 'success'>('success');
  title = input('');
  message = input.required<string>();
  dismissLabel = input('Cerrar alerta');

  dismissed = output<void>();

  icon = computed(() => (this.variant() === 'error' ? '⚠️' : '✅'));
  role = computed(() => (this.variant() === 'error' ? 'alert' : 'status'));

  onDismiss(): void {
    this.dismissed.emit();
  }
}
