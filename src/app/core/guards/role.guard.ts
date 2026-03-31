import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const requiredRoles = (route.data['roles'] as string[] | undefined) ?? [];

  const storedRole = localStorage.getItem('userRole');
  const normalizedRole = storedRole
    ? storedRole
        .trim()
        .toUpperCase()
        .replace(/^ROLE_/, '')
        .replace('COUTOURIER', 'COUTURIER')
    : null;

  if (!normalizedRole || !requiredRoles.includes(normalizedRole)) {
    router.navigate(['/unauthorized']);
    return false;
  }

  return true;
};
