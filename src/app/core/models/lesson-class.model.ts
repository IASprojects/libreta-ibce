/**
 * Instancia real de la clase (la que realmente ocurre, puede variar de lo planificado)
 */
export interface LessonClass {
  /** ID automático de Firestore */
  id: string;
  /** Fecha real cuando se dicta la clase */
  date: string;
  /** ID de la planificación original (si aplica, opcional para clases no planificadas) */
  plannedLessonId?: string;
  /** Unidad que realmente se dio (puede diferir de lo planificado) */
  unitNumber: string;
  /** Lección que realmente se dio (puede diferir de lo planificado) */
  lessonNumber: string;
  /** ID del maestro que realmente dictó (referencia a Teacher.id) */
  teacherId: string;
  /** Notas específicas sobre cómo se desarrolló la clase */
  notes?: string;
  /** ¿La clase está activa o fue cancelada? */
  active: boolean;
  /** ID del maestro que registró la instancia */
  createdBy: string;
  /** Fecha de creación */
  createdAt: Date;
}