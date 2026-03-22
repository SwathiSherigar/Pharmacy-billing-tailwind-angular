import { Routes } from '@angular/router';
import { routes as routeConstants } from './core/constants/routes';
import { Layout } from './shared/components/layout/layout';

const { DASHBOARD, BILLING_PAGE, DOCTOR_LISTING,PATIENTS_LISTING, ITEM_LISTING } = routeConstants;

export const routes: Routes = [
  {
    path: '',
    component: Layout,
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
      // Patient listing disabled — patient data stored inline in bills
      // {
      //   path: PATIENTS_LISTING,
      //   loadComponent:() => import('./pages/patient-listing/patient-listing').then(m=>m.PatientListing),
      // },
       {
        path: DOCTOR_LISTING,
        loadComponent:() => import('./pages/doctors-listing/doctors-listing').then(m=>m.DoctorsListing),
      },
       {
        path: ITEM_LISTING,
        loadComponent:() => import('./pages/item-listing/item-listing').then(m=>m.ItemListing),
      }
    ],
  },

];
