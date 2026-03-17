import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="error-container">
      <div class="error-content">
        <h1>403</h1>
        <h2>Accès Non Autorisé</h2>
        <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        <a routerLink="/" class="btn-home">Retour à l'accueil</a>
      </div>
    </div>
  `,
  styles: [`
    .error-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .error-content {
      text-align: center;
      color: white;
    }

    h1 {
      font-size: 8rem;
      margin: 0;
      font-weight: 700;
    }

    h2 {
      font-size: 2rem;
      margin: 20px 0;
    }

    p {
      font-size: 1.2rem;
      margin-bottom: 30px;
      opacity: 0.9;
    }

    .btn-home {
      background: white;
      color: #667eea;
      padding: 15px 40px;
      border-radius: 30px;
      text-decoration: none;
      font-weight: 600;
      display: inline-block;
      transition: all 0.3s ease;
    }

    .btn-home:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    }
  `]
})
export class UnauthorizedComponent {}
