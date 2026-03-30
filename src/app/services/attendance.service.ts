import { Injectable, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  writeBatch,
  Timestamp,
  DocumentSnapshot,
  QuerySnapshot,
  DocumentReference,
  limit
} from 'firebase/firestore';
import { Observable, from, map, catchError, of, BehaviorSubject, throwError, switchMap } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { StudentService } from './student.service';
import { DateService } from './date.service';
import { Attendance } from '../core/models/attendance.model';
import { AttendanceType } from '../core/models/enums';
import { LessonClass } from '../core/models/lesson-class.model';
import { Student } from '../core/models/student.model';

/**
 * Estructura para registro en lote
 */
export interface BatchAttendanceInput {
  studentId: string;
  present: boolean;
  notes?: string;
  type?: AttendanceType;
}

/**
 * Resumen de asistencia para el dashboard
 */
export interface TodaySummary {
  date: string;
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  attendancePercentage: number;
  lessonClassId?: string;
  newVisitors: number;
  firstTimeAttendees: number;
}

/**
 * Rango de fechas para consultas
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private firebaseService = inject(FirebaseService);
  private studentService = inject(StudentService);
  private dateService = inject(DateService);

  // Collections
  private readonly ATTENDANCE_COLLECTION = 'attendance';
  private readonly LESSON_CLASSES_COLLECTION = 'lesson_classes';

  // Estados reactivos
  private attendancesSubject = new BehaviorSubject<Attendance[]>([]);
  private todayAttendancesSubject = new BehaviorSubject<Attendance[]>([]);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  
  // Signals públicos
  public readonly isLoading = toSignal(this.isLoadingSubject.asObservable(), { initialValue: false });
  public readonly error = toSignal(this.errorSubject.asObservable(), { initialValue: null });
  public readonly attendances = toSignal(this.attendancesSubject.asObservable(), { initialValue: [] });
  public readonly todayAttendances = toSignal(this.todayAttendancesSubject.asObservable(), { initialValue: [] });
  
  // Resumen de hoy
  public readonly todaySummary = computed(() => this.calculateTodaySummary());

  constructor() {
    this.initializeTodayListener();
  }

  /**
   * Inicializar listener para asistencias del día actual
   */
  private initializeTodayListener(): void {
    try {
      const today = this.dateService.getTodayDateString();
      const attendanceRef = collection(this.firebaseService.db, this.ATTENDANCE_COLLECTION);
      
      // Buscar asistencias de hoy por referencia a lesson_classes de hoy
      this.getTodayLessonClass().subscribe(lessonClass => {
        if (lessonClass) {
          const q = query(
            attendanceRef,
            where('lessonClassId', '==', lessonClass.id),
            where('inactive', '==', false)
          );

          onSnapshot(q, 
            (snapshot: QuerySnapshot) => {
              const attendances = snapshot.docs
                .map(doc => ({
                  id: doc.id,
                  ...doc.data(),
                  registeredAt: doc.data()['registeredAt']?.toDate() || new Date(),
                  updatedAt: doc.data()['updatedAt']?.toDate() || new Date()
                }))
                .sort((a, b) => b.registeredAt.getTime() - a.registeredAt.getTime()) as Attendance[];
              
              this.todayAttendancesSubject.next(attendances);
              this.setError(null);
            },
            (error) => {
              console.error('Error en listener de asistencias de hoy:', error);
              this.setError('Error al sincronizar asistencias');
            }
          );
        }
      });
    } catch (error) {
      console.error('Error al inicializar listener de hoy:', error);
      this.setError('Error al conectar con las asistencias de hoy');
    }
  }

  /**
   * Registrar asistencias en lote para una clase
   */
  markBatch(
    lessonClassId: string, 
    attendances: BatchAttendanceInput[], 
    registeredBy: string
  ): Observable<string[]> {
    this.setLoading(true);
    this.setError(null);

    if (attendances.length === 0) {
      this.setLoading(false);
      return of([]);
    }

    const batch = writeBatch(this.firebaseService.db);
    const attendanceIds: string[] = [];

    try {
      attendances.forEach(attendance => {
        const attendanceRef = doc(collection(this.firebaseService.db, this.ATTENDANCE_COLLECTION));
        attendanceIds.push(attendanceRef.id);

        const attendanceData: Omit<Attendance, 'id'> = {
          lessonClassId,
          studentId: attendance.studentId,
          present: attendance.present,
          notes: attendance.notes || '',
          type: attendance.type || AttendanceType.REGULAR,
          registeredBy,
          registeredAt: Timestamp.now() as any,
          updatedAt: Timestamp.now() as any,
          inactive: false,
          synced: true // Asumir que está sincronizado al momento del registro
        };

        batch.set(attendanceRef, attendanceData);
      });

      return from(batch.commit()).pipe(
        map(() => {
          console.log(`✅ ${attendances.length} asistencias registradas en lote`);
          this.setLoading(false);
          
          // Actualizar estadísticas de estudiantes afectados
          this.updateAffectedStudentsStats(attendances.map(a => a.studentId));
          
          return attendanceIds;
        }),
        catchError(error => this.handleError('Error al registrar asistencias en lote', error))
      );

    } catch (error) {
      return this.handleError('Error al preparar lote de asistencias', error);
    }
  }

  /**
   * Guarda el estado completo de asistencia de una clase, creando o actualizando sin duplicados.
   */
  saveLessonAttendance(
    lessonClassId: string,
    attendances: BatchAttendanceInput[],
    registeredBy: string
  ): Observable<void> {
    this.setLoading(true);
    this.setError(null);

    return this.getByLessonClass(lessonClassId).pipe(
      switchMap(existingAttendances => {
        const batch = writeBatch(this.firebaseService.db);
        const existingByStudentId = new Map(
          existingAttendances.map(attendance => [attendance.studentId, attendance])
        );
        const submittedStudentIds = new Set(attendances.map(attendance => attendance.studentId));

        attendances.forEach(attendance => {
          const existingAttendance = existingByStudentId.get(attendance.studentId);

          if (existingAttendance) {
            batch.update(
              doc(this.firebaseService.db, this.ATTENDANCE_COLLECTION, existingAttendance.id),
              {
                present: attendance.present,
                notes: attendance.notes || '',
                type: attendance.type || AttendanceType.REGULAR,
                registeredBy,
                inactive: false,
                synced: true,
                updatedAt: Timestamp.now()
              }
            );
            return;
          }

          const attendanceRef = doc(collection(this.firebaseService.db, this.ATTENDANCE_COLLECTION));
          const attendanceData: Omit<Attendance, 'id'> = {
            lessonClassId,
            studentId: attendance.studentId,
            present: attendance.present,
            notes: attendance.notes || '',
            type: attendance.type || AttendanceType.REGULAR,
            registeredBy,
            registeredAt: Timestamp.now() as any,
            updatedAt: Timestamp.now() as any,
            inactive: false,
            synced: true
          };

          batch.set(attendanceRef, attendanceData);
        });

        existingAttendances.forEach(attendance => {
          if (submittedStudentIds.has(attendance.studentId)) {
            return;
          }

          batch.update(
            doc(this.firebaseService.db, this.ATTENDANCE_COLLECTION, attendance.id),
            {
              inactive: true,
              updatedAt: Timestamp.now(),
              notes: attendance.notes || '[CORREGIDO] Registro reemplazado por una edición posterior'
            }
          );
        });

        const affectedStudentIds = [
          ...new Set([
            ...existingAttendances.map(attendance => attendance.studentId),
            ...attendances.map(attendance => attendance.studentId)
          ])
        ];

        if (affectedStudentIds.length === 0) {
          this.setLoading(false);
          return of(void 0);
        }

        return from(batch.commit()).pipe(
          map(() => {
            console.log(`✅ Asistencia sincronizada para clase: ${lessonClassId}`);
            this.setLoading(false);
            this.updateAffectedStudentsStats(affectedStudentIds);
          })
        );
      }),
      catchError(error => this.handleError('Error al guardar asistencia de la clase', error))
    );
  }

  /**
   * Obtener asistencias por clase
   */
  getByLessonClass(lessonClassId: string): Observable<Attendance[]> {
    this.setError(null);
    
    const attendanceRef = collection(this.firebaseService.db, this.ATTENDANCE_COLLECTION);
    const q = query(
      attendanceRef,
      where('lessonClassId', '==', lessonClassId),
      where('inactive', '==', false)
    );

    return from(getDocs(q)).pipe(
      map((querySnapshot: QuerySnapshot) =>
        querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            registeredAt: doc.data()['registeredAt']?.toDate() || new Date(),
            updatedAt: doc.data()['updatedAt']?.toDate() || new Date()
          }))
          .sort((a, b) => b.registeredAt.getTime() - a.registeredAt.getTime()) as Attendance[]
      ),
      catchError(error => this.handleError('Error al obtener asistencias por clase', error))
    );
  }

  /**
   * Obtener asistencias por estudiante en un rango de fechas
   */
  getByStudent(studentId: string, dateRange?: DateRange): Observable<Attendance[]> {
    this.setError(null);
    
    const attendanceRef = collection(this.firebaseService.db, this.ATTENDANCE_COLLECTION);
    const q = query(
      attendanceRef,
      where('studentId', '==', studentId),
      where('inactive', '==', false)
    );

    return from(getDocs(q)).pipe(
      map((querySnapshot: QuerySnapshot) => {
        let attendances = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          registeredAt: doc.data()['registeredAt']?.toDate() || new Date(),
          updatedAt: doc.data()['updatedAt']?.toDate() || new Date()
        })) as Attendance[];

        attendances = attendances.sort((a, b) => b.registeredAt.getTime() - a.registeredAt.getTime());

        // Filtrar por rango de fechas en el frontend si es necesario
        if (dateRange) {
          attendances = attendances.filter(att => 
            att.registeredAt >= dateRange.startDate && 
            att.registeredAt <= dateRange.endDate
          );
        }

        return attendances;
      }),
      catchError(error => this.handleError('Error al obtener asistencias del estudiante', error))
    );
  }

  /**
   * Actualizar asistencia (para correcciones)
   */
  updateAttendance(attendanceId: string, updates: Partial<Attendance>): Observable<void> {
    this.setLoading(true);
    this.setError(null);

    const attendanceRef = doc(this.firebaseService.db, this.ATTENDANCE_COLLECTION, attendanceId);
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    // Remover campos que no se deben actualizar directamente
    delete updateData.id;
    delete updateData.registeredAt;

    return from(updateDoc(attendanceRef, updateData)).pipe(
      map(() => {
        console.log('✅ Asistencia actualizada:', attendanceId);
        this.setLoading(false);
        
        // Si se actualizó el estado de presente/ausente, recalcular estadísticas
        if (updates.present !== undefined) {
          this.getAttendanceById(attendanceId).subscribe(attendance => {
            if (attendance) {
              this.updateAffectedStudentsStats([attendance.studentId]);
            }
          });
        }
      }),
      catchError(error => this.handleError('Error al actualizar asistencia', error))
    );
  }

  /**
   * Marcar asistencia como inactiva (para correcciones sin eliminar)
   */
  deactivateAttendance(attendanceId: string, notes?: string): Observable<void> {
    const updates: Partial<Attendance> = {
      inactive: true,
      notes: notes ? `[CORREGIDO] ${notes}` : '[CORREGIDO] Asistencia marcada como inactiva'
    };

    return this.updateAttendance(attendanceId, updates);
  }

  /**
   * Reactivar asistencia
   */
  reactivateAttendance(attendanceId: string): Observable<void> {
    const updates: Partial<Attendance> = {
      inactive: false
    };

    return this.updateAttendance(attendanceId, updates);
  }

  /**
   * Obtener resumen del día para el dashboard
   */
  getTodaySummary(): Observable<TodaySummary> {
    return this.getTodayLessonClass().pipe(
      map(lessonClass => {
        const todayAttendances = this.todayAttendances();
        const activeStudents = this.studentService.activeStudents();
        
        const presentStudents = todayAttendances.filter(att => att.present).length;
        const totalStudents = activeStudents.length;
        const absentStudents = Math.max(0, totalStudents - presentStudents);
        const attendancePercentage = totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0;
        
        const newVisitors = todayAttendances.filter(att => 
          att.present && att.type === AttendanceType.VISITOR
        ).length;
        
        const firstTimeAttendees = todayAttendances.filter(att => 
          att.present && att.type === AttendanceType.FIRST_TIME
        ).length;

        return {
          date: this.dateService.getTodayDateString(),
          totalStudents,
          presentStudents,
          absentStudents,
          attendancePercentage,
          lessonClassId: lessonClass?.id,
          newVisitors,
          firstTimeAttendees
        };
      })
    );
  }

  /**
   * Obtener la clase de hoy (si existe)
   */
  private getTodayLessonClass(): Observable<LessonClass | null> {
    const today = this.dateService.getTodayDateString();
    const lessonClassRef = collection(this.firebaseService.db, this.LESSON_CLASSES_COLLECTION);
    const q = query(
      lessonClassRef,
      where('date', '==', today),
      where('active', '==', true),
      limit(1)
    );

    return from(getDocs(q)).pipe(
      map((querySnapshot: QuerySnapshot) => {
        if (querySnapshot.empty) return null;
        
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data()['createdAt']?.toDate() || new Date()
        } as LessonClass;
      }),
      catchError(error => {
        console.error('Error al obtener clase de hoy:', error);
        return of(null);
      })
    );
  }

  /**
   * Calcular resumen de hoy desde los signals
   */
  private calculateTodaySummary(): TodaySummary {
    const todayAttendances = this.todayAttendances();
    const activeStudents = this.studentService.activeStudents();
    
    const presentStudents = todayAttendances.filter(att => att.present).length;
    const totalStudents = activeStudents.length;
    const absentStudents = Math.max(0, totalStudents - presentStudents);
    const attendancePercentage = totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0;
    
    const newVisitors = todayAttendances.filter(att => 
      att.present && att.type === AttendanceType.VISITOR
    ).length;
    
    const firstTimeAttendees = todayAttendances.filter(att => 
      att.present && att.type === AttendanceType.FIRST_TIME
    ).length;

    return {
      date: this.dateService.getTodayDateString(),
      totalStudents,
      presentStudents,
      absentStudents,
      attendancePercentage,
      newVisitors,
      firstTimeAttendees
    };
  }

  /**
   * Obtener asistencia por ID
   */
  private getAttendanceById(attendanceId: string): Observable<Attendance | null> {
    const attendanceRef = doc(this.firebaseService.db, this.ATTENDANCE_COLLECTION, attendanceId);
    
    return from(getDoc(attendanceRef)).pipe(
      map((docSnap: DocumentSnapshot) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            registeredAt: data['registeredAt']?.toDate() || new Date(),
            updatedAt: data['updatedAt']?.toDate() || new Date()
          } as Attendance;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error al obtener asistencia:', error);
        return of(null);
      })
    );
  }

  /**
   * Actualizar estadísticas de estudiantes afectados
   */
  private updateAffectedStudentsStats(studentIds: string[]): void {
    // Eliminar duplicados
    const uniqueStudentIds = [...new Set(studentIds)];
    
    // Actualizar estadísticas de cada estudiante (sin bloquear la operación principal)
    uniqueStudentIds.forEach(studentId => {
      this.studentService.updateStudentStats(studentId).subscribe({
        next: () => console.log(`✅ Estadísticas actualizadas para estudiante: ${studentId}`),
        error: (error) => console.error(`❌ Error actualizando estadísticas para ${studentId}:`, error)
      });
    });
  }

  /**
   * Obtener estadísticas de asistencia por período
   */
  getAttendanceStatsByPeriod(startDate: Date, endDate: Date): Observable<{
    totalClasses: number;
    averageAttendance: number;
    bestAttendanceDay: string;
    worstAttendanceDay: string;
  }> {
    const attendanceRef = collection(this.firebaseService.db, this.ATTENDANCE_COLLECTION);
    const q = query(
      attendanceRef,
      where('registeredAt', '>=', Timestamp.fromDate(startDate)),
      where('registeredAt', '<=', Timestamp.fromDate(endDate)),
      where('inactive', '==', false)
    );

    return from(getDocs(q)).pipe(
      map((querySnapshot: QuerySnapshot) => {
        const attendances = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          registeredAt: doc.data()['registeredAt']?.toDate() || new Date()
        })) as Attendance[];

        // Agrupar por día y calcular estadísticas
        const attendancesByDay = new Map<string, {present: number, total: number}>();
        
        attendances.forEach(att => {
          const dayKey = this.dateService.getDateString(att.registeredAt);
          if (!attendancesByDay.has(dayKey)) {
            attendancesByDay.set(dayKey, {present: 0, total: 0});
          }
          const dayStats = attendancesByDay.get(dayKey)!;
          dayStats.total++;
          if (att.present) dayStats.present++;
        });

        const totalClasses = attendancesByDay.size;
        let totalAttendanceRate = 0;
        let bestDay = '';
        let worstDay = '';
        let bestRate = 0;
        let worstRate = 100;

        attendancesByDay.forEach((stats, day) => {
          const rate = stats.total > 0 ? (stats.present / stats.total) * 100 : 0;
          totalAttendanceRate += rate;
          
          if (rate > bestRate) {
            bestRate = rate;
            bestDay = day;
          }
          if (rate < worstRate) {
            worstRate = rate;
            worstDay = day;
          }
        });

        return {
          totalClasses,
          averageAttendance: totalClasses > 0 ? Math.round(totalAttendanceRate / totalClasses) : 0,
          bestAttendanceDay: bestDay,
          worstAttendanceDay: worstDay
        };
      }),
      catchError(error => this.handleError('Error al calcular estadísticas de período', error))
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
    console.log('🔄 Refrescando datos de asistencias...');
    this.setError(null);
    // Los listeners en tiempo real se encargan de la actualización automática
  }

  // TODO: Integración con OfflineService (pendiente)
  /**
   * Preparado para integración con OfflineService
   */
  private async syncPendingAttendances(): Promise<void> {
    // Este método se implementará cuando esté disponible el OfflineService
    console.log('🔄 Sincronización offline pendiente de implementar...');
  }
}