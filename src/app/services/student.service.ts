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
  writeBatch,
  Timestamp,
  DocumentSnapshot,
  QuerySnapshot,
  DocumentReference
} from 'firebase/firestore';
import { Observable, from, map, catchError, of, BehaviorSubject, throwError } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { Student, StudentStats } from '../core/models/student.model';
import { Attendance } from '../core/models/attendance.model';
import { DateService } from './date.service';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private firebaseService = inject(FirebaseService);
  private dateService = inject(DateService);

  // Collections
  private readonly STUDENTS_COLLECTION = 'students';
  private readonly ATTENDANCE_COLLECTION = 'attendance';

  // Estados reactivos
  private studentsSubject = new BehaviorSubject<Student[]>([]);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  
  // Signals públicos
  public readonly isLoading = toSignal(this.isLoadingSubject.asObservable(), { initialValue: false });
  public readonly error = toSignal(this.errorSubject.asObservable(), { initialValue: null });
  public readonly students = toSignal(this.studentsSubject.asObservable(), { initialValue: [] });
  
  // Estudiantes activos
  public readonly activeStudents = computed(() => 
    this.students().filter(student => student.active)
  );
  
  // Estudiantes inactivos
  public readonly inactiveStudents = computed(() => 
    this.students().filter(student => !student.active)
  );

  // Estadísticas generales
  public readonly studentsCount = computed(() => this.activeStudents().length);
  public readonly birthdaysThisMonth = computed(() => {
    const currentMonth = new Date().getMonth();
    return this.activeStudents().filter(student => {
      const birthDate = new Date(student.birthDate);
      return birthDate.getMonth() === currentMonth;
    });
  });

  constructor() {
    this.initializeRealTimeListener();
  }

  /**
   * Inicializar listener en tiempo real para estudiantes
   */
  private initializeRealTimeListener(): void {
    try {
      const studentsRef = collection(this.firebaseService.db, this.STUDENTS_COLLECTION);
      const q = query(studentsRef, orderBy('name'));

      onSnapshot(q, 
        (snapshot: QuerySnapshot) => {
          const students = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            registeredAt: doc.data()['registeredAt']?.toDate() || new Date(),
            updatedAt: doc.data()['updatedAt']?.toDate() || new Date()
          })) as Student[];
          
          this.studentsSubject.next(students);
          this.setError(null);
        },
        (error) => {
          console.error('Error en listener de estudiantes:', error);
          this.setError('Error al sincronizar estudiantes');
          // En caso de error, intentar cargar desde cache/offline
          this.loadStudentsFromCache();
        }
      );
    } catch (error) {
      console.error('Error al inicializar listener:', error);
      this.setError('Error al conectar con la base de datos');
    }
  }

  /**
   * Cargar estudiantes desde cache (fallback offline)
   */
  private async loadStudentsFromCache(): Promise<void> {
    try {
      // Implementar lógica de cache offline aquí si es necesario
      // Por ahora devolvemos array vacío
      console.log('🔄 Intentando cargar desde cache offline...');
    } catch (error) {
      console.error('Error al cargar cache offline:', error);
    }
  }

  /**
   * Crear nuevo estudiante
   */
  createStudent(studentData: Omit<Student, 'id' | 'registeredAt' | 'updatedAt' | 'active' | 'stats'>): Observable<string> {
    this.setLoading(true);
    this.setError(null);

    const newStudent = {
      ...studentData,
      active: true, // Por defecto activo
      registeredAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      stats: {
        totalAttendances: 0,
        currentStreak: 0,
        last3MonthsPercentage: 0
      }
    };

    const studentsRef = collection(this.firebaseService.db, this.STUDENTS_COLLECTION);
    
    return from(addDoc(studentsRef, newStudent)).pipe(
      map((docRef: DocumentReference) => {
        console.log('✅ Estudiante creado con ID:', docRef.id);
        this.setLoading(false);
        return docRef.id;
      }),
      catchError(error => this.handleError('Error al crear estudiante', error))
    );
  }

  /**
   * Obtener estudiante por ID
   */
  getStudentById(studentId: string): Observable<Student | null> {
    this.setError(null);
    
    const studentRef = doc(this.firebaseService.db, this.STUDENTS_COLLECTION, studentId);
    
    return from(getDoc(studentRef)).pipe(
      map((docSnap: DocumentSnapshot) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            registeredAt: data['registeredAt']?.toDate() || new Date(),
            updatedAt: data['updatedAt']?.toDate() || new Date()
          } as Student;
        }
        return null;
      }),
      catchError(error => this.handleError('Error al obtener estudiante', error))
    );
  }

  /**
   * Actualizar estudiante
   */
  updateStudent(studentId: string, updates: Partial<Student>): Observable<void> {
    this.setLoading(true);
    this.setError(null);

    const studentRef = doc(this.firebaseService.db, this.STUDENTS_COLLECTION, studentId);
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    // Remover campos que no se deben actualizar directamente
    delete updateData.id;
    delete updateData.registeredAt;

    return from(updateDoc(studentRef, updateData)).pipe(
      map(() => {
        console.log('✅ Estudiante actualizado:', studentId);
        this.setLoading(false);
      }),
      catchError(error => this.handleError('Error al actualizar estudiante', error))
    );
  }

  /**
   * Soft delete - marcar estudiante como inactivo
   */
  deactivateStudent(studentId: string, notes?: string): Observable<void> {
    const updates: Partial<Student> = {
      active: false,
      notes: notes ? `[INACTIVO] ${notes}` : '[INACTIVO] Estudiante marcado como inactivo'
    };

    return this.updateStudent(studentId, updates);
  }

  /**
   * Reactivar estudiante
   */
  reactivateStudent(studentId: string): Observable<void> {
    const updates: Partial<Student> = {
      active: true
    };

    return this.updateStudent(studentId, updates);
  }

  /**
   * Eliminar estudiante permanentemente (usar con precaución)
   */
  deleteStudentPermanently(studentId: string): Observable<void> {
    this.setLoading(true);
    this.setError(null);

    const studentRef = doc(this.firebaseService.db, this.STUDENTS_COLLECTION, studentId);
    
    return from(deleteDoc(studentRef)).pipe(
      map(() => {
        console.log('🗑️ Estudiante eliminado permanentemente:', studentId);
        this.setLoading(false);
      }),
      catchError(error => this.handleError('Error al eliminar estudiante', error))
    );
  }

  /**
   * Buscar estudiantes por nombre (case insensitive)
   */
  searchStudentsByName(searchTerm: string): Observable<Student[]> {
    this.setError(null);
    
    if (!searchTerm.trim()) {
      return of([]);
    }

    const studentsRef = collection(this.firebaseService.db, this.STUDENTS_COLLECTION);
    const q = query(
      studentsRef,
      where('active', '==', true),
      orderBy('name')
    );

    return from(getDocs(q)).pipe(
      map((querySnapshot: QuerySnapshot) => {
        const allStudents = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          registeredAt: doc.data()['registeredAt']?.toDate() || new Date(),
          updatedAt: doc.data()['updatedAt']?.toDate() || new Date()
        })) as Student[];

        // Filtro case insensitive en el frontend
        const searchLower = searchTerm.toLowerCase();
        return allStudents.filter(student => 
          student.name.toLowerCase().includes(searchLower)
        );
      }),
      catchError(error => this.handleError('Error al buscar estudiantes', error))
    );
  }

  /**
   * Actualizar estadísticas de un estudiante
   */
  updateStudentStats(studentId: string): Observable<void> {
    this.setError(null);

    return from(this.calculateStudentStats(studentId)).pipe(
      map(stats => this.updateStudent(studentId, { stats }).subscribe()),
      catchError(error => this.handleError('Error al actualizar estadísticas', error))
    );
  }

  /**
   * Calcular estadísticas de asistencia para un estudiante
   */
  private async calculateStudentStats(studentId: string): Promise<StudentStats> {
    try {
      const attendanceRef = collection(this.firebaseService.db, this.ATTENDANCE_COLLECTION);
      const q = query(
        attendanceRef,
        where('studentId', '==', studentId),
        where('present', '==', true),
        orderBy('registeredAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const attendances = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        registeredAt: doc.data()['registeredAt']?.toDate() || new Date()
      })) as Attendance[];

      // Total de asistencias
      const totalAttendances = attendances.length;

      // Streak actual (asistencias consecutivas desde la última clase)
      const currentStreak = this.calculateCurrentStreak(attendances);

      // Porcentaje de los últimos 3 meses
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const recentAttendances = attendances.filter(att => 
        att.registeredAt >= threeMonthsAgo
      );

      // Para calcular el porcentaje necesitamos el total de clases en los últimos 3 meses
      // Esto requiere consultar todas las clases, por simplicidad usaremos una aproximación
      const last3MonthsPercentage = recentAttendances.length > 0 
        ? Math.min(100, Math.round((recentAttendances.length / 12) * 100)) // Aproximado: 1 clase por semana
        : 0;

      return {
        totalAttendances,
        currentStreak,
        last3MonthsPercentage
      };

    } catch (error) {
      console.error('Error calculando estadísticas:', error);
      return {
        totalAttendances: 0,
        currentStreak: 0,
        last3MonthsPercentage: 0
      };
    }
  }

  /**
   * Calcular racha actual de asistencias consecutivas
   */
  private calculateCurrentStreak(attendances: Attendance[]): number {
    if (attendances.length === 0) return 0;

    // Ordenar por fecha descendente
    const sortedAttendances = attendances.sort((a, b) => 
      b.registeredAt.getTime() - a.registeredAt.getTime()
    );

    let streak = 0;
    let currentDate = new Date();

    for (const attendance of sortedAttendances) {
      const attendanceDate = attendance.registeredAt;
      const daysDiff = this.dateService.getDaysDifference(currentDate, attendanceDate);

      // Si la diferencia es de aproximadamente una semana (5-9 días por flexibilidad)
      if (daysDiff >= 5 && daysDiff <= 9) {
        streak++;
        currentDate = attendanceDate;
      } else if (streak === 0 && daysDiff <= 4) {
        // Primera asistencia reciente
        streak++;
        currentDate = attendanceDate;
      } else {
        // Se rompió la racha
        break;
      }
    }

    return streak;
  }

  /**
   * Actualizar estadísticas de todos los estudiantes activos
   */
  updateAllStudentsStats(): Observable<void> {
    this.setLoading(true);
    this.setError(null);

    const activeStudentIds = this.activeStudents().map(student => student.id);
    
    if (activeStudentIds.length === 0) {
      this.setLoading(false);
      return of();
    }

    // Procesar en lotes para evitar sobrecarga
    const batchSize = 10;
    const batches: string[][] = [];
    for (let i = 0; i < activeStudentIds.length; i += batchSize) {
      batches.push(activeStudentIds.slice(i, i + batchSize));
    }

    return from(Promise.all(
      batches.map(batch => 
        Promise.all(batch.map(studentId => 
          this.calculateStudentStats(studentId).then(stats =>
            updateDoc(
              doc(this.firebaseService.db, this.STUDENTS_COLLECTION, studentId),
              { stats, updatedAt: Timestamp.now() }
            )
          )
        ))
      )
    )).pipe(
      map(() => {
        console.log('✅ Estadísticas actualizadas para todos los estudiantes');
        this.setLoading(false);
      }),
      catchError(error => this.handleError('Error al actualizar estadísticas masivas', error))
    );
  }

  /**
   * Obtener estudiantes con cumpleaños en un mes específico
   */
  getStudentsBirthdaysByMonth(month: number): Observable<Student[]> {
    return this.studentsSubject.asObservable().pipe(
      map(students => students.filter(student => {
        if (!student.active) return false;
        const birthDate = new Date(student.birthDate);
        return birthDate.getMonth() === month;
      }))
    );
  }

  /**
   * Obtener estudiantes con cumpleaños próximos (próximos 7 días)
   */
  getUpcomingBirthdays(): Observable<Student[]> {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    return this.studentsSubject.asObservable().pipe(
      map(students => students.filter(student => {
        if (!student.active) return false;
        
        const birthDate = new Date(student.birthDate);
        // Ajustar año al actual para comparación
        const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        
        return thisYearBirthday >= today && thisYearBirthday <= nextWeek;
      }))
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
   * Refrescar datos manualmente (útil para pull-to-refresh)
   */
  refresh(): void {
    // El listener en tiempo real se encarga de la actualización automática
    // Este método puede ser útil para forzar una recarga si es necesario
    console.log('🔄 Refrescando datos de estudiantes...');
    this.setError(null);
  }
}