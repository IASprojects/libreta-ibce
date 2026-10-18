import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PlannedLessonList } from './planned-lesson-list/planned-lesson-list';

@Component({
  selector: 'app-planner',
  imports: [PlannedLessonList],
  templateUrl: './planner.component.html',
  styleUrl: './planner.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlannerComponent {}
