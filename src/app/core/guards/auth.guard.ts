import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // TODO: Replace with your actual authentication logic
  const isAuthenticated = localStorage.getItem('token') !== null;

  if (!isAuthenticated) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};
