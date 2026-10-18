import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { MainComponent } from './features/dashboard/main/main.component';
import { StudentList } from './features/students/student-list/student-list';
import { StudentForm } from './features/students/student-form/student-form';
import { PlannerComponent } from './features/planned-lessons/planner.component';
import { ClassesComponent } from './features/lesson-classes/classes.component';
import { SettingsComponent } from './features/settings/settings.component';
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
        component: PlannerComponent
      },
      {
        path: 'clases',
        component: ClassesComponent
      },
      {
        path: 'configuracion',
        component: SettingsComponent
      }
    ]
  },
  { path: '**', redirectTo: '/login' }
];
