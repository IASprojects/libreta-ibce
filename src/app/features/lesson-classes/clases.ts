import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ClassList } from './class-list/class-list';

@Component({
  selector: 'app-clases',
  imports: [ClassList],
  templateUrl: './clases.html',
  styleUrl: './clases.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Clases {}
