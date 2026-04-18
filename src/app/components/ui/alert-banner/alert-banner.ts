import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-alert-banner',
  templateUrl: './alert-banner.html',
  styleUrl: './alert-banner.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertBanner {
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
