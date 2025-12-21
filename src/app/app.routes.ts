import { Routes } from '@angular/router';
import { routes as routeConstants } from './core/constants/routes';

const { BILLING_PAGE,DASHBOARD} = routeConstants

export const routes: Routes = [
    { path: '', redirectTo: `/${DASHBOARD}`, pathMatch: 'full' },
     { path: `${DASHBOARD}`, loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard) },
    { path: `${BILLING_PAGE}`, loadComponent: () => import('./pages/billing/billing').then(m => m.BillingComponent) },
];