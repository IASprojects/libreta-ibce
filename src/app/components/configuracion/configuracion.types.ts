import { Teacher } from '../../core/models/app-config.model';
import { TeacherNames } from '../../core/models/enums';

export interface EditableTeacher extends Teacher {}

export interface EditableLesson {
  lessonNumber: string;
  lessonTitle: string;
  isActive: boolean;
}

export interface EditableUnit {
  unitNumber: string;
  unitTitle: string;
  isActive: boolean;
  lessons: EditableLesson[];
}

export interface TeacherNameChange {
  index: number;
  name: TeacherNames;
}

export interface TeacherFieldChange<K extends keyof EditableTeacher = keyof EditableTeacher> {
  index: number;
  field: K;
  value: EditableTeacher[K];
}

export interface UnitFieldChange<K extends keyof EditableUnit = keyof EditableUnit> {
  index: number;
  field: K;
  value: EditableUnit[K];
}

export interface LessonFieldChange<K extends keyof EditableLesson = keyof EditableLesson> {
  unitIndex: number;
  lessonIndex: number;
  field: K;
  value: EditableLesson[K];
}

export interface LessonRemove {
  unitIndex: number;
  lessonIndex: number;
}