import { Injectable, computed, inject, signal } from '@angular/core';
import { Timestamp, doc, getDoc, onSnapshot, setDoc, type DocumentSnapshot, type Unsubscribe } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { AppConfig, LessonCatalogUnit, Teacher } from '../core/models/app-config.model';

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

  async saveTeachers(teachers: Teacher[]): Promise<void> {
    await this.savePartialConfig({ teachers });
  }

  async saveLessonCatalog(lessonCatalog: LessonCatalogUnit[]): Promise<void> {
    await this.savePartialConfig({ lessonCatalog });
  }

  private async savePartialConfig(partial: Partial<AppConfig>): Promise<void> {
    const configRef = doc(this.firebaseService.db, this.CONFIG_COLLECTION, this.GLOBAL_CONFIG_ID);
    const currentConfig = this.configState();

    this.loadingState.set(true);

    try {
      await setDoc(
        configRef,
        {
          id: this.GLOBAL_CONFIG_ID,
          churchName: currentConfig?.churchName || 'Libreta IBCE',
          updatedAt: Timestamp.now(),
          ...partial
        },
        { merge: true }
      );

      this.errorState.set(null);
    } catch (error) {
      console.error('Error al guardar configuración global:', error);
      this.errorState.set('No se pudo guardar la configuración global');
      throw error;
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