import { TeacherNames } from './enums';

/**
 * Información de un maestro
 */
export interface Teacher {
  /** ID único del maestro (iniciales o número) */
  id: string;
  /** Nombre del maestro */
  name: TeacherNames;
  /** Teléfono de contacto */
  phone: string;
  /** Correo electrónico */
  email?: string;
  /** ¿Está activo actualmente? */
  isActive: boolean;
  /** Fecha de ingreso */
  joinedAt: string;
}

/**
 * Configuración de alertas
 */
export interface AlertsConfig {
  /** Activar recordatorios de cumpleaños */
  enableBirthdayReminders?: boolean;
  /** Días de anticipación para recordatorios de cumpleaños (0-7) */
  birthdayReminderDays?: number;
  /** Porcentaje mínimo de asistencia (0-100) */
  attendanceAlertThreshold?: number;
  /** Faltas consecutivas para alertar */
  consecutiveAbsencesAlert?: number;
}

/**
 * Configuración global de la aplicación (único documento)
 */
export interface AppConfig {
  /** Siempre 'global' (único documento) */
  id: string;
  /** Nombre de la iglesia */
  churchName: string;
  /** Dirección de la iglesia */
  churchAddress?: string;
  /** Lista de maestros (fuente única) */
  teachers: Teacher[];
  /** Configuración de alertas */
  alerts?: AlertsConfig;
  /** Fecha del último backup */
  lastBackup?: Date;
  /** Fecha de última actualización */
  updatedAt: Date;
}