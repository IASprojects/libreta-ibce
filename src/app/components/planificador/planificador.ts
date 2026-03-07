import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PlannedLessonList } from './planned-lesson-list/planned-lesson-list';

@Component({
  selector: 'app-planificador',
  imports: [PlannedLessonList],
  templateUrl: './planificador.html',
  styleUrl: './planificador.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Planificador {}
