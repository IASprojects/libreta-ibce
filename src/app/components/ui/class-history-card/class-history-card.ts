import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

interface ClassHistoryCardData {
  id: string;
  formattedShortDate: string;
  formattedDate: string;
  isToday: boolean;
  isRecent: boolean;
  unitNumber: string;
  lessonNumber: string;
  teacherId: string;
  notes?: string;
}

@Component({
  selector: 'app-class-history-card',
  templateUrl: './class-history-card.html',
  styleUrl: './class-history-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassHistoryCard {
  lesson = input.required<ClassHistoryCardData>();
  relativeTimeLabel = input('');

  editClick = output<void>();

  onEdit(): void {
    this.editClick.emit();
  }
}
