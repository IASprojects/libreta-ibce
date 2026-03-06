import { AttendanceType } from './enums';

/**
 * Registro individual de asistencia a una clase específica
 */
export interface Attendance {
  /** ID automático de Firestore */
  id: string;
  /** ID de la instancia de clase (referencia a LessonClass) */
  lessonClassId: string;
  /** ID del estudiante (referencia a Student) */
  studentId: string;
  /** true = presente, false = ausente */
  present: boolean;
  /** Notas del día */
  notes?: string;
  /** Tipo de asistencia */
  type: AttendanceType;
  /** ID del maestro que registró (referencia a Teacher.id) */
  registeredBy: string;
  /** Momento del registro */
  registeredAt: Date;
  /** Fecha de última modificación */
  updatedAt: Date;
  /** ¿La asistencia fue marcada como inactiva (ej. corrección)? */
  inactive?: boolean;
  /** Para control de sincronización offline */
  synced?: boolean;
}