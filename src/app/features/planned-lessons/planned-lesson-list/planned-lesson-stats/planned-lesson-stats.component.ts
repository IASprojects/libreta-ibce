import { ChangeDetectionStrategy, Component, input } from '@angular/core';

interface PlanningStatsView {
  totalPlanned: number;
  upcomingLessons: number;
  lessonsThisMonth: number;
}

@Component({
  selector: 'app-planned-lesson-stats',
  templateUrl: './planned-lesson-stats.component.html',
  styleUrl: './planned-lesson-stats.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlannedLessonStatsComponent {
  stats = input.required<PlanningStatsView>();
}
