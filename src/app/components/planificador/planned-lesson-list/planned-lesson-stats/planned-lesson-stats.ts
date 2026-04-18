import { ChangeDetectionStrategy, Component, input } from '@angular/core';

interface PlanningStatsView {
  totalPlanned: number;
  upcomingLessons: number;
  lessonsThisMonth: number;
}

@Component({
  selector: 'app-planned-lesson-stats',
  templateUrl: './planned-lesson-stats.html',
  styleUrl: './planned-lesson-stats.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlannedLessonStats {
  stats = input.required<PlanningStatsView>();
}
