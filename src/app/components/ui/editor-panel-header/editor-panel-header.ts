import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-editor-panel-header',
  templateUrl: './editor-panel-header.html',
  styleUrl: './editor-panel-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorPanelHeader {
  title = input.required<string>();
  subtitle = input('');
  closeLabel = input('Cerrar editor');
  closeDisabled = input(false);

  closeClick = output<void>();

  onClose(): void {
    if (this.closeDisabled()) {
      return;
    }

    this.closeClick.emit();
  }
}
