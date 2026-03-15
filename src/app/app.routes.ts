import { Routes } from '@angular/router';
import { routes as routeConstants } from './core/constants/routes';
import { Layout } from './shared/components/layout/layout';
import { authGuard, guestGuard } from './core/guards/auth.guard';

const { DASHBOARD, BILLING_PAGE, DOCTOR_LISTING, PATIENTS_LISTING, ITEM_LISTING, PROFILE } = routeConstants;

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/reset-password/reset-password').then(m => m.ResetPasswordComponent),
  },
  {
    path: 'admin/login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/admin/admin-login').then(m => m.AdminLoginComponent),
  },
  {
    path: 'admin/register',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/register/register').then(m => m.RegisterComponent),
  },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: DASHBOARD, pathMatch: 'full' },
      {
        path: DASHBOARD,
        loadComponent: () =>
          import('./pages/dashboard/dashboard').then(m => m.Dashboard),
      },
      {
        path: BILLING_PAGE,
        loadComponent: () =>
          import('./pages/billing/billing').then(m => m.BillingComponent),
      },
      {
        path: PATIENTS_LISTING,
        loadComponent: () => import('./pages/patient-listing/patient-listing').then(m => m.PatientListing),
      },
      {
        path: DOCTOR_LISTING,
        loadComponent: () => import('./pages/doctors-listing/doctors-listing').then(m => m.DoctorsListing),
      },
      {
        path: ITEM_LISTING,
        loadComponent: () => import('./pages/item-listing/item-listing').then(m => m.ItemListing),
      },
      {
        path: PROFILE,
        loadComponent: () => import('./pages/profile/profile').then(m => m.ProfileComponent),
      }
    ],
  },
];
