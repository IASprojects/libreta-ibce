import { Injectable, signal, computed } from '@angular/core';

export interface User {
  displayName: string;
  email: string;
  photoURL: string;
  uid: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private _user = signal<User | null>(null);
  
  // Signal de solo lectura para los componentes
  public user = this._user.asReadonly();
  
  // Computed signal para verificar si el usuario está logueado
  public isLoggedIn = computed(() => this._user() !== null);

  get currentUser(): User | null {
    return this._user();
  }

  setUser(user: User | null): void {
    this._user.set(user);
  }

  logout(): void {
    this._user.set(null);
  }
}