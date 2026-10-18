import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ClassListComponent } from './class-list/class-list.component';

@Component({
  selector: 'app-classes',
  imports: [ClassListComponent],
  templateUrl: './classes.component.html',
  styleUrl: './classes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassesComponent {}
