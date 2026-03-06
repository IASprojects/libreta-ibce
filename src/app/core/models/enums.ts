/**
 * Enumeraciones para el Sistema de Gestión de Escuela Dominical
 */

export enum ContactRelationship {
  PADRE = 'padre',
  MADRE = 'madre',
  ABUELO = 'abuelo',
  TUTOR = 'tutor',
  OTRO = 'otro'
}

export enum AttendanceType {
  REGULAR = 'regular',
  VISITOR = 'visitor',
  FIRST_TIME = 'first-time'
}

export enum TeacherNames {
  CARLOS = 'Carlos',
  LAUDY = 'Laudy',
  KENNET = 'Kennet',
  YENDRY = 'Yendry',
  SELENIA = 'Selenia',
  ISACC = 'Isacc'
}

export enum SyncAction {
  ADD = 'add',
  UPDATE = 'update',
  DELETE = 'delete'
}