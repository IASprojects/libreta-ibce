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
  limit as firestoreLimit
} from 'firebase/firestore';
import { Observable, from, map, catchError, of, BehaviorSubject, throwError, combineLatest } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { DateService } from './date.service';
import { PlannedLessonService } from './planned-lesson.service';
import { LessonClass } from '../core/models/lesson-class.model';
import { PlannedLesson } from '../core/models/planned-lesson.model';

/**
 * Estructura para crear clase desde planificación
 */
export interface CreateFromPlannedInput {
  /** Fecha real de la clase (puede diferir de lo planificado) */
  date?: string;
  /** Unidad que realmente se dio (opcional, usa la planificada por defecto) */
  unitNumber?: string;
  /** Lección que realmente se dio (opcional, usa la planificada por defecto) */
  lessonNumber?: string;
  /** Maestro que dictó (opcional, usa el planificado por defecto) */
  teacherId?: string;
  /** Notas sobre la clase */
  notes?: string;
}

/**
 * Estructura para crear clase personalizada (no planificada)
 */
export interface CreateCustomClassInput {
  date: string;
  unitNumber: string;
  lessonNumber: string;
  teacherId: string;
  notes?: string;
}

/**
 * Estadísticas de clases
 */
export interface ClassStats {
  totalClasses: number;
  classesThisMonth: number;
  classesByTeacher: { teacherId: string; count: number }[];
  averageClassesPerMonth: number;
}

@Injectable({
  providedIn: 'root'
})
export class LessonClassService {
  private firebaseService = inject(FirebaseService);
  private dateService = inject(DateService);
  private plannedLessonService = inject(PlannedLessonService);

  // Collections
  private readonly LESSON_CLASSES_COLLECTION = 'lesson_classes';
  private readonly ATTENDANCE_COLLECTION = 'attendance';

  // Estados reactivos
  private lessonClassesSubject = new BehaviorSubject<LessonClass[]>([]);
  private todayClassSubject = new BehaviorSubject<LessonClass | null>(null);
  private recentClassesSubject = new BehaviorSubject<LessonClass[]>([]);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  
  // Signals públicos
  public readonly isLoading = toSignal(this.isLoadingSubject.asObservable(), { initialValue: false });
  public readonly error = toSignal(this.errorSubject.asObservable(), { initialValue: null });
  public readonly lessonClasses = toSignal(this.lessonClassesSubject.asObservable(), { initialValue: [] });
  public readonly todayClass = toSignal(this.todayClassSubject.asObservable(), { initialValue: null });
  public readonly recentClasses = toSignal(this.recentClassesSubject.asObservable(), { initialValue: [] });
  
  // Clases activas
  public readonly activeClasses = computed(() => 
    this.lessonClasses().filter(lessonClass => lessonClass.active)
  );
  
  // Verificar si ya existe clase hoy
  public readonly hasTodayClass = computed(() => this.todayClass() !== null);
  
  // Estadísticas computadas
  public readonly classStats = computed((): ClassStats => {
    const active = this.activeClasses();
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const thisMonth = active.filter(lessonClass => {
      const classDate = new Date(lessonClass.date);
      return classDate.getMonth() === currentMonth && 
             classDate.getFullYear() === currentYear;
    });
    
    // Contar por maestro
    const teacherCounts = new Map<string, number>();
    active.forEach(lessonClass => {
      const current = teacherCounts.get(lessonClass.teacherId) || 0;
      teacherCounts.set(lessonClass.teacherId, current + 1);
    });
    
    const classesByTeacher = Array.from(teacherCounts.entries()).map(([teacherId, count]) => ({
      teacherId,
      count
    }));
    
    // Calcular promedio de clases por mes
    const monthsWithClasses = new Set<string>();
    active.forEach(lessonClass => {
      const classDate = new Date(lessonClass.date);
      const monthKey = `${classDate.getFullYear()}-${classDate.getMonth()}`;
      monthsWithClasses.add(monthKey);
    });
    
    const averageClassesPerMonth = monthsWithClasses.size > 0 
      ? Math.round(active.length / monthsWithClasses.size) 
      : 0;
    
    return {
      totalClasses: active.length,
      classesThisMonth: thisMonth.length,
      classesByTeacher,
      averageClassesPerMonth
    };
  });

