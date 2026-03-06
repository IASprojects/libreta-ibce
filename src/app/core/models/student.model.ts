import { ContactRelationship } from './enums';

/**
 * Contacto/Tutor del estudiante
 */
export interface StudentContact {
  /** Nombre del tutor */
  name: string;
  /** Parentesco con el estudiante */
  relationship: ContactRelationship;
  /** Teléfono principal */
  phone: string;
  /** ¿Es el contacto principal? */
  isMain: boolean;
}

/**
 * Estadísticas del estudiante (calculadas automáticamente)
 */
export interface StudentStats {
  /** Total de asistencias */
  totalAttendances?: number;
  /** Asistencias consecutivas */
  currentStreak?: number;
  /** Porcentaje últimos 3 meses (0-100) */
  last3MonthsPercentage?: number;
}

/**
 * Información de estudiantes
 */
export interface Student {
  /** ID automático de Firestore */
  id: string;
  /** Nombre completo del estudiante */
  name: string;
  /** Fecha de nacimiento (formato ISO) */
  birthDate: string;
  /** Lista de contactos/tutores */
  contacts: StudentContact[];
  /** Dirección de domicilio */
  address?: string;
  /** Notas generales sobre el estudiante */
  notes?: string;
  /** ¿Está activo en la clase? */
  active: boolean;
  /** Fecha de registro */
  registeredAt: Date;
  /** Fecha de última modificación */
  updatedAt: Date;
  /** Última vez que asistió */
  lastAttendance?: string;
  /** Estadísticas calculadas */
  stats?: StudentStats;
}