import { Injectable, inject, signal } from '@angular/core';
import { Timestamp, doc, setDoc } from 'firebase/firestore';
import { FirebaseService } from '../../core/services/firebase.service';
import { AppConfigService } from '../../shared/app-config.service';
import { AppConfig, LessonCatalogUnit, Teacher } from '../../core/models/app-config.model';

/**
 * Escritura de la configuración global (docentes y catálogo).
 * Es la única responsable de persistir cambios; la lectura vive en `AppConfigService`.
 */
@Injectable({
  providedIn: 'root'
})
export class AppConfigEditorService {
  private firebaseService = inject(FirebaseService);
  private appConfigService = inject(AppConfigService);

  private readonly CONFIG_COLLECTION = 'config';
  private readonly GLOBAL_CONFIG_ID = 'global';

  private savingState = signal(false);
  private errorState = signal<string | null>(null);

  readonly isSaving = this.savingState.asReadonly();
  readonly saveError = this.errorState.asReadonly();

  async saveTeachers(teachers: Teacher[]): Promise<void> {
    await this.savePartialConfig({ teachers });
  }

  async saveLessonCatalog(lessonCatalog: LessonCatalogUnit[]): Promise<void> {
    await this.savePartialConfig({ lessonCatalog });
  }

  private async savePartialConfig(partial: Partial<AppConfig>): Promise<void> {
    const configRef = doc(this.firebaseService.db, this.CONFIG_COLLECTION, this.GLOBAL_CONFIG_ID);
    const currentConfig = this.appConfigService.config();

    this.savingState.set(true);

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
      this.savingState.set(false);
    }
  }
}
