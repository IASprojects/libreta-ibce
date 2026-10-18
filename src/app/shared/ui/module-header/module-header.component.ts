import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-module-header',
  templateUrl: './module-header.component.html',
  styleUrl: './module-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModuleHeaderComponent {
  title = input.required<string>();
  subtitle = input('');
  eyebrow = input('');
}
