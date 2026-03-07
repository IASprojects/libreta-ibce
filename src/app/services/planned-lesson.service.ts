import { Injectable, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  DocumentSnapshot,
  QuerySnapshot,
  DocumentReference,
  limit as firestoreLimit,
  and
} from 'firebase/firestore';
import { Observable, from, map, catchError, of, BehaviorSubject, throwError } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { DateService } from './date.service';
import { PlannedLesson } from '../core/models/planned-lesson.model';

/**
 * Estructura para crear nueva lección planificada
 */
export interface CreatePlannedLessonInput {
  plannedDate: string;
  unitNumber: string;
  lessonNumber: string;
  plannedTeacherId: string;
}

/**
 * Rango de fechas para consultas de calendario
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Estadísticas de planificación
 */
export interface PlanningStats {
  totalPlanned: number;
  upcomingLessons: number;
  lessonsThisMonth: number;
  lessonsByTeacher: { teacherId: string; count: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class PlannedLessonService {
  private firebaseService = inject(FirebaseService);
  private dateService = inject(DateService);

  // Collections
  private readonly PLANNED_LESSONS_COLLECTION = 'planned_lessons';

  // Estados reactivos
  private plannedLessonsSubject = new BehaviorSubject<PlannedLesson[]>([]);
  private upcomingLessonsSubject = new BehaviorSubject<PlannedLesson[]>([]);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  
  // Signals públicos
  public readonly isLoading = toSignal(this.isLoadingSubject.asObservable(), { initialValue: false });
  public readonly error = toSignal(this.errorSubject.asObservable(), { initialValue: null });
  public readonly plannedLessons = toSignal(this.plannedLessonsSubject.asObservable(), { initialValue: [] });
  public readonly upcomingLessons = toSignal(this.upcomingLessonsSubject.asObservable(), { initialValue: [] });
  
  // Lecciones activas
  public readonly activePlannedLessons = computed(() => 
    this.plannedLessons().filter(lesson => lesson.active)
  );
  
  // Estadísticas computadas
  public readonly planningStats = computed((): PlanningStats => {
    const active = this.activePlannedLessons();
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const upcoming = active.filter(lesson => {
      const plannedDate = new Date(lesson.plannedDate);
      return plannedDate >= today;
    });
    
    const thisMonth = active.filter(lesson => {
      const plannedDate = new Date(lesson.plannedDate);
      return plannedDate.getMonth() === currentMonth && 
             plannedDate.getFullYear() === currentYear;
    });
    
    // Contar por maestro
    const teacherCounts = new Map<string, number>();
    active.forEach(lesson => {
      const current = teacherCounts.get(lesson.plannedTeacherId) || 0;
      teacherCounts.set(lesson.plannedTeacherId, current + 1);
    });
    
    const lessonsByTeacher = Array.from(teacherCounts.entries()).map(([teacherId, count]) => ({
      teacherId,
      count
    }));
    
    return {
      totalPlanned: active.length,
      upcomingLessons: upcoming.length,
      lessonsThisMonth: thisMonth.length,
      lessonsByTeacher
    };
  });

  constructor() {
    this.initializeRealTimeListener();
    this.initializeUpcomingListener();
  }

  /**
   * Inicializar listener en tiempo real para todas las lecciones planificadas
   */
  private initializeRealTimeListener(): void {
    try {
      const plannedLessonsRef = collection(this.firebaseService.db, this.PLANNED_LESSONS_COLLECTION);
      const q = query(
        plannedLessonsRef, 
        orderBy('plannedDate', 'asc')
      );

      onSnapshot(q, 
        (snapshot: QuerySnapshot) => {
          const lessons = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data()['createdAt']?.toDate() || new Date(),
            updatedAt: doc.data()['updatedAt']?.toDate() || new Date()
          })) as PlannedLesson[];
          
          this.plannedLessonsSubject.next(lessons);
          this.setError(null);
        },
        (error) => {
          console.error('Error en listener de lecciones planificadas:', error);
          this.setError('Error al sincronizar lecciones planificadas');
        }
      );
    } catch (error) {
      console.error('Error al inicializar listener:', error);
      this.setError('Error al conectar con la base de datos');
    }
  }

  /**
   * Inicializar listener específico para lecciones próximas (para landing page)
   */
  private initializeUpcomingListener(): void {
    try {
      const today = this.dateService.getTodayDateString();
      const plannedLessonsRef = collection(this.firebaseService.db, this.PLANNED_LESSONS_COLLECTION);
      const q = query(
        plannedLessonsRef,
        where('active', '==', true),
        where('plannedDate', '>=', today),
        orderBy('plannedDate', 'asc'),
        firestoreLimit(10)
      );

      onSnapshot(q, 
        (snapshot: QuerySnapshot) => {
          const upcomingLessons = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data()['createdAt']?.toDate() || new Date(),
            updatedAt: doc.data()['updatedAt']?.toDate() || new Date()
          })) as PlannedLesson[];
          
          this.upcomingLessonsSubject.next(upcomingLessons);
        },
        (error) => {
          console.error('Error en listener de próximas lecciones:', error);
        }
      );
    } catch (error) {
      console.error('Error al inicializar listener de próximas lecciones:', error);
    }
  }

  /**
   * Obtener próximas lecciones planificadas (para landing page)
   */
  getUpcoming(limit: number = 5): Observable<PlannedLesson[]> {
    this.setError(null);
    
    const today = this.dateService.getTodayDateString();
    const plannedLessonsRef = collection(this.firebaseService.db, this.PLANNED_LESSONS_COLLECTION);
    const q = query(
      plannedLessonsRef,
      where('active', '==', true),
      where('plannedDate', '>=', today),
      orderBy('plannedDate', 'asc'),
      firestoreLimit(limit)
    );

    return from(getDocs(q)).pipe(
      map((querySnapshot: QuerySnapshot) => 
        querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data()['createdAt']?.toDate() || new Date(),
          updatedAt: doc.data()['updatedAt']?.toDate() || new Date()
        })) as PlannedLesson[]
      ),
      catchError(error => this.handleError('Error al obtener próximas lecciones', error))
    );
  }

  /**
   * Obtener lecciones por rango de fechas (para calendario)
   */
  getByDateRange(startDate: Date, endDate: Date): Observable<PlannedLesson[]> {
    this.setError(null);
    
    const startDateString = this.dateService.getDateString(startDate);
    const endDateString = this.dateService.getDateString(endDate);
    
    const plannedLessonsRef = collection(this.firebaseService.db, this.PLANNED_LESSONS_COLLECTION);
    const q = query(
      plannedLessonsRef,
      where('active', '==', true),
      where('plannedDate', '>=', startDateString),
      where('plannedDate', '<=', endDateString),
      orderBy('plannedDate', 'asc')
    );

    return from(getDocs(q)).pipe(
      map((querySnapshot: QuerySnapshot) => 
        querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data()['createdAt']?.toDate() || new Date(),
          updatedAt: doc.data()['updatedAt']?.toDate() || new Date()
        })) as PlannedLesson[]
      ),
      catchError(error => this.handleError('Error al obtener lecciones por rango de fechas', error))
    );
  }

  /**
   * Crear nueva lección planificada
   */
  create(lessonInput: CreatePlannedLessonInput, createdBy: string): Observable<string> {
    this.setLoading(true);
    this.setError(null);

    // Validar que la fecha no esté en el pasado
    const plannedDate = new Date(lessonInput.plannedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (plannedDate < today) {
      this.setLoading(false);
      return this.handleError('No se puede planificar una lección en el pasado', new Error('Fecha inválida'));
    }

    const newLesson: Omit<PlannedLesson, 'id'> = {
      plannedDate: lessonInput.plannedDate,
      unitNumber: lessonInput.unitNumber,
      lessonNumber: lessonInput.lessonNumber,
      plannedTeacherId: lessonInput.plannedTeacherId,
      active: true,
      createdBy,
      createdAt: Timestamp.now() as any,
      updatedAt: Timestamp.now() as any
    };

    const plannedLessonsRef = collection(this.firebaseService.db, this.PLANNED_LESSONS_COLLECTION);
    
    return from(addDoc(plannedLessonsRef, newLesson)).pipe(
      map((docRef: DocumentReference) => {
        console.log('✅ Lección planificada creada con ID:', docRef.id);
        this.setLoading(false);
        return docRef.id;
      }),
      catchError(error => this.handleError('Error al crear lección planificada', error))
    );
  }

  /**
   * Obtener lección planificada por ID
   */
  getById(lessonId: string): Observable<PlannedLesson | null> {
    this.setError(null);
    
    const lessonRef = doc(this.firebaseService.db, this.PLANNED_LESSONS_COLLECTION, lessonId);
    
    return from(getDoc(lessonRef)).pipe(
      map((docSnap: DocumentSnapshot) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            createdAt: data['createdAt']?.toDate() || new Date(),
            updatedAt: data['updatedAt']?.toDate() || new Date()
          } as PlannedLesson;
        }
        return null;
      }),
      catchError(error => this.handleError('Error al obtener lección planificada', error))
    );
  }

  /**
   * Actualizar lección planificada
   */
  update(lessonId: string, updates: Partial<PlannedLesson>): Observable<void> {
    this.setLoading(true);
    this.setError(null);

    const lessonRef = doc(this.firebaseService.db, this.PLANNED_LESSONS_COLLECTION, lessonId);
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    // Remover campos que no se deben actualizar directamente
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.createdBy;

    // Validar fecha si se está actualizando
    if (updates.plannedDate) {
      const plannedDate = new Date(updates.plannedDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (plannedDate < today) {
        this.setLoading(false);
        return this.handleError('No se puede planificar una lección en el pasado', new Error('Fecha inválida'));
      }
    }

    return from(updateDoc(lessonRef, updateData)).pipe(
      map(() => {
        console.log('✅ Lección planificada actualizada:', lessonId);
        this.setLoading(false);
      }),
      catchError(error => this.handleError('Error al actualizar lección planificada', error))
    );
  }

  /**
   * Soft delete - marcar lección como inactiva
   */
  deactivate(lessonId: string): Observable<void> {
    const updates: Partial<PlannedLesson> = {
      active: false
    };

    return this.update(lessonId, updates);
  }

  /**
   * Reactivar lección planificada
   */
  reactivate(lessonId: string): Observable<void> {
    const updates: Partial<PlannedLesson> = {
      active: true
    };

    return this.update(lessonId, updates);
  }

  /**
   * Eliminar lección permanentemente (usar con precaución)
   */
  deletePermanently(lessonId: string): Observable<void> {
    this.setLoading(true);
    this.setError(null);

    const lessonRef = doc(this.firebaseService.db, this.PLANNED_LESSONS_COLLECTION, lessonId);
    
    return from(deleteDoc(lessonRef)).pipe(
      map(() => {
        console.log('🗑️ Lección planificada eliminada permanentemente:', lessonId);
        this.setLoading(false);
      }),
      catchError(error => this.handleError('Error al eliminar lección planificada', error))
    );
  }

  /**
   * Obtener lecciones planificadas por maestro
   */
  getByTeacher(teacherId: string, includeInactive: boolean = false): Observable<PlannedLesson[]> {
    this.setError(null);
    
    const plannedLessonsRef = collection(this.firebaseService.db, this.PLANNED_LESSONS_COLLECTION);
    let q = query(
      plannedLessonsRef,
      where('plannedTeacherId', '==', teacherId),
      orderBy('plannedDate', 'desc')
    );

    // Si no incluir inactivas, agregar filtro
    if (!includeInactive) {
      q = query(
        plannedLessonsRef,
        where('plannedTeacherId', '==', teacherId),
        where('active', '==', true),
        orderBy('plannedDate', 'desc')
      );
    }

    return from(getDocs(q)).pipe(
      map((querySnapshot: QuerySnapshot) => {
        let lessons = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data()['createdAt']?.toDate() || new Date(),
          updatedAt: doc.data()['updatedAt']?.toDate() || new Date()
        })) as PlannedLesson[];

        // Si includeInactive es false pero no se pudo usar en la query, filtrar aquí
        if (!includeInactive) {
          lessons = lessons.filter(lesson => lesson.active);
        }

        return lessons;
      }),
      catchError(error => this.handleError('Error al obtener lecciones del maestro', error))
    );
  }

  /**
   * Obtener próximas lecciones de un maestro específico
   */
  getUpcomingByTeacher(teacherId: string, limit: number = 5): Observable<PlannedLesson[]> {
    this.setError(null);
    
    const today = this.dateService.getTodayDateString();
    const plannedLessonsRef = collection(this.firebaseService.db, this.PLANNED_LESSONS_COLLECTION);
    const q = query(
      plannedLessonsRef,
      where('plannedTeacherId', '==', teacherId),
      where('active', '==', true),
      where('plannedDate', '>=', today),
      orderBy('plannedDate', 'asc'),
      firestoreLimit(limit)
    );

    return from(getDocs(q)).pipe(
      map((querySnapshot: QuerySnapshot) => 
        querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data()['createdAt']?.toDate() || new Date(),
          updatedAt: doc.data()['updatedAt']?.toDate() || new Date()
        })) as PlannedLesson[]
      ),
      catchError(error => this.handleError('Error al obtener próximas lecciones del maestro', error))
    );
  }

  /**
   * Verificar conflictos de planificación (mismo maestro, misma fecha)
   */
  checkConflicts(teacherId: string, plannedDate: string, excludeLessonId?: string): Observable<PlannedLesson[]> {
    this.setError(null);
    
    const plannedLessonsRef = collection(this.firebaseService.db, this.PLANNED_LESSONS_COLLECTION);
    const q = query(
      plannedLessonsRef,
      where('plannedTeacherId', '==', teacherId),
      where('plannedDate', '==', plannedDate),
      where('active', '==', true)
    );

    return from(getDocs(q)).pipe(
      map((querySnapshot: QuerySnapshot) => {
        let conflicts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data()['createdAt']?.toDate() || new Date(),
          updatedAt: doc.data()['updatedAt']?.toDate() || new Date()
        })) as PlannedLesson[];

        // Excluir la lección que se está editando
        if (excludeLessonId) {
          conflicts = conflicts.filter(lesson => lesson.id !== excludeLessonId);
        }

        return conflicts;
      }),
      catchError(error => this.handleError('Error al verificar conflictos', error))
    );
  }

  /**
   * Obtener estadísticas de planificación para un período
   */
  getStatsByDateRange(startDate: Date, endDate: Date): Observable<{
    totalLessons: number;
    lessonsByTeacher: { teacherId: string; count: number }[];
    lessonsByUnit: { unitNumber: string; count: number }[];
  }> {
    return this.getByDateRange(startDate, endDate).pipe(
      map(lessons => {
        // Conteo por maestro
        const teacherCounts = new Map<string, number>();
        lessons.forEach(lesson => {
          const current = teacherCounts.get(lesson.plannedTeacherId) || 0;
          teacherCounts.set(lesson.plannedTeacherId, current + 1);
        });

        // Conteo por unidad
        const unitCounts = new Map<string, number>();
        lessons.forEach(lesson => {
          const current = unitCounts.get(lesson.unitNumber) || 0;
          unitCounts.set(lesson.unitNumber, current + 1);
        });

        return {
          totalLessons: lessons.length,
          lessonsByTeacher: Array.from(teacherCounts.entries()).map(([teacherId, count]) => ({
            teacherId, count
          })),
          lessonsByUnit: Array.from(unitCounts.entries()).map(([unitNumber, count]) => ({
            unitNumber, count
          }))
        };
      })
    );
  }

  // Métodos de utilidad privados

  private setLoading(loading: boolean): void {
    this.isLoadingSubject.next(loading);
  }

  private setError(error: string | null): void {
    this.errorSubject.next(error);
  }

  private handleError(message: string, error: any): Observable<any> {
    console.error(message, error);
    this.setError(`${message}: ${error.message || error}`);
    this.setLoading(false);
    return throwError(() => error);
  }

  /**
   * Limpiar error actual
   */
  clearError(): void {
    this.setError(null);
  }

  /**
   * Refrescar datos manualmente
   */
  refresh(): void {
    console.log('🔄 Refrescando datos de lecciones planificadas...');
    this.setError(null);
    // Los listeners en tiempo real se encargan de la actualización automática
  }
}