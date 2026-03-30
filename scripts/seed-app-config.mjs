import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import vm from 'node:vm';
import { initializeApp } from 'firebase/app';
import { Timestamp, doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';

const defaultTeachers = [
  { id: 'Carlos', name: 'Carlos', phone: '', email: '', isActive: true, joinedAt: '2026-03-29' },
  { id: 'Laudy', name: 'Laudy', phone: '', email: '', isActive: true, joinedAt: '2026-03-29' },
  { id: 'Kennet', name: 'Kennet', phone: '', email: '', isActive: true, joinedAt: '2026-03-29' },
  { id: 'Yendry', name: 'Yendry', phone: '', email: '', isActive: true, joinedAt: '2026-03-29' },
  { id: 'Selenia', name: 'Selenia', phone: '', email: '', isActive: true, joinedAt: '2026-03-29' },
  { id: 'Isacc', name: 'Isacc', phone: '', email: '', isActive: true, joinedAt: '2026-03-29' }
];

const defaultLessonCatalog = [
  {
    unitNumber: '1',
    unitTitle: 'Unidad 1',
    isActive: true,
    lessons: [
      { lessonNumber: '1', lessonTitle: 'Lección 1', isActive: true },
      { lessonNumber: '3', lessonTitle: 'Lección 3', isActive: true },
      { lessonNumber: '4', lessonTitle: 'Lección 4', isActive: true }
    ]
  },
  {
    unitNumber: '2',
    unitTitle: 'Unidad 2',
    isActive: true,
    lessons: [
      { lessonNumber: '1', lessonTitle: 'Lección 1', isActive: true },
      { lessonNumber: '2', lessonTitle: 'Lección 2', isActive: true },
      { lessonNumber: '5', lessonTitle: 'Lección 5', isActive: true }
    ]
  },
  {
    unitNumber: '3',
    unitTitle: 'Unidad 3',
    isActive: true,
    lessons: [
      { lessonNumber: '2', lessonTitle: 'Lección 2', isActive: true },
      { lessonNumber: '4', lessonTitle: 'Lección 4', isActive: true }
    ]
  }
];

async function loadEnvironment() {
  const environmentPath = path.join(process.cwd(), 'src', 'environments', 'environment.ts');
  const source = await fs.readFile(environmentPath, 'utf8');
  const withoutImports = source.replace(/^import\s.+;$/gm, '');
  const executableSource = withoutImports.replace(/export const environment\s*=\s*/, 'environment = ');
  const context = { environment: null };

  vm.runInNewContext(executableSource, context);

  if (!context.environment?.firebase) {
    throw new Error('No se pudo cargar la configuración Firebase desde src/environments/environment.ts');
  }

  return context.environment;
}

async function seedAppConfig() {
  const environment = await loadEnvironment();
  const app = initializeApp(environment.firebase);
  const db = getFirestore(app);
  const configRef = doc(db, 'config', 'global');
  const existingSnapshot = await getDoc(configRef);
  const existingData = existingSnapshot.exists() ? existingSnapshot.data() : {};

  const payload = {
    id: 'global',
    churchName: existingData.churchName || 'Libreta IBCE',
    churchAddress: existingData.churchAddress || '',
    teachers: Array.isArray(existingData.teachers) && existingData.teachers.length > 0
      ? existingData.teachers
      : defaultTeachers,
    lessonCatalog: Array.isArray(existingData.lessonCatalog) && existingData.lessonCatalog.length > 0
      ? existingData.lessonCatalog
      : defaultLessonCatalog,
    alerts: existingData.alerts || {
      enableBirthdayReminders: true,
      birthdayReminderDays: 1,
      attendanceAlertThreshold: 50,
      consecutiveAbsencesAlert: 3
    },
    updatedAt: Timestamp.now()
  };

  if (existingData.lastBackup) {
    payload.lastBackup = existingData.lastBackup;
  }

  await setDoc(configRef, payload, { merge: true });

  console.log('config/global inicializado o actualizado correctamente.');
  console.log(JSON.stringify({
    churchName: payload.churchName,
    teachers: payload.teachers.length,
    lessonCatalogUnits: payload.lessonCatalog.length
  }, null, 2));
}

seedAppConfig().catch(error => {
  console.error('Error al inicializar config/global:', error);
  process.exitCode = 1;
});