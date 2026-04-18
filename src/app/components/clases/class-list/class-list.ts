import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { concatMap, finalize, map, Observable } from 'rxjs';
import {
  CreateCustomClassInput,
  CreateFromPlannedInput,
  LessonClassService,
} from '../../../services/lesson-class.service';
import { PlannedLessonService } from '../../../services/planned-lesson.service';
import { AttendanceService, BatchAttendanceInput } from '../../../services/attendance.service';
import { StudentService } from '../../../services/student.service';
import { DateService } from '../../../services/date.service';
import { UserService } from '../../../services/user.service';
import { AppConfigService } from '../../../services/app-config.service';
import { LessonClass } from '../../../core/models/lesson-class.model';
import { PlannedLesson } from '../../../core/models/planned-lesson.model';
import { Student } from '../../../core/models/student.model';
import { TeacherNames } from '../../../core/models/enums';
import { ClassListHero } from './class-list-hero/class-list-hero';
import { ClassHistoryFilters } from './class-history-filters/class-history-filters';
import { AlertBanner } from '../../ui/alert-banner/alert-banner';
import { EditorPanelHeader } from '../../ui/editor-panel-header/editor-panel-header';
import { ClassHistoryCard } from '../../ui/class-history-card/class-history-card';

type ClassEditorMode = 'create' | 'edit';
type ClassEditorSource = 'planned' | 'custom';
type AttendanceFocus = 'absent' | 'present';

interface LessonClassDisplay extends LessonClass {
  formattedDate: string;
  formattedShortDate: string;
  isToday: boolean;
  isRecent: boolean;
  isPast: boolean;
  daysSinceClass: number;
}

interface PlannedLessonDisplay extends PlannedLesson {
  displayTitle: string;
  formattedDate: string;
}

interface AttendanceStudentDisplay extends Student {
  present: boolean;
  isMarked: boolean;
}

interface ClassEditorFormData {
  source: ClassEditorSource;
  plannedLessonId: string;
  date: string;
  teacherId: string;
  unitNumber: string;
  lessonNumber: string;
  notes: string;
}

interface QuickStudentFormData {
  name: string;
  birthDate: string;
  phone: string;
}

