import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ClassList } from './class-list/class-list';

@Component({
  selector: 'app-classes',
  imports: [ClassList],
  templateUrl: './classes.component.html',
  styleUrl: './classes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassesComponent {}
