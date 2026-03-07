import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { Dashboard } from './components/dashboard/dashboard';
import { Main } from './components/main/main';
import { StudentList } from './components/students/student-list/student-list';
import { StudentForm } from './components/students/student-form/student-form';
import { Planificador } from './components/planificador/planificador';
import { Clases } from './components/clases/clases';
import { Configuracion } from './components/configuracion/configuracion';
import { authGuard, loginRedirectGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { 
    path: 'login', 
    component: LoginComponent,
    canActivate: [loginRedirectGuard]
  },
  { 
    path: 'dashboard',
    component: Main,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: Dashboard
      },
      {
        path: 'estudiantes',
        component: StudentList
      },
      {
        path: 'estudiantes/:id',
        component: StudentForm
      },
      {
        path: 'planificador',
        component: Planificador
      },
      {
        path: 'clases',
        component: Clases
      },
      {
        path: 'configuracion',
        component: Configuracion
      }
    ]
  },
  { path: '**', redirectTo: '/login' }
];
