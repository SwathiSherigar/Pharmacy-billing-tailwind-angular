import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  const isAdminRoute = state.url.startsWith('/admin');
  router.navigate([isAdminRoute ? '/admin/login' : '/login']);
  return false;
};

export const guestGuard: CanActivateFn = (_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return true;
  }

  const isAdminRoute = state.url.startsWith('/admin');
  router.navigate([isAdminRoute ? '/admin/register' : '/dashboard']);
  return false;
};
