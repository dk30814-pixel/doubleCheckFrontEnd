import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register').then((m) => m.RegisterComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.DashboardComponent),
  },
  {
    path: 'categories',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/categories/categories').then((m) => m.CategoriesComponent),
  },
  {
    path: 'professional',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/professional/professional').then((m) => m.ProfessionalComponent),
  },
  {
    path: 'verification',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/verification/verification').then((m) => m.VerificationComponent),
  },
  {
    path: 'admin',
    canActivate: [roleGuard('Admin')],
    loadComponent: () => import('./pages/admin/admin').then((m) => m.AdminComponent),
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundComponent),
  },
];
