import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { MainComponent } from './features/dashboard/main/main.component';
import { StudentList } from './features/students/student-list/student-list';
import { StudentForm } from './features/students/student-form/student-form';
import { Planificador } from './features/planned-lessons/planificador';
import { Clases } from './features/lesson-classes/clases';
import { ConfiguracionComponent } from './features/configuracion/configuracion.component';
import { authGuard, loginRedirectGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { 
    path: 'login', 
    component: LoginComponent,
    canActivate: [loginRedirectGuard]
  },
  { 
    path: 'dashboard',
    component: MainComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: DashboardComponent
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
        component: ConfiguracionComponent
      }
    ]
  },
  { path: '**', redirectTo: '/login' }
];
