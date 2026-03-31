import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { LessonClassService } from '../../../services/lesson-class.service';
import { AttendanceService } from '../../../services/attendance.service';
import { AppConfigService } from '../../../services/app-config.service';
import { LessonClass } from '../../../core/models/lesson-class.model';
import { combineLatest, map, of, switchMap } from 'rxjs';

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
  private readonly presentStudentsLastWeek = toSignal(
    toObservable(this.classes).pipe(
      map(classes => this.filterClassesFromLastWeek(classes)),
      switchMap(lastWeekClasses => {
        if (lastWeekClasses.length === 0) {
          return of(0);
        }

        return combineLatest(
          lastWeekClasses.map(lessonClass => this.attendanceService.getByLessonClass(lessonClass.id))
        ).pipe(
          map(attendancesByClass =>
            attendancesByClass.reduce(
              (total, attendances) => total + attendances.filter(attendance => attendance.present).length,
              0
            )
          )
        );
      })
    ),
    { initialValue: 0 }
  );

  totalClasses = computed(() => this.classStats().totalClasses);
  averageAttendance = computed(() => this.presentStudentsLastWeek());

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

  private filterClassesFromLastWeek(classes: LessonClass[]): LessonClass[] {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    return classes.filter(lessonClass => {
      const classDate = new Date(`${lessonClass.date}T00:00:00`);

      if (Number.isNaN(classDate.getTime())) {
        return false;
      }

      return classDate >= startDate && classDate <= endDate;
    });
  }
}