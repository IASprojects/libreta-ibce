import { Injectable } from '@angular/core';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { initializeFirestore, type Firestore } from 'firebase/firestore';
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
      console.log('🔥 Initializing Firebase with config:', {
        apiKey: environment.firebase.apiKey?.substring(0, 10) + '...',
        authDomain: environment.firebase.authDomain,
        projectId: environment.firebase.projectId
      });
      
      this.app = initializeApp(environment.firebase);
      // Auto-detecta redes/navegadores donde WebChannel falla con 400 y cambia a long-polling.
      this.db = initializeFirestore(this.app, {
        experimentalAutoDetectLongPolling: true,
      });
      this.auth = getAuth(this.app);
      this.storage = getStorage(this.app);
      
      console.log('✅ Firebase initialized successfully');
    } catch (error) {
      console.error('❌ Error al inicializar Firebase:', error);
      console.error('🔍 Check Firebase configuration in environment.ts');
      throw error;
    }
  }
}