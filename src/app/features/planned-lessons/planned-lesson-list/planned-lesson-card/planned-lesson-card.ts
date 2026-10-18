import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

interface PlannedLessonCardData {
  id: string;
  displayTitle: string;
  formattedDate: string;
  formattedShortDate: string;
  plannedTeacherId: string;
  isToday: boolean;
  isUpcoming: boolean;
  isPast: boolean;
}

@Component({
  selector: 'app-planned-lesson-card',
  templateUrl: './planned-lesson-card.html',
  styleUrl: './planned-lesson-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlannedLessonCard {
  lesson = input.required<PlannedLessonCardData>();
  isDeactivating = input(false);

  editClick = output<void>();
  deactivateClick = output<void>();

  onEdit(): void {
    this.editClick.emit();
  }

  onDeactivate(): void {
    this.deactivateClick.emit();
  }
}
