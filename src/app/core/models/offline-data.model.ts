import { Student } from './student.model';
import { Attendance } from './attendance.model';
import { PlannedLesson } from './planned-lesson.model';
import { LessonClass } from './lesson-class.model';
import { SyncAction } from './enums';

/**
 * Cambio pendiente de sincronizar
 */
export interface PendingChange {
  /** ID único del cambio */
  id: string;
  /** Colección afectada */
  collection: 'students' | 'attendance' | 'planned_lessons' | 'lesson_classes';
  /** Acción realizada */
  action: SyncAction;
  /** Datos del cambio */
  data: any;
  /** Momento del cambio */
  timestamp: Date;
}

/**
 * Estructura para almacenamiento local (no va en Firestore)
 */
export interface OfflineData {
  /** Versión del esquema de datos offline */
  version: number;
  /** Última sincronización */
  lastSync: Date;
  /** Copia local de estudiantes */
  students: Student[];
  /** Últimas 50 asistencias */
  recentAttendance: Attendance[];
  /** Próximas planificaciones para calendario */
  upcomingPlannedLessons: PlannedLesson[];
  /** Últimas 20 clases reales */
  recentLessonClasses: LessonClass[];
  /** Cambios pendientes de sincronizar */
  pendingChanges: PendingChange[];
}