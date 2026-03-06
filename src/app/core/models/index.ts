// Re-exports de todos los modelos para facilitar las importaciones

// Enums
export * from './enums';

// Modelos principales
export * from './student.model';
export * from './attendance.model';
export * from './planned-lesson.model';
export * from './lesson-class.model';
export * from './app-config.model';
export * from './offline-data.model';

// Interfaces adicionales
export interface ValidationRegex {
  phone: string;
  email: string;
}

export const VALIDATION_PATTERNS: ValidationRegex = {
  phone: '^\\+?[0-9]{7,15}$',
  email: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
};

// Constantes de configuración
export const DEFAULT_CONFIG = {
  ALERTS: {
    ENABLE_BIRTHDAY_REMINDERS: true,
    BIRTHDAY_REMINDER_DAYS: 1,
    ATTENDANCE_ALERT_THRESHOLD: 50,
    CONSECUTIVE_ABSENCES_ALERT: 3
  },
  OFFLINE: {
    VERSION: 1,
    MAX_RECENT_ATTENDANCE: 50,
    MAX_RECENT_LESSON_CLASSES: 20
  }
};