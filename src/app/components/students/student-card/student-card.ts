import { Component, input, output } from '@angular/core';
import { Student } from '../../../core/models/student.model';

export interface StudentCardData extends Student {
  age: number;
  hasUpcomingBirthday: boolean;
  lastContactFormatted: string;
}

@Component({
  selector: 'app-student-card',
  imports: [],
  templateUrl: './student-card.html',
  styleUrl: './student-card.css',
})
export class StudentCard {
  student = input.required<StudentCardData>();
  isInactive = input(false);
  view = output<string>();

  onViewStudent(): void {
    this.view.emit(this.student().id);
  }

  getInitials(name: string): string {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getMainContact(student: Student): string {
    const contacts = student.contacts ?? [];
    const mainContact = contacts.find((contact) => contact.isMain);
    if (mainContact) {
      return `${mainContact.name} - ${mainContact.phone || 'Sin teléfono'}`;
    }

    if (contacts.length > 0) {
      return `${contacts[0].name} - ${contacts[0].phone || 'Sin teléfono'}`;
    }

    return 'Sin contacto';
  }

  formatBirthday(birthDate: string): string {
    const date = new Date(birthDate);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  }
}