  constructor() {
    this.initializeRealTimeListener();
    this.initializeTodayListener();
    this.initializeRecentListener();
  }

  /**
   * Inicializar listener en tiempo real para todas las clases
   */
  private initializeRealTimeListener(): void {
    try {
      const lessonClassesRef = collection(this.firebaseService.db, this.LESSON_CLASSES_COLLECTION);
      const q = query(
        lessonClassesRef, 
        orderBy('date', 'desc')
      );

      onSnapshot(q, 
        (snapshot: QuerySnapshot) => {
          const classes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data()['createdAt']?.toDate() || new Date()
          })) as LessonClass[];
          
          this.lessonClassesSubject.next(classes);
          this.setError(null);
        },
        (error) => {
          console.error('Error en listener de clases:', error);
          this.setError('Error al sincronizar clases');
        }
      );
    } catch (error) {
      console.error('Error al inicializar listener:', error);
      this.setError('Error al conectar con la base de datos');
    }
  }

  /**
   * Inicializar listener para la clase de hoy
   */
  private initializeTodayListener(): void {
    try {
      const today = this.dateService.getTodayDateString();
      const lessonClassesRef = collection(this.firebaseService.db, this.LESSON_CLASSES_COLLECTION);
      const q = query(
        lessonClassesRef,
        where('date', '==', today),
        where('active', '==', true),
        firestoreLimit(1)
      );

      onSnapshot(q, 
        (snapshot: QuerySnapshot) => {
          if (snapshot.empty) {
            this.todayClassSubject.next(null);
          } else {
            const doc = snapshot.docs[0];
            const todayClass = {
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data()['createdAt']?.toDate() || new Date()
            } as LessonClass;
            
            this.todayClassSubject.next(todayClass);
          }
        },
        (error) => {
          console.error('Error en listener de clase de hoy:', error);
        }
      );
    } catch (error) {
      console.error('Error al inicializar listener de hoy:', error);
    }
  }

  /**
   * Inicializar listener para clases recientes
   * Nota: Filtramos active === true y ordenamos en cliente para evitar índice composite
   */
  private initializeRecentListener(): void {
    try {
      const lessonClassesRef = collection(this.firebaseService.db, this.LESSON_CLASSES_COLLECTION);
      // Query simplificada: solo filtro por active, ordenamos en cliente
      const q = query(
        lessonClassesRef,
        where('active', '==', true),
        firestoreLimit(50)  // Traer más registros para filtrar y ordenar en cliente
      );

      onSnapshot(q, 
        (snapshot: QuerySnapshot) => {
          const recentClasses = snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data()['createdAt']?.toDate() || new Date()
            }) as LessonClass)
            .sort((a, b) => {
              // Ordenar por date descendente en cliente
              const dateA = new Date(a.date);
              const dateB = new Date(b.date);
              return dateB.getTime() - dateA.getTime();
            })
            .slice(0, 10);
          
          this.recentClassesSubject.next(recentClasses);
        },
        (error) => {
          console.error('Error en listener de clases recientes:', error);
        }
      );
    } catch (error) {
      console.error('Error al inicializar listener de recientes:', error);
    }
  }

  /**
   * Obtener clases por fecha específica
   */
  getByDate(date: string): Observable<LessonClass[]> {
    this.setError(null);
    
    const lessonClassesRef = collection(this.firebaseService.db, this.LESSON_CLASSES_COLLECTION);
    const q = query(
      lessonClassesRef,
      where('date', '==', date),
      where('active', '==', true)
    );

    return from(getDocs(q)).pipe(
      map((querySnapshot: QuerySnapshot) => 
        querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data()['createdAt']?.toDate() || new Date()
        })) as LessonClass[]
      ),
      catchError(error => this.handleError('Error al obtener clases por fecha', error))
    );
  }

  /**
   * Crear clase desde lección planificada (permite variaciones)
   */
  createFromPlanned(
    plannedLessonId: string, 
    actualData: CreateFromPlannedInput, 
    createdBy: string
  ): Observable<string> {
    this.setLoading(true);
    this.setError(null);

    // Primero obtenemos la lección planificada
    return new Observable<string>(observer => {
      this.plannedLessonService.getById(plannedLessonId).subscribe({
        next: (plannedLesson) => {
          if (!plannedLesson) {
            observer.error(new Error('Lección planificada no encontrada'));
            return;
          }

          // Usar datos planificados como base, permitiendo sobrescritura
          const classData: Omit<LessonClass, 'id'> = {
            date: actualData.date || plannedLesson.plannedDate,
            plannedLessonId: plannedLessonId,
            unitNumber: actualData.unitNumber || plannedLesson.unitNumber || '',
            lessonNumber: actualData.lessonNumber || plannedLesson.lessonNumber || '',
            teacherId: actualData.teacherId || plannedLesson.plannedTeacherId,
            notes: actualData.notes || '',
            active: true,
            createdBy,
            createdAt: Timestamp.now() as any
          };

          const lessonClassesRef = collection(this.firebaseService.db, this.LESSON_CLASSES_COLLECTION);
          
          from(addDoc(lessonClassesRef, classData)).subscribe({
            next: (docRef: DocumentReference) => {
              console.log('✅ Clase creada desde planificación con ID:', docRef.id);
              this.setLoading(false);
              observer.next(docRef.id);
              observer.complete();
            },
            error: (error) => {
              console.error('Error al guardar clase:', error);
              this.setLoading(false);
              observer.error(error);
            }
          });
        },
        error: (error) => {
          console.error('Error al obtener lección planificada:', error);
          this.setLoading(false);
          observer.error(error);
        }
      });
    }).pipe(
      catchError(error => this.handleError<string>('Error al crear clase desde planificación', error))
    );
  }

  /**
   * Crear clase personalizada (no planificada)
   */
  createCustom(classData: CreateCustomClassInput, createdBy: string): Observable<string> {
    this.setLoading(true);
    this.setError(null);

    const newClass: Omit<LessonClass, 'id'> = {
      date: classData.date,
      unitNumber: classData.unitNumber,
      lessonNumber: classData.lessonNumber,
      teacherId: classData.teacherId,
      notes: classData.notes || '',
      active: true,
      createdBy,
      createdAt: Timestamp.now() as any
      // plannedLessonId se omite intencionalmente (clase no planificada)
    };

    const lessonClassesRef = collection(this.firebaseService.db, this.LESSON_CLASSES_COLLECTION);
    
    return from(addDoc(lessonClassesRef, newClass)).pipe(
      map((docRef: DocumentReference) => {
        console.log('✅ Clase personalizada creada con ID:', docRef.id);
        this.setLoading(false);
        return docRef.id;
      }),
      catchError(error => this.handleError('Error al crear clase personalizada', error))
    );
  }

  /**
   * Obtener clase por ID
   */
  getById(classId: string): Observable<LessonClass | null> {
    this.setError(null);
    
    const classRef = doc(this.firebaseService.db, this.LESSON_CLASSES_COLLECTION, classId);
    
    return from(getDoc(classRef)).pipe(
      map((docSnap: DocumentSnapshot) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            createdAt: data['createdAt']?.toDate() || new Date()
          } as LessonClass;
        }
        return null;
      }),
      catchError(error => this.handleError('Error al obtener clase', error))
    );
  }

  /**
   * Actualizar clase existente
   */
  update(classId: string, updates: Partial<LessonClass>): Observable<void> {
    this.setLoading(true);
    this.setError(null);

    const classRef = doc(this.firebaseService.db, this.LESSON_CLASSES_COLLECTION, classId);
    const updateData = { ...updates };

    // Remover campos que no se deben actualizar directamente
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.createdBy;

    return from(updateDoc(classRef, updateData)).pipe(
      map(() => {
        console.log('✅ Clase actualizada:', classId);
        this.setLoading(false);
      }),
      catchError(error => this.handleError('Error al actualizar clase', error))
    );
  }

  /**
   * Marcar clase como inactiva (cancelada)
   */
  deactivate(classId: string, reason?: string): Observable<void> {
    const updates: Partial<LessonClass> = {
      active: false,
      notes: reason ? `[CANCELADA] ${reason}` : '[CANCELADA] Clase marcada como inactiva'
    };

    return this.update(classId, updates);
  }

  /**
   * Reactivar clase
   */
  reactivate(classId: string): Observable<void> {
    const updates: Partial<LessonClass> = {
      active: true
    };

    return this.update(classId, updates);
  }

  /**
   * Obtener clases recientes con límite
   */
  getRecent(limit: number = 10): Observable<LessonClass[]> {
    this.setError(null);
    
    const lessonClassesRef = collection(this.firebaseService.db, this.LESSON_CLASSES_COLLECTION);
    const q = query(
      lessonClassesRef,
      where('active', '==', true),
      orderBy('date', 'desc'),
      firestoreLimit(limit)
    );

    return from(getDocs(q)).pipe(
      map((querySnapshot: QuerySnapshot) => 
        querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data()['createdAt']?.toDate() || new Date()
        })) as LessonClass[]
      ),
      catchError(error => this.handleError('Error al obtener clases recientes', error))
    );
  }

  /**
   * Obtener clases por maestro
   */
  getByTeacher(teacherId: string, limit?: number): Observable<LessonClass[]> {
    this.setError(null);
    
    const lessonClassesRef = collection(this.firebaseService.db, this.LESSON_CLASSES_COLLECTION);
    let q = query(
      lessonClassesRef,
      where('teacherId', '==', teacherId),
      where('active', '==', true),
      orderBy('date', 'desc')
    );

    if (limit) {
      q = query(
        lessonClassesRef,
        where('teacherId', '==', teacherId),
        where('active', '==', true),
        orderBy('date', 'desc'),
        firestoreLimit(limit)
      );
    }

    return from(getDocs(q)).pipe(
      map((querySnapshot: QuerySnapshot) => 
        querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data()['createdAt']?.toDate() || new Date()
        })) as LessonClass[]
      ),
      catchError(error => this.handleError('Error al obtener clases del maestro', error))
    );
  }

  /**
   * Obtener clases por rango de fechas
   */
  getByDateRange(startDate: string, endDate: string): Observable<LessonClass[]> {
    this.setError(null);
    
    const lessonClassesRef = collection(this.firebaseService.db, this.LESSON_CLASSES_COLLECTION);
    const q = query(
      lessonClassesRef,
      where('active', '==', true),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );

    return from(getDocs(q)).pipe(
      map((querySnapshot: QuerySnapshot) => 
        querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data()['createdAt']?.toDate() || new Date()
        })) as LessonClass[]
      ),
      catchError(error => this.handleError('Error al obtener clases por rango', error))
    );
  }

  /**
   * Verificar si ya existe clase para una fecha
   */
  checkExistingClass(date: string): Observable<LessonClass | null> {
    return this.getByDate(date).pipe(
      map(classes => classes.length > 0 ? classes[0] : null)
    );
  }

  /**
   * Obtener conteo de asistentes para una clase específica
   * Requiere integración con AttendanceService
   */
  getClassAttendanceCount(classId: string): Observable<{
    present: number;
    absent: number;
    total: number;
    percentage: number;
  }> {
    const attendanceRef = collection(this.firebaseService.db, this.ATTENDANCE_COLLECTION);
    const q = query(
      attendanceRef,
      where('lessonClassId', '==', classId),
      where('inactive', '!=', true)
    );

    return from(getDocs(q)).pipe(
      map((querySnapshot: QuerySnapshot) => {
        const attendances = querySnapshot.docs.map(doc => doc.data());
        const present = attendances.filter((att: any) => att.present).length;
        const total = attendances.length;
        const absent = total - present;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

        return { present, absent, total, percentage };
      }),
      catchError(error => {
        console.error('Error al obtener conteo de asistencias:', error);
        return of({ present: 0, absent: 0, total: 0, percentage: 0 });
      })
    );
  }

  /**
   * Eliminar clase permanentemente (usar con precaución)
   */
  deletePermanently(classId: string): Observable<void> {
    this.setLoading(true);
    this.setError(null);

    const classRef = doc(this.firebaseService.db, this.LESSON_CLASSES_COLLECTION, classId);
    
    return from(deleteDoc(classRef)).pipe(
      map(() => {
        console.log('🗑️ Clase eliminada permanentemente:', classId);
        this.setLoading(false);
      }),
      catchError(error => this.handleError('Error al eliminar clase', error))
    );
  }

  // Métodos de utilidad privados

  private setLoading(loading: boolean): void {
    this.isLoadingSubject.next(loading);
  }

  private setError(error: string | null): void {
    this.errorSubject.next(error);
  }

  private handleError<T = any>(message: string, error: any): Observable<T> {
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
    console.log('🔄 Refrescando datos de clases...');
    this.setError(null);
    // Los listeners en tiempo real se encargan de la actualización automática
  }
}