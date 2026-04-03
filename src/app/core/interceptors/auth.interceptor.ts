import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { from } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = localStorage.getItem('auth_token');

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Don't retry refresh or login requests
      if (error.status === 401 && !req.url.includes('/auth/refresh') && !req.url.includes('/auth/login')) {
        if (!isRefreshing) {
          isRefreshing = true;

          return from(auth.refreshToken()).pipe(
            switchMap((res: any) => {
              isRefreshing = false;
              if (res) {
                auth.updateTokens(res.accessToken, res.refreshToken);
                if (res.client) {
                  auth.updateLocalClient(res.client);
                }
                // Retry the original request with new token
                const retryReq = req.clone({
                  setHeaders: { Authorization: `Bearer ${res.accessToken}` },
                });
                return next(retryReq);
              }
              auth.logout();
              return throwError(() => error);
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              auth.logout();
              return throwError(() => refreshError);
            }),
          );
        }
      }
      return throwError(() => error);
    }),
  );
};
