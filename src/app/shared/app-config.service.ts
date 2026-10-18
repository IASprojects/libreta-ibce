import { Injectable, computed, inject, signal } from '@angular/core';
import { doc, getDoc, onSnapshot, type DocumentSnapshot, type Unsubscribe } from 'firebase/firestore';
import { FirebaseService } from '../core/services/firebase.service';
import { AppConfig, LessonCatalogUnit, Teacher } from '../core/models/app-config.model';

/**
 * Acceso de solo lectura a la configuración global (documento único `config/global`).
 * Mantiene el listener en tiempo real y las derivaciones compartidas.
 * La escritura de docentes y catálogo vive en la feature de configuración.
 */
@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  private firebaseService = inject(FirebaseService);

  private readonly CONFIG_COLLECTION = 'config';
  private readonly GLOBAL_CONFIG_ID = 'global';

  private configState = signal<AppConfig | null>(null);
  private loadingState = signal(false);
  private errorState = signal<string | null>(null);
  private unsubscribe: Unsubscribe | null = null;

  readonly config = this.configState.asReadonly();
  readonly isLoading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  readonly activeTeachers = computed<Teacher[]>(() =>
    (this.configState()?.teachers ?? []).filter(teacher => teacher.isActive)
  );

  readonly lessonCatalog = computed<LessonCatalogUnit[]>(() =>
    (this.configState()?.lessonCatalog ?? []).filter(unit => unit.isActive)
  );

  constructor() {
    this.initializeListener();
  }

  private initializeListener(): void {
    try {
      const configRef = doc(this.firebaseService.db, this.CONFIG_COLLECTION, this.GLOBAL_CONFIG_ID);
      this.loadingState.set(true);

      this.unsubscribe = onSnapshot(
        configRef,
        snapshot => {
          this.configState.set(this.mapConfigSnapshot(snapshot));
          this.errorState.set(null);
          this.loadingState.set(false);
        },
        error => {
          console.error('Error al escuchar configuración global:', error);
          this.errorState.set('No se pudo cargar la configuración global');
          this.loadingState.set(false);
        }
      );
    } catch (error) {
      console.error('Error al inicializar listener de configuración:', error);
      this.errorState.set('No se pudo inicializar la configuración global');
      this.loadingState.set(false);
    }
  }
  //Metodo para obtener el titulo de la leccion a partir de una Unidad y Leccion.
  getLessonTitle(unitId: string, lessonId: string): string | null {
    if (!unitId || !lessonId) {
      return null;
    }
    const unit = this.lessonCatalog().find(u => u.unitNumber === unitId);
    if (!unit) {
      return null;
    }
    const lesson = unit.lessons.find(l => l.lessonNumber === lessonId);
    return lesson ? `Unidad ${unitId} - Lección ${lessonId} - ${lesson.lessonTitle ?? ''}` : null;
  }

  //Metodo para obtener un maestro activo por su id.
  getTeacherById(teacherId: string): Teacher | null {
    if (!teacherId) {
      return null;
    }
    return this.activeTeachers().find(teacher => teacher.id === teacherId) ?? null;
  }

  //Metodo para obtener el nombre de un maestro activo por su id.
  getTeacherName(teacherId: string): string | null {
    return this.getTeacherById(teacherId)?.name ?? null;
  }

  async refresh(): Promise<void> {
    const configRef = doc(this.firebaseService.db, this.CONFIG_COLLECTION, this.GLOBAL_CONFIG_ID);
    this.loadingState.set(true);

    try {
      const snapshot = await getDoc(configRef);
      this.configState.set(this.mapConfigSnapshot(snapshot));
      this.errorState.set(null);
    } catch (error) {
      console.error('Error al refrescar configuración global:', error);
      this.errorState.set('No se pudo refrescar la configuración global');
    } finally {
      this.loadingState.set(false);
    }
  }

  private mapConfigSnapshot(snapshot: DocumentSnapshot): AppConfig | null {
    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    return {
      id: snapshot.id,
      churchName: data['churchName'] || '',
      churchAddress: data['churchAddress'] || '',
      teachers: (data['teachers'] || []) as Teacher[],
      lessonCatalog: (data['lessonCatalog'] || []) as LessonCatalogUnit[],
      alerts: data['alerts'],
      lastBackup: data['lastBackup']?.toDate?.() || data['lastBackup'],
      updatedAt: data['updatedAt']?.toDate?.() || new Date()
    };
  }
}
