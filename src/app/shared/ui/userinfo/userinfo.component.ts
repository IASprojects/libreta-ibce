import { Component, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../shared/user.service';

@Component({
  selector: 'app-dashboard-userinfo',
  imports: [CommonModule],
  templateUrl: './userinfo.component.html',
  styleUrl: './userinfo.component.css',
})
export class UserinfoComponent {
  private userService = inject(UserService);
  // Signal computado que obtiene el usuario del servicio
  user = this.userService.user;

  // Output event para manejar el logout desde el componente padre
  logoutClick = output<void>();

  onLogout(): void {
    this.logoutClick.emit();
  }
}
