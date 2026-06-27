import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlannedLessonService } from '../../../services/planned-lesson.service';
import { AppConfigService } from '../../../services/app-config.service';
import { PlannedLesson } from '../../../core/models/planned-lesson.model';
import { Router } from '@angular/router';

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
  private readonly router = inject(Router);

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
      : this.appConfigService.getLessonTitle(lesson.unitNumber ?? '', lesson.lessonNumber ?? '') || 'Tema por definir';

    return {
      id: lesson.id,
      day: isDateValid ? String(lessonDate.getUTCDate()).padStart(2, '0') : '--',
      month: isDateValid
        ? new Intl.DateTimeFormat('es-ES', { month: 'short', timeZone: 'UTC' }).format(lessonDate).toUpperCase().replace('.', '')
        : '---',
      topic,
      teacher: this.resolveTeacherName(lesson.plannedTeacherId),
      time: 'Por definir'
    };
  }

  openLesson(lessonId: string): void {
    // Navegar al planificador y solicitar abrir la lección en modo edición
    this.router.navigate(['/dashboard/planificador'], { queryParams: { editLessonId: lessonId } });
  }

  onKeydown(event: KeyboardEvent, lessonId: string): void {
    const key = event.key;
    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      this.openLesson(lessonId);
    }
  }

  private resolveTeacherName(teacherId: string): string {
    const teacher = this.appConfigService
      .activeTeachers()
      .find(currentTeacher => currentTeacher.id === teacherId);

    return teacher?.name || teacherId;
  }
}