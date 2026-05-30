import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { PlannedLessonService } from '../../../services/planned-lesson.service';
import { DateService } from '../../../services/date.service';
import { AppConfigService } from '../../../services/app-config.service';
import { PlannedLesson } from '../../../core/models/planned-lesson.model';
import { PlannedLessonForm } from '../planned-lesson-form/planned-lesson-form';
import { ModuleHeader } from '../../ui/module-header/module-header';
import { PlannedLessonFilters } from './planned-lesson-filters/planned-lesson-filters';
import { PlannedLessonCard } from './planned-lesson-card/planned-lesson-card';
import { PlannedLessonStats } from './planned-lesson-stats/planned-lesson-stats';

/**
 * Lección planificada con datos calculados para la vista
 */
interface PlannedLessonDisplay extends PlannedLesson {
  formattedDate: string;
  formattedShortDate: string;
  displayTitle: string;
  searchText: string;
  isUpcoming: boolean;
  isToday: boolean;
  isPast: boolean;
}

@Component({
  selector: 'app-planned-lesson-list',
  imports: [
    CommonModule,
    PlannedLessonForm,
    ModuleHeader,
    PlannedLessonFilters,
    PlannedLessonCard,
    PlannedLessonStats,
  ],
  templateUrl: './planned-lesson-list.html',
  styleUrl: './planned-lesson-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlannedLessonList {
  private plannedLessonService = inject(PlannedLessonService);
  private dateService = inject(DateService);
  private appConfigService = inject(AppConfigService);
  private activatedRoute = inject(ActivatedRoute);

  // Estados reactivos del servicio
  isLoading = this.plannedLessonService.isLoading;
  error = this.plannedLessonService.error;
  planningStats = this.plannedLessonService.planningStats;
  
  // Lecciones del servicio
  private activeLessons = this.plannedLessonService.activePlannedLessons;

  // Filtros
  filterTeacher = signal<string>('all');
  filterDate = signal<string>('upcoming'); // 'all', 'upcoming', 'past', 'today'
  searchTerm = signal('');
  showMobileFilters = signal(false);

  // Estados del formulario
  showForm = signal(false);
  editingLesson = signal<PlannedLesson | null>(null);
  formMode = computed(() => this.editingLesson() ? 'edit' : 'create');
  deactivatingLessonId = signal<string | null>(null);

  // Lecciones con datos calculados para la vista
  lessonsDisplay = computed(() => {
    const lessons = this.activeLessons();
    return lessons.map(lesson => this.enrichLessonData(lesson));
  });

  // Lecciones filtradas
  filteredLessons = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const teacher = this.filterTeacher();
    const dateFilter = this.filterDate();
    let lessons = this.lessonsDisplay();

    // Filtrar por maestro
    if (teacher !== 'all') {
      lessons = lessons.filter(l => l.plannedTeacherId === teacher);
    }

    // Filtrar por fecha
    if (dateFilter === 'upcoming') {
      lessons = lessons.filter(l => l.isUpcoming);
    } else if (dateFilter === 'past') {
      lessons = lessons.filter(l => l.isPast);
    } else if (dateFilter === 'today') {
      lessons = lessons.filter(l => l.isToday);
    }

    // Filtrar por búsqueda
    if (search) {
      lessons = lessons.filter(lesson => 
        lesson.searchText.includes(search)
      );
    }

    return lessons;
  });

  // Estadísticas de la lista
  totalLessons = computed(() => this.lessonsDisplay().length);
  totalFiltered = computed(() => this.filteredLessons().length);
  upcomingCount = computed(() => 
    this.lessonsDisplay().filter(l => l.isUpcoming).length
  );
  todayCount = computed(() => 
    this.lessonsDisplay().filter(l => l.isToday).length
  );
  lessonSubtitle = computed(() => {
    const total = this.totalLessons();
    return `${total} lección${total !== 1 ? 'es' : ''} planificada${total !== 1 ? 's' : ''}`;
  });

  // UI States
  showNoResults = computed(() => 
    (this.searchTerm().trim() !== '' || this.filterTeacher() !== 'all' || this.filterDate() !== 'all') 
    && this.filteredLessons().length === 0
  );
  hasActiveFilters = computed(() =>
    this.searchTerm().trim() !== '' || this.filterTeacher() !== 'all' || this.filterDate() !== 'all'
  );

  // Lista de maestros únicos
  uniqueTeachers = computed(() => {
    const teachers = new Set(this.lessonsDisplay().map(l => l.plannedTeacherId));
    return Array.from(teachers).sort();
  });

  constructor() {
    effect(() => {
      console.log('📅 Lecciones filtradas:', this.filteredLessons().length);
    });

    // Si la URL contiene ?editLessonId=<id>, abrir automáticamente el formulario de edición
    this.activatedRoute.queryParams.subscribe(params => {
      const editId = params['editLessonId'];
      if (editId) {
        this.plannedLessonService.getById(editId).subscribe({
          next: (lesson) => {
            if (lesson) {
              this.openEditLessonForm(lesson);
            } else {
              console.warn('Lección solicitada para edición no encontrada:', editId);
            }
          },
          error: (err) => console.error('Error cargando lección por id desde query param:', err)
        });
      }
    });
  }

  /**
   * Enriquecer datos de lección para la vista
   */
  private enrichLessonData(lesson: PlannedLesson): PlannedLessonDisplay {
    // Parsear fecha usando componentes locales para evitar problemas de zona horaria
    const [year, month, day] = lesson.plannedDate.split('-').map(Number);
    const lessonDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    lessonDate.setHours(0, 0, 0, 0);

    const displayTitle = this.getLessonDisplayTitle(lesson);

    return {
      ...lesson,
      formattedDate: this.formatDate(lesson.plannedDate),
      formattedShortDate: this.formatShortDate(lesson.plannedDate),
      displayTitle,
      searchText: `${displayTitle} ${lesson.plannedTeacherId} ${lesson.title || ''}`.toLowerCase(),
      isUpcoming: lessonDate >= today,
      isToday: lessonDate.getTime() === today.getTime(),
      isPast: lessonDate < today
    };
  }

  private getLessonDisplayTitle(lesson: PlannedLesson): string {
    const isFormal = lesson.IsFormalClass ?? true;

    if (!isFormal) {
      return lesson.title?.trim() || 'Clase informal';
    }

    const configuredLessonTitle = this.getConfiguredLessonTitle(lesson);
    if (configuredLessonTitle) {
      return configuredLessonTitle;
    }

    const unit = lesson.unitNumber?.trim();
    const lessonNumber = lesson.lessonNumber?.trim();

    if (unit && lessonNumber) {
      return `Unidad ${unit} - Lección ${lessonNumber}`;
    }

    if (unit) {
      return `Unidad ${unit}`;
    }

    if (lessonNumber) {
      return `Lección ${lessonNumber}`;
    }

    return 'Clase formal sin detalle';
  }

  private getConfiguredLessonTitle(lesson: PlannedLesson): string | null {
    const unitNumber = lesson.unitNumber?.trim();
    const lessonNumber = lesson.lessonNumber?.trim();

    if (!unitNumber || !lessonNumber) {
      return null;
    }

    const catalogUnit = this.appConfigService
      .lessonCatalog()
      .find(unit => this.matchesCatalogValue(unit.unitNumber, unitNumber));

    if (!catalogUnit) {
      return null;
    }

    const catalogLesson = catalogUnit.lessons.find(catalogLesson =>
      this.matchesCatalogValue(catalogLesson.lessonNumber, lessonNumber)
    );

    const title = catalogLesson?.lessonTitle?.trim();
    return title ? title : null;
  }

  private matchesCatalogValue(catalogValue: string | undefined, lessonValue: string): boolean {
    const normalizedCatalogValue = this.normalizeCatalogValue(catalogValue);
    const normalizedLessonValue = this.normalizeCatalogValue(lessonValue);

    return normalizedCatalogValue !== '' && normalizedCatalogValue === normalizedLessonValue;
  }

  private normalizeCatalogValue(value: string | undefined): string {
    const trimmed = value?.trim() ?? '';
    if (!trimmed) {
      return '';
    }

    const numericMatch = trimmed.match(/\d+/);
    if (numericMatch) {
      const numeric = Number(numericMatch[0]);
      return Number.isFinite(numeric) ? String(numeric) : trimmed.toLowerCase();
    }

    return trimmed.toLowerCase();
  }

  /**
   * Formatear fecha completa
   */
  private formatDate(dateString: string): string {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    };
    return date.toLocaleDateString('es-ES', options);
  }

  /**
   * Formatear fecha corta
   */
  private formatShortDate(dateString: string): string {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric'
    };
    return date.toLocaleDateString('es-ES', options);
  }

  // Métodos de interacción

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  onFilterTeacherChange(value: string): void {
    this.filterTeacher.set(value);
  }

  onFilterDateChange(value: string): void {
    this.filterDate.set(value);
    this.closeMobileFilters();
  }

  clearFilters(): void {
    this.filterTeacher.set('all');
    this.filterDate.set('all');
    this.searchTerm.set('');
    this.closeMobileFilters();
  }

  toggleMobileFilters(): void {
    this.showMobileFilters.update(value => !value);
  }

  closeMobileFilters(): void {
    this.showMobileFilters.set(false);
  }

  refresh(): void {
    this.plannedLessonService.refresh();
  }

  clearError(): void {
    this.plannedLessonService.clearError();
  }

  // Métodos del formulario

  openNewLessonForm(): void {
    this.editingLesson.set(null);
    this.showForm.set(true);
  }

  openEditLessonForm(lesson: PlannedLesson): void {
    this.editingLesson.set(lesson);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingLesson.set(null);
  }

  onFormSaved(): void {
    console.log('✅ Formulario guardado');
    this.closeForm();
  }

  onFormCancelled(): void {
    this.closeForm();
  }

  deactivateLesson(lesson: PlannedLesson): void {
    const shouldDeactivate = window.confirm(
      'Esta accion inactivara la clase planificada y no se mostrara para crear clases reales. Desea continuar?'
    );

    if (!shouldDeactivate) {
      return;
    }

    this.deactivatingLessonId.set(lesson.id);
    this.plannedLessonService
      .deactivate(lesson.id)
      .pipe(finalize(() => this.deactivatingLessonId.set(null)))
      .subscribe({
        next: () => {
          if (this.editingLesson()?.id === lesson.id) {
            this.closeForm();
          }
        },
        error: error => {
          console.error('Error inactivando clase planificada:', error);
        },
      });
  }

  isDeactivatingLesson(lessonId: string): boolean {
    return this.deactivatingLessonId() === lessonId;
  }

  // Track by para rendimiento
  trackByLessonId(index: number, lesson: PlannedLessonDisplay): string {
    return lesson.id;
  }
}
