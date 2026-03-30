import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlannedLessonService } from '../../../services/planned-lesson.service';
import { AppConfigService } from '../../../services/app-config.service';
import { PlannedLesson } from '../../../core/models/planned-lesson.model';

interface UpcomingClass {
  id: string;
  day: string;
  month: string;
  topic: string;
  teacher: string;
  time: string;
}

@Component({
  selector: 'app-dashboard-schedule',
  imports: [CommonModule],
  templateUrl: './dashboard-schedule.html',
  styleUrl: './dashboard-schedule.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSchedule {
  private readonly plannedLessonService = inject(PlannedLessonService);
  private readonly appConfigService = inject(AppConfigService);

  upcomingClasses = computed<UpcomingClass[]>(() =>
    this.plannedLessonService
      .upcomingLessons()
      .slice(0, 3)
      .map(lesson => this.mapUpcomingClass(lesson))
  );

  private mapUpcomingClass(lesson: PlannedLesson): UpcomingClass {
    const lessonDate = new Date(lesson.plannedDate);
    const isDateValid = !Number.isNaN(lessonDate.getTime());

    const topic = lesson.IsFormalClass === false
      ? lesson.title || 'Clase especial'
      : `Unidad ${lesson.unitNumber || '-'} - Lección ${lesson.lessonNumber || '-'}`;

    return {
      id: lesson.id,
      day: isDateValid ? String(lessonDate.getDate()).padStart(2, '0') : '--',
      month: isDateValid
        ? new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(lessonDate).toUpperCase().replace('.', '')
        : '---',
      topic,
      teacher: this.resolveTeacherName(lesson.plannedTeacherId),
      time: 'Por definir'
    };
  }

  private resolveTeacherName(teacherId: string): string {
    const teacher = this.appConfigService
      .activeTeachers()
      .find(currentTeacher => currentTeacher.id === teacherId);

    return teacher?.name || teacherId;
  }
}