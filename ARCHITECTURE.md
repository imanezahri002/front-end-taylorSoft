# Angular Architecture - Guards, Interceptors & Shared

This document describes the project architecture and how to use guards, interceptors, and shared components.

## 📁 Project Structure

```
src/app/
├── guards/
│   ├── auth.guard.ts          # Authentication guard
│   └── role.guard.ts          # Role-based authorization guard
├── interceptors/
│   ├── auth.interceptor.ts    # Adds JWT token to requests
│   ├── error.interceptor.ts   # Global error handling
│   └── loading.interceptor.ts # Loading indicator
├── shared/
│   ├── components/
│   │   └── loader/            # Loading spinner component
│   ├── directives/
│   │   └── highlight.directive.ts
│   ├── pipes/
│   │   └── truncate.pipe.ts
│   ├── services/
│   │   ├── loading.service.ts
│   │   └── storage.service.ts
│   ├── models/
│   │   ├── user.model.ts
│   │   └── response.model.ts
│   └── index.ts               # Barrel export
```

## 🛡️ Guards

### Authentication Guard (auth.guard.ts)
Protects routes from unauthenticated users.

**Usage in routes:**
```typescript
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  }
];
```

### Role Guard (role.guard.ts)
Restricts access based on user roles.

**Usage in routes:**
```typescript
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] }
  }
];
```

## 🔌 Interceptors

All interceptors are automatically registered in `app.config.ts`.

### Auth Interceptor (auth.interceptor.ts)
- Automatically adds JWT token to outgoing HTTP requests
- Reads token from localStorage
- Adds `Authorization: Bearer <token>` header

### Error Interceptor (error.interceptor.ts)
- Global error handling for HTTP requests
- Redirects to login on 401 errors
- Redirects to unauthorized page on 403 errors
- Logs errors to console

### Loading Interceptor (loading.interceptor.ts)
- Shows/hides loading spinner during HTTP requests
- Tracks multiple concurrent requests
- Works with LoadingService

## 📦 Shared Module

### Services

#### LoadingService
Manages loading state across the application.

```typescript
import { LoadingService } from './shared/services/loading.service';

constructor(private loadingService: LoadingService) {}

// Subscribe to loading state
this.loadingService.loading$.subscribe(isLoading => {
  console.log('Loading:', isLoading);
});

// Manually trigger (usually not needed - interceptor handles this)
this.loadingService.show();
this.loadingService.hide();
```

#### StorageService
Type-safe wrapper for localStorage.

```typescript
import { StorageService } from './shared/services/storage.service';

constructor(private storage: StorageService) {}

// Set item
this.storage.setItem('user', { id: 1, name: 'John' });

// Get item
const user = this.storage.getItem<User>('user');

// Remove item
this.storage.removeItem('user');

// Clear all
this.storage.clear();
```

### Components

#### LoaderComponent
Global loading spinner.

**Usage in app template:**
```html
<app-loader></app-loader>
<router-outlet></router-outlet>
```

### Directives

#### HighlightDirective
Highlights element on hover.

```html
<div appHighlight="lightblue">Hover me!</div>
<div [appHighlight]="'yellow'" [defaultColor]="'white'">Custom colors</div>
```

### Pipes

#### TruncatePipe
Truncates long text.

```html
<p>{{ longText | truncate:100:'...' }}</p>
```

### Models

```typescript
import { User, UserRole } from './shared/models/user.model';
import { ApiResponse, PaginatedResponse } from './shared/models/response.model';
```

## 🚀 Usage Examples

### Protected Route with Guards
```typescript
export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'admin', 
    component: AdminComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] }
  }
];
```

### HTTP Service with Interceptors
```typescript
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';

export class UserService {
  private http = inject(HttpClient);
  
  // Interceptors automatically:
  // - Add auth token
  // - Show loading spinner
  // - Handle errors
  getUsers() {
    return this.http.get('/api/users');
  }
}
```

### Using Shared Components
```typescript
import { Component } from '@angular/core';
import { LoaderComponent } from './shared/components/loader/loader.component';
import { TruncatePipe } from './shared/pipes/truncate.pipe';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LoaderComponent, TruncatePipe],
  template: `
    <app-loader></app-loader>
    <p>{{ description | truncate:50 }}</p>
  `
})
export class AppComponent {}
```

## 📝 Notes

- All guards use functional guard syntax (CanActivateFn)
- All interceptors use functional interceptor syntax (HttpInterceptorFn)
- All components/directives/pipes are standalone
- Services use `providedIn: 'root'` for tree-shaking
- Interceptors are registered in the correct order in app.config.ts

## 🔧 Customization

### Modify Authentication Logic
Update the logic in `guards/auth.guard.ts` to match your authentication system.

### Add New Interceptors
1. Create interceptor in `interceptors/` folder
2. Register in `app.config.ts` providers array

### Extend Shared Module
Add new components, directives, pipes, or services in their respective folders under `shared/`.
