import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { Home } from './pages/home/home';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UnauthorizedComponent } from './pages/unauthorized/unauthorized.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { Signup } from './pages/signup/signup';
import { Users } from '../app/pages/admin/users/users';
import { TissuTypeComponent } from '../app/pages/admin/tissu-type/tissu-type';


export const routes: Routes = [
  {
    path: '',
    component: Home
  },
  {
    path: 'home',
    component: Home
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'signup',
    component: Signup
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'dashboard/users',
    component: Users,
    canActivate: [authGuard]
  },
  {
    path:'dashboard/categories',
    loadComponent: () => import('../app/pages/admin/category/category').then(m => m.CategoryComponent),
    canActivate: [authGuard]
  },
  {
    path: 'dashboard/tissus',
    component: TissuTypeComponent,
    canActivate: [authGuard]
  },
  {
    path: 'dashboard/type-tissu',
    component: TissuTypeComponent,
    canActivate: [authGuard]
  },
  {
    path: 'unauthorized',
    component: UnauthorizedComponent
  },
  {
    path: '**',
    component: NotFoundComponent
  }
];

