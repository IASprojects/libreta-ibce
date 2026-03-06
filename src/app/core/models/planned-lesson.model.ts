/**
 * Planificación anticipada de clases para calendario visual
 */
export interface PlannedLesson {
  /** ID automático de Firestore */
  id: string;
  /** Fecha para la cual se planifica esta clase (calendario) */
  plannedDate: string;
  /** Unidad del Libro de Lecciones */
  unitNumber: string;
  /** Número de Lección dentro de la unidad */
  lessonNumber: string;
  /** ID del maestro asignado (referencia a Teacher.id) */
  plannedTeacherId: string;
  /** ¿La planificación está activa? (false si se canceló) */
  active: boolean;
  /** ID del maestro que creó la planificación */
  createdBy: string;
  /** Fecha de creación */
  createdAt: Date;
  /** Fecha de última modificación */
  updatedAt: Date;
}