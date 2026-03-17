import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An error occurred';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Error: ${error.error.message}`;
      } else {
        // Server-side error
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;

        // Handle specific error codes
        switch (error.status) {
          case 401:
            // Unauthorized - redirect to login
            router.navigate(['/login']);
            break;
          case 403:
            // Forbidden
            router.navigate(['/unauthorized']);
            break;
          case 404:
            // Not found
            console.error('Resource not found');
            break;
          case 500:
            // Internal server error
            console.error('Server error');
            break;
        }
      }

      console.error(errorMessage);
      return throwError(() => error);
    })
  );
};
