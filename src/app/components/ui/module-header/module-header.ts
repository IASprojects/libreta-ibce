import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-module-header',
  templateUrl: './module-header.html',
  styleUrl: './module-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModuleHeader {
  title = input.required<string>();
  subtitle = input('');
  eyebrow = input('');
}
