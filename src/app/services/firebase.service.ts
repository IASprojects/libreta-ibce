import { Injectable } from '@angular/core';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app!: FirebaseApp;
  public db!: Firestore;
  public auth!: Auth;
  public storage!: FirebaseStorage;

  constructor() {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    try {
      this.app = initializeApp(environment.firebase);
      this.db = getFirestore(this.app);
      this.auth = getAuth(this.app);
      this.storage = getStorage(this.app);
    } catch (error) {
      // Registra el error para facilitar el diagnóstico sin bloquear el manejo de errores de Angular
      console.error('Error al inicializar Firebase:', error);
      throw error;
    }
  }
}