@Component({
  selector: 'app-class-list',
  imports: [
    CommonModule,
    ClassListHero,
    ClassHistoryFilters,
    AlertBanner,
    EditorPanelHeader,
    ClassHistoryCard,
  ],
  templateUrl: './class-list.html',
  styleUrl: './class-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassList {
  private lessonClassService = inject(LessonClassService);
  private plannedLessonService = inject(PlannedLessonService);
  private attendanceService = inject(AttendanceService);
  private studentService = inject(StudentService);
  private dateService = inject(DateService);
  private userService = inject(UserService);
  private appConfigService = inject(AppConfigService);

  classStats = this.lessonClassService.classStats;
  todayClass = this.lessonClassService.todayClass;
  hasTodayClass = this.lessonClassService.hasTodayClass;
  activeStudents = this.studentService.activeStudents;

  private activeClasses = this.lessonClassService.activeClasses;
  private activePlannedLessons = this.plannedLessonService.activePlannedLessons;

  filterTeacher = signal('all');
  filterPeriod = signal('all');
  searchTerm = signal('');

  showEditor = signal(false);
  editorMode = signal<ClassEditorMode>('create');
  selectedClassId = signal<string | null>(null);
  loadingClassAttendance = signal(false);
  isSaving = signal(false);
  saveError = signal<string | null>(null);
  saveSuccess = signal<string | null>(null);
  fieldErrors = signal<Record<string, string>>({});
  attendanceFocus = signal<AttendanceFocus>('absent');
  studentSearchTerm = signal('');
  attendanceByStudent = signal<Record<string, boolean>>({});
  showQuickStudentModal = signal(false);
  quickStudentForm = signal<QuickStudentFormData>(this.buildDefaultQuickStudentFormData());
  quickStudentErrors = signal<Record<string, string>>({});
  isCreatingStudent = signal(false);
  isDeactivatingClass = signal(false);

  formData = signal<ClassEditorFormData>(this.buildDefaultFormData('planned'));

  isInitialLoading = computed(
    () =>
      (this.lessonClassService.isLoading() && this.activeClasses().length === 0) ||
      this.appConfigService.isLoading()
  );

  serviceError = computed(
    () =>
      this.lessonClassService.error() ||
      this.attendanceService.error() ||
      this.studentService.error() ||
      this.plannedLessonService.error() ||
      this.appConfigService.error()
  );

  teacherNames = computed(() => {
    const configuredTeachers = this.appConfigService.activeTeachers().map(teacher => teacher.name);
    return configuredTeachers.length > 0 ? configuredTeachers : Object.values(TeacherNames);
  });

  plannedLessonsDisplay = computed(() => {
    const lessons = [...this.activePlannedLessons()].sort((left, right) =>
      left.plannedDate.localeCompare(right.plannedDate)
    );
    return lessons.map(lesson => this.enrichPlannedLessonData(lesson));
  });

  classesDisplay = computed(() => {
    const classes = this.activeClasses();
    return classes.map(lessonClass => this.enrichClassData(lessonClass));
  });

  filteredClasses = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const teacher = this.filterTeacher();
    const period = this.filterPeriod();
    let classes = this.classesDisplay();

    if (teacher !== 'all') {
      classes = classes.filter(lessonClass => lessonClass.teacherId === teacher);
    }

    if (period !== 'all') {
      const today = this.startOfDay(new Date());

      if (period === 'today') {
        classes = classes.filter(lessonClass => lessonClass.isToday);
      } else if (period === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        classes = classes.filter(lessonClass => {
          const classDate = this.parseLocalDate(lessonClass.date);
          return classDate >= weekAgo && classDate <= today;
        });
      } else if (period === 'month') {
        classes = classes.filter(lessonClass => {
          const classDate = this.parseLocalDate(lessonClass.date);
          return (
            classDate.getMonth() === today.getMonth() &&
            classDate.getFullYear() === today.getFullYear()
          );
        });
      } else if (period === 'year') {
        classes = classes.filter(lessonClass => {
          const classDate = this.parseLocalDate(lessonClass.date);
          return classDate.getFullYear() === today.getFullYear();
        });
      }
    }

    if (search) {
      classes = classes.filter(lessonClass =>
        [
          lessonClass.unitNumber,
          lessonClass.lessonNumber,
          lessonClass.teacherId,
          lessonClass.formattedDate,
          lessonClass.notes || '',
        ].some(value => value.toLowerCase().includes(search))
      );
    }

    return classes;
  });

  totalClasses = computed(() => this.classesDisplay().length);
  totalFiltered = computed(() => this.filteredClasses().length);
  recentCount = computed(() => this.classesDisplay().filter(lessonClass => lessonClass.isRecent).length);

  uniqueTeachers = computed(() => {
    const teachers = new Set(this.classesDisplay().map(lessonClass => lessonClass.teacherId));
    return Array.from(teachers).sort((left, right) => left.localeCompare(right, 'es'));
  });

  nearestPlannedLesson = computed(() => {
    const classesWithPlanning = new Set(
      this.activeClasses()
        .map(lessonClass => lessonClass.plannedLessonId)
        .filter((plannedLessonId): plannedLessonId is string => typeof plannedLessonId === 'string')
    );

    const today = this.dateService.getTodayDateString();
    const availableLessons = this.plannedLessonsDisplay().filter(
      lesson => !classesWithPlanning.has(lesson.id)
    );

    return availableLessons.find(lesson => lesson.plannedDate >= today) || availableLessons[0] || null;
  });

  editorTitle = computed(() =>
    this.editorMode() === 'edit' ? 'Editar clase y asistencia' : 'Nueva clase y asistencia'
  );

  editorSubtitle = computed(() => {
    if (this.editorMode() === 'edit') {
      return 'Ajuste la información de la clase y luego marque asistencia o ausencia por estudiante.';
    }

    return this.formData().source === 'planned'
      ? 'Seleccione la clase planificada más cercana o cambie a una clase manual.'
      : 'Cree una clase rápida y guarde la asistencia del día en el mismo paso.';
  });

  attendanceSummary = computed(() => {
    const students = this.activeStudents();
    const attendanceMap = this.attendanceByStudent();

    const presentCount = students.filter(student => attendanceMap[student.id] ?? true).length;
    const totalStudents = students.length;

    return {
      totalStudents,
      presentCount,
      absentCount: Math.max(0, totalStudents - presentCount),
    };
  });

  visibleStudents = computed(() => {
    const focus = this.attendanceFocus();
    const search = this.studentSearchTerm().toLowerCase().trim();
    const attendanceMap = this.attendanceByStudent();

    return this.activeStudents()
      .map(student => {
        const present = attendanceMap[student.id] ?? true;
        const isMarked = focus === 'absent' ? !present : present;

        return {
          ...student,
          present,
          isMarked,
        } as AttendanceStudentDisplay;
      })
      .filter(student => {
        if (!search) {
          return true;
        }

        return [student.name, student.phone || '', student.notes || ''].some(value =>
          value.toLowerCase().includes(search)
        );
      })
      .sort((left, right) => {
        if (left.isMarked !== right.isMarked) {
          return Number(right.isMarked) - Number(left.isMarked);
        }

        return left.name.localeCompare(right.name, 'es');
      });
  });

  showNoResults = computed(
    () =>
      (this.searchTerm().trim() !== '' ||
        this.filterTeacher() !== 'all' ||
        this.filterPeriod() !== 'all') &&
      this.filteredClasses().length === 0
  );

  constructor() {
    effect(() => {
      if (!this.showEditor()) {
        return;
      }

      const students = this.activeStudents();
      const currentMap = this.attendanceByStudent();
      let hasChanges = false;
      const nextMap = { ...currentMap };

      for (const student of students) {
        if (Object.prototype.hasOwnProperty.call(nextMap, student.id)) {
          continue;
        }

        nextMap[student.id] = true;
        hasChanges = true;
      }

      if (hasChanges) {
        this.attendanceByStudent.set(nextMap);
      }
    });
  }

  private buildDefaultFormData(source: ClassEditorSource): ClassEditorFormData {
    return {
      source,
      plannedLessonId: '',
      date: this.dateService.getTodayDateString(),
      teacherId: '',
      unitNumber: '',
      lessonNumber: '',
      notes: '',
    };
  }

  private buildDefaultAttendanceMap(defaultPresent: boolean): Record<string, boolean> {
    return this.activeStudents().reduce<Record<string, boolean>>((result, student) => {
      result[student.id] = defaultPresent;
      return result;
    }, {});
  }

  private buildDefaultQuickStudentFormData(): QuickStudentFormData {
    return {
      name: '',
      birthDate: '',
      phone: '',
    };
  }

  private parseLocalDate(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private startOfDay(date: Date): Date {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    return normalizedDate;
  }

  formatDate(dateString: string): string {
    return this.parseLocalDate(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  private formatShortDate(dateString: string): string {
    return this.parseLocalDate(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  }

  private getLessonDisplayTitle(lesson: PlannedLesson): string {
    const isFormal = lesson.IsFormalClass ?? true;

    if (!isFormal) {
      return lesson.title?.trim() || 'Clase especial';
    }

    const unit = lesson.unitNumber?.trim();
    const lessonNumber = lesson.lessonNumber?.trim();

    if (unit && lessonNumber) {
      return `Unidad ${unit} - Lección ${lessonNumber}`;
    }

    if (unit) {
      return `Unidad ${unit}`;
    }

    if (lessonNumber) {
      return `Lección ${lessonNumber}`;
    }

    return 'Clase formal sin detalle';
  }

  private enrichPlannedLessonData(lesson: PlannedLesson): PlannedLessonDisplay {
    return {
      ...lesson,
      displayTitle: this.getLessonDisplayTitle(lesson),
      formattedDate: this.formatDate(lesson.plannedDate),
    };
  }

  private enrichClassData(lessonClass: LessonClass): LessonClassDisplay {
    const classDate = this.startOfDay(this.parseLocalDate(lessonClass.date));
    const today = this.startOfDay(new Date());
    const diffTime = today.getTime() - classDate.getTime();
    const daysSinceClass = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const isRecent = daysSinceClass >= 0 && daysSinceClass <= 7;

    return {
      ...lessonClass,
      formattedDate: this.formatDate(lessonClass.date),
      formattedShortDate: this.formatShortDate(lessonClass.date),
      isToday: classDate.getTime() === today.getTime(),
      isRecent,
      isPast: classDate < today,
      daysSinceClass,
    };
  }

  private resetEditorState(mode: ClassEditorMode): void {
    this.showEditor.set(true);
    this.editorMode.set(mode);
    this.saveError.set(null);
    this.saveSuccess.set(null);
    this.fieldErrors.set({});
    this.studentSearchTerm.set('');
    this.attendanceFocus.set('absent');
  }

  private loadAttendanceForClass(classId: string): void {
    this.loadingClassAttendance.set(true);
    this.attendanceByStudent.set(this.buildDefaultAttendanceMap(true));

    this.attendanceService
      .getByLessonClass(classId)
      .pipe(finalize(() => this.loadingClassAttendance.set(false)))
      .subscribe({
        next: attendances => {
          const nextMap = this.buildDefaultAttendanceMap(true);

          attendances.forEach(attendance => {
            nextMap[attendance.studentId] = attendance.present;
          });

          this.attendanceByStudent.set(nextMap);
        },
        error: error => {
          console.error('Error cargando asistencia de la clase:', error);
          this.saveError.set('No se pudo cargar la asistencia registrada para esta clase.');
        },
      });
  }

  private validateForm(): boolean {
    const data = this.formData();
    const errors: Record<string, string> = {};

    if (data.source === 'planned' && !data.plannedLessonId) {
      errors['plannedLessonId'] = 'Seleccione una clase planificada o cambie a clase manual.';
    }

    if (!data.date.trim()) {
      errors['date'] = 'La fecha es obligatoria.';
    }

    if (!data.teacherId.trim()) {
      errors['teacherId'] = 'Seleccione el maestro que impartió la clase.';
    }

    if (!data.unitNumber.trim()) {
      errors['unitNumber'] = 'Ingrese la unidad impartida.';
    }

    if (!data.lessonNumber.trim()) {
      errors['lessonNumber'] = 'Ingrese la lección impartida.';
    }

    this.fieldErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  private buildAttendancePayload(): BatchAttendanceInput[] {
    const attendanceMap = this.attendanceByStudent();

    return this.activeStudents().map(student => ({
      studentId: student.id,
      present: attendanceMap[student.id] ?? true,
    }));
  }

  private buildClassSaveRequest(currentUserId: string): Observable<string> {
    const data = this.formData();
    const classPayload: CreateFromPlannedInput & CreateCustomClassInput = {
      date: data.date,
      teacherId: data.teacherId.trim(),
      unitNumber: data.unitNumber.trim(),
      lessonNumber: data.lessonNumber.trim(),
      notes: data.notes.trim(),
    };

    const classId = this.selectedClassId();
    if (this.editorMode() === 'edit' && classId) {
      return this.lessonClassService
        .update(classId, {
          date: classPayload.date,
          teacherId: classPayload.teacherId,
          unitNumber: classPayload.unitNumber,
          lessonNumber: classPayload.lessonNumber,
          notes: classPayload.notes,
        })
        .pipe(map(() => classId));
    }

    if (data.source === 'planned' && data.plannedLessonId) {
      return this.lessonClassService.createFromPlanned(data.plannedLessonId, classPayload, currentUserId);
    }

    return this.lessonClassService.createCustom(classPayload, currentUserId);
  }

  private isQuickStudentBirthDateValid(birthDate: string): boolean {
    const parsedBirthDate = this.parseLocalDate(birthDate);
    const today = this.startOfDay(new Date());

    if (parsedBirthDate.getTime() > today.getTime()) {
      return false;
    }

    const youngestAllowedDate = new Date(today);
    youngestAllowedDate.setFullYear(today.getFullYear() - 11);

    const oldestAllowedDate = new Date(today);
    oldestAllowedDate.setFullYear(today.getFullYear() - 20);

    return parsedBirthDate.getTime() <= youngestAllowedDate.getTime() && parsedBirthDate.getTime() >= oldestAllowedDate.getTime();
  }

  private validateQuickStudentForm(): boolean {
    const form = this.quickStudentForm();
    const errors: Record<string, string> = {};

    if (!form.name.trim()) {
      errors['name'] = 'El nombre es obligatorio.';
    } else if (form.name.trim().length < 2) {
      errors['name'] = 'El nombre debe tener al menos 2 caracteres.';
    }

    if (!form.birthDate.trim()) {
      errors['birthDate'] = 'El cumpleaños es obligatorio.';
    } else if (!this.isQuickStudentBirthDateValid(form.birthDate)) {
      errors['birthDate'] = 'La edad permitida es entre 11 y 20 años.';
    }

    const normalizedPhone = form.phone.trim();
    const phoneRegex = /^[\d\s\-\+\(\)]{8,20}$/;
    if (!normalizedPhone) {
      errors['phone'] = 'El teléfono es obligatorio.';
    } else if (!phoneRegex.test(normalizedPhone) || normalizedPhone.replace(/\D/g, '').length < 8) {
      errors['phone'] = 'Ingrese un teléfono válido.';
    }

    this.quickStudentErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  getRelativeTime(daysSince: number): string {
    if (daysSince === 0) {
      return 'Hoy';
    }

    if (daysSince === 1) {
      return 'Ayer';
    }

    if (daysSince < 7) {
      return `Hace ${daysSince} días`;
    }

    if (daysSince < 30) {
      return `Hace ${Math.floor(daysSince / 7)} semanas`;
    }

    if (daysSince < 365) {
      return `Hace ${Math.floor(daysSince / 30)} meses`;
    }

    return `Hace ${Math.floor(daysSince / 365)} años`;
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  onFilterTeacherChange(value: string): void {
    this.filterTeacher.set(value);
  }

  onFilterPeriodChange(value: string): void {
    this.filterPeriod.set(value);
  }

  clearFilters(): void {
    this.filterTeacher.set('all');
    this.filterPeriod.set('all');
    this.searchTerm.set('');
  }

  startSuggestedFlow(): void {
    const todayClass = this.todayClass();
    if (todayClass) {
      this.openEditClass(todayClass);
      return;
    }

    const nearestPlannedLesson = this.nearestPlannedLesson();
    if (nearestPlannedLesson) {
      this.openNewClassFromPlanned(nearestPlannedLesson);
      return;
    }

    this.openCustomClass();
  }

  openNewClassFromPlanned(plannedLesson: PlannedLessonDisplay | null = this.nearestPlannedLesson()): void {
    this.resetEditorState('create');
    this.selectedClassId.set(null);
    this.attendanceByStudent.set(this.buildDefaultAttendanceMap(true));

    if (!plannedLesson) {
      this.formData.set(this.buildDefaultFormData('planned'));
      return;
    }

    this.formData.set({
      source: 'planned',
      plannedLessonId: plannedLesson.id,
      date: plannedLesson.plannedDate,
      teacherId: plannedLesson.plannedTeacherId,
      unitNumber: plannedLesson.unitNumber?.trim() || '',
      lessonNumber: plannedLesson.lessonNumber?.trim() || '',
      notes: '',
    });
  }

  openCustomClass(): void {
    this.resetEditorState('create');
    this.selectedClassId.set(null);
    this.formData.set(this.buildDefaultFormData('custom'));
    this.attendanceByStudent.set(this.buildDefaultAttendanceMap(true));
  }

  openEditClass(lessonClass: LessonClass | LessonClassDisplay): void {
    this.resetEditorState('edit');
    this.selectedClassId.set(lessonClass.id);
    this.formData.set({
      source: lessonClass.plannedLessonId ? 'planned' : 'custom',
      plannedLessonId: lessonClass.plannedLessonId || '',
      date: lessonClass.date,
      teacherId: lessonClass.teacherId,
      unitNumber: lessonClass.unitNumber,
      lessonNumber: lessonClass.lessonNumber,
      notes: lessonClass.notes || '',
    });
    this.loadAttendanceForClass(lessonClass.id);
  }

  closeEditor(): void {
    this.showEditor.set(false);
    this.selectedClassId.set(null);
    this.loadingClassAttendance.set(false);
    this.fieldErrors.set({});
    this.saveError.set(null);
  }

  setEditorSource(source: ClassEditorSource): void {
    if (this.editorMode() === 'edit') {
      return;
    }

    this.saveSuccess.set(null);
    this.saveError.set(null);
    this.fieldErrors.set({});

    if (source === 'planned') {
      this.openNewClassFromPlanned(this.nearestPlannedLesson());
      return;
    }

    const currentForm = this.formData();
    this.formData.set({
      ...currentForm,
      source: 'custom',
      plannedLessonId: '',
    });
  }

  onPlannedLessonChange(plannedLessonId: string): void {
    const selectedLesson = this.plannedLessonsDisplay().find(lesson => lesson.id === plannedLessonId);
    if (!selectedLesson) {
      this.formData.update(current => ({
        ...current,
        plannedLessonId: '',
      }));
      return;
    }

    this.formData.update(current => ({
      ...current,
      source: 'planned',
      plannedLessonId: selectedLesson.id,
      date: selectedLesson.plannedDate,
      teacherId: selectedLesson.plannedTeacherId,
      unitNumber: selectedLesson.unitNumber?.trim() || current.unitNumber,
      lessonNumber: selectedLesson.lessonNumber?.trim() || current.lessonNumber,
    }));
  }

  updateField(field: keyof ClassEditorFormData, value: string): void {
    this.formData.update(current => ({
      ...current,
      [field]: value,
    }));
    this.saveSuccess.set(null);
    this.saveError.set(null);
  }

  setAttendanceFocus(focus: AttendanceFocus): void {
    this.attendanceFocus.set(focus);
  }

  onStudentSearchChange(value: string): void {
    this.studentSearchTerm.set(value);
  }

  clearStudentSearch(): void {
    this.studentSearchTerm.set('');
  }

  toggleStudentAttendance(studentId: string): void {
    this.attendanceByStudent.update(current => ({
      ...current,
      [studentId]: !(current[studentId] ?? true),
    }));
    this.saveSuccess.set(null);
  }

  markAllPresent(): void {
    this.attendanceByStudent.set(this.buildDefaultAttendanceMap(true));
    this.saveSuccess.set(null);
  }

  markAllAbsent(): void {
    this.attendanceByStudent.set(this.buildDefaultAttendanceMap(false));
    this.saveSuccess.set(null);
  }

  getStudentActionText(student: AttendanceStudentDisplay): string {
    if (this.attendanceFocus() === 'absent') {
      return student.present ? 'Marcar ausente' : 'Desmarcar ausencia';
    }

    return student.present ? 'Desmarcar asistencia' : 'Marcar asistencia';
  }

  saveClassAttendance(): void {
    if (!this.validateForm()) {
      this.saveError.set('Revise los campos obligatorios antes de guardar.');
      return;
    }

    const currentUser = this.userService.user();
    if (!currentUser) {
      this.saveError.set('Debe iniciar sesión para guardar la clase y la asistencia.');
      return;
    }

    this.isSaving.set(true);
    this.saveError.set(null);
    this.saveSuccess.set(null);

    this.buildClassSaveRequest(currentUser.uid)
      .pipe(
        concatMap(classId =>
          this.attendanceService
            .saveLessonAttendance(classId, this.buildAttendancePayload(), currentUser.uid)
            .pipe(map(() => classId))
        ),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe({
        next: classId => {
          this.selectedClassId.set(classId);
          this.editorMode.set('edit');
          this.saveSuccess.set('La clase y la asistencia se guardaron correctamente.');
          this.loadAttendanceForClass(classId);
        },
        error: error => {
          console.error('Error guardando clase y asistencia:', error);
          this.saveError.set('No se pudo guardar la clase y la asistencia. Intente nuevamente.');
        },
      });
  }

  deactivateCurrentClass(): void {
    const classId = this.selectedClassId();

    if (this.editorMode() !== 'edit' || !classId) {
      return;
    }

    const shouldDeactivate = window.confirm(
      'Esta accion inactivara la clase para quitar pruebas o errores. Desea continuar?'
    );

    if (!shouldDeactivate) {
      return;
    }

    this.isDeactivatingClass.set(true);
    this.saveError.set(null);
    this.saveSuccess.set(null);

    this.lessonClassService
      .deactivate(classId, 'Inactivada desde editor de asistencia')
      .pipe(finalize(() => this.isDeactivatingClass.set(false)))
      .subscribe({
        next: () => {
          this.saveSuccess.set('Clase inactivada correctamente.');
          this.closeEditor();
        },
        error: error => {
          console.error('Error inactivando clase:', error);
          this.saveError.set('No se pudo inactivar la clase. Intente nuevamente.');
        },
      });
  }

  openNewStudentForm(): void {
    this.showQuickStudentModal.set(true);
    this.quickStudentForm.set(this.buildDefaultQuickStudentFormData());
    this.quickStudentErrors.set({});
    this.saveError.set(null);
  }

  closeQuickStudentModal(): void {
    if (this.isCreatingStudent()) {
      return;
    }

    this.showQuickStudentModal.set(false);
    this.quickStudentErrors.set({});
  }

  updateQuickStudentField(field: keyof QuickStudentFormData, value: string): void {
    this.quickStudentForm.update(current => ({
      ...current,
      [field]: value,
    }));

    this.quickStudentErrors.update(current => {
      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  }

  saveQuickStudent(): void {
    if (!this.validateQuickStudentForm()) {
      return;
    }

    const form = this.quickStudentForm();
    this.isCreatingStudent.set(true);
    this.saveError.set(null);

    this.studentService
      .createStudent({
        name: form.name.trim(),
        birthDate: form.birthDate.trim(),
        phone: form.phone.trim(),
      })
      .pipe(finalize(() => this.isCreatingStudent.set(false)))
      .subscribe({
        next: studentId => {
          this.attendanceByStudent.update(current => ({
            ...current,
            [studentId]: true,
          }));
          this.showQuickStudentModal.set(false);
          this.quickStudentForm.set(this.buildDefaultQuickStudentFormData());
          this.quickStudentErrors.set({});
          this.saveSuccess.set('Estudiante agregado. Ya puede marcar su asistencia.');
        },
        error: error => {
          console.error('Error creando estudiante rapido:', error);
          this.saveError.set('No se pudo crear el estudiante. Intente nuevamente.');
        },
      });
  }

  refresh(): void {
    this.lessonClassService.refresh();
    this.plannedLessonService.refresh();
    void this.appConfigService.refresh();
  }

  trackByClassId(index: number, lessonClass: LessonClassDisplay): string {
    return lessonClass.id;
  }

  trackByPlannedLessonId(index: number, lesson: PlannedLessonDisplay): string {
    return lesson.id;
  }

  trackByStudentId(index: number, student: AttendanceStudentDisplay): string {
    return student.id;
  }
}