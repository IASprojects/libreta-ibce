import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LessonClassService } from '../../../services/lesson-class.service';
import { AttendanceService } from '../../../services/attendance.service';
import { AppConfigService } from '../../../services/app-config.service';

@Component({
  selector: 'app-dashboard-indicators',
  imports: [CommonModule],
  templateUrl: './dashboard-indicators.html',
  styleUrl: './dashboard-indicators.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardIndicators {
  private readonly lessonClassService = inject(LessonClassService);
  private readonly attendanceService = inject(AttendanceService);
  private readonly appConfigService = inject(AppConfigService);

  private readonly classes = this.lessonClassService.recentClasses;
  private readonly classStats = this.lessonClassService.classStats;
  private readonly todaySummary = this.attendanceService.todaySummary;

  totalClasses = computed(() => this.classStats().totalClasses);
  averageAttendance = computed(() => this.todaySummary().presentStudents);

  private readonly lastClass = computed(() => this.classes()[0] ?? null);

  lastClassDate = computed(() => {
    const lessonClass = this.lastClass();
    if (!lessonClass) {
      return 'Sin registros';
    }

    const parsedDate = new Date(lessonClass.date);
    if (Number.isNaN(parsedDate.getTime())) {
      return lessonClass.date;
    }

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'long'
    }).format(parsedDate);
  });

  lastTeacher = computed(() => {
    const lessonClass = this.lastClass();
    if (!lessonClass) {
      return 'Sin maestro asignado';
    }

    const teacher = this.appConfigService
      .activeTeachers()
      .find(currentTeacher => currentTeacher.id === lessonClass.teacherId);

    return teacher?.name ?? lessonClass.teacherId;
  });
}