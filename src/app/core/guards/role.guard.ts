import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const requiredRoles = route.data['roles'] as string[];

  // TODO: Replace with your actual role checking logic
  const userRole = localStorage.getItem('userRole');

  if (!userRole || !requiredRoles.includes(userRole)) {
    router.navigate(['/unauthorized']);
    return false;
  }

  return true;
};
