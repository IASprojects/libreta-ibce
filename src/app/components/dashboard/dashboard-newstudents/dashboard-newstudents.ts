import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentService } from '../../../services/student.service';
import { Student } from '../../../core/models/student.model';

interface StudentPreview {
  id: string;
  name: string;
  initials: string;
  joinedDate: string;
}

@Component({
  selector: 'app-dashboard-newstudents',
  imports: [CommonModule],
  templateUrl: './dashboard-newstudents.html',
  styleUrl: './dashboard-newstudents.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardNewstudents {
  private readonly studentService = inject(StudentService);

  recentStudents = computed<StudentPreview[]>(() =>
    [...this.studentService.activeStudents()]
      .sort((first, second) => second.registeredAt.getTime() - first.registeredAt.getTime())
      .slice(0, 3)
      .map(student => this.mapToPreview(student))
  );

  private mapToPreview(student: Student): StudentPreview {
    return {
      id: student.id,
      name: student.name,
      initials: this.getInitials(student.name),
      joinedDate: new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).format(student.registeredAt)
    };
  }

  private getInitials(name: string): string {
    return name
      .split(' ')
      .filter(part => part.length > 0)
      .slice(0, 2)
      .map(part => part[0].toUpperCase())
      .join('');
  }
}