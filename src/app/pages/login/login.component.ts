import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  email = '';
  password = '';
  readonly loading = signal(false);
  errorMessage = '';

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Veuillez renseigner votre email et votre mot de passe.';
      return;
    }

    this.errorMessage = '';
    this.loading.set(true);

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        this.loading.set(false);

        // Stocker le token et le rôle pour les guards/interceptors
        localStorage.setItem('token', response.token);
        if (response.role) {
          localStorage.setItem('userRole', response.role.toString());
        }

        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage = 'Identifiants invalides. Veuillez réessayer.';
      }
    });
  }
}
