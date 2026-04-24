import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DateService } from '../../../services/date.service';
import { StudentService } from '../../../services/student.service';
import { Student } from '../../../core/models/student.model';

interface Birthday {
  id: string;
  name: string;
  initials: string;
  date: string;
}

@Component({
  selector: 'app-dashboard-birthdays',
  imports: [CommonModule],
  templateUrl: './dashboard-birthdays.html',
  styleUrl: './dashboard-birthdays.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardBirthdays {
  private readonly dateService = inject(DateService);
  private readonly studentService = inject(StudentService);
  
  // Usar el signal del servicio de fechas
  currentMonth = this.dateService.currentMonthCapitalized;

  monthlyBirthdays = computed<Birthday[]>(() => {
    const monthIndex = this.dateService.currentMonthNumber();

    return this.studentService
      .activeStudents()
      .filter(student => {
        const birthDate = new Date(student.birthDate);
        return !Number.isNaN(birthDate.getTime()) && birthDate.getUTCMonth() === monthIndex;
      })
      .sort((first, second) => new Date(first.birthDate).getUTCDate() - new Date(second.birthDate).getUTCDate())
      .map(student => this.mapBirthday(student));
  });

  private mapBirthday(student: Student): Birthday {
    const birthDate = new Date(student.birthDate);
    const age = this.dateService.calculateAge(birthDate);

    return {
      id: student.id,
      name: student.name,
      initials: this.getInitials(student.name),
      date: `${birthDate.getUTCDate()} ${this.dateService.currentMonth().toLowerCase()} (${age} años)`
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