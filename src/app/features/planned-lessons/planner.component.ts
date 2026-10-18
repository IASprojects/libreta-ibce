import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PlannedLessonListComponent } from './planned-lesson-list/planned-lesson-list.component';

@Component({
  selector: 'app-planner',
  imports: [PlannedLessonListComponent],
  templateUrl: './planner.component.html',
  styleUrl: './planner.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlannerComponent {}
