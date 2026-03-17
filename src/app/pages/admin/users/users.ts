import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardLayoutComponent } from '../../../shared/components/dashboard-layout/dashboard-layout.component';
import { UserService } from '../../../shared/services/user.service';
import { UserResponse } from '../../../shared/models/user.model';
import { Page } from '../../../core/models/page.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, DashboardLayoutComponent],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit {
  // Signaux réactifs
  usersPage = signal<Page<UserResponse> | null>(null);
  currentPage = signal<number>(0);
  readonly pageSize = 10;
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  // Charge les utilisateurs au montage et changement de page
  loadUsers(page: number = 0): void {
    this.currentPage.set(page);
    this.loadUsersData(page);
  }

  // Méthode privée pour effectuer la requête HTTP
  private loadUsersData(page: number): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.userService.getAllUsers(page, this.pageSize).subscribe({
      next: (data: Page<UserResponse>) => {
        console.log('Données reçues:', data);
        this.usersPage.set(data);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des utilisateurs:', err);
        this.error.set('Impossible de charger la liste des utilisateurs. Vérifiez votre connexion au serveur.');
        this.isLoading.set(false);
      }
    });
  }

  onPageChange(newPage: number): void {
    const pageData = this.usersPage();
    if (pageData && newPage >= 0 && newPage < pageData.totalPages) {
      this.loadUsers(newPage);
    }
  }

  getPagesArray(): number[] {
    const pageData = this.usersPage();
    if (!pageData) return [];
    return Array.from({ length: pageData.totalPages }, (_, i) => i);
  }

  shouldShowPagination(): boolean {
    return (this.usersPage()?.totalPages ?? 0) > 1;
  }

  deleteUser(id: number, userName: string): void {
    if (confirm(`Etes-vous sur de vouloir supprimer l'utilisateur ${userName} ?`)) {
      this.userService.deleteUser(id).subscribe({
        next: () => {
          this.loadUsers(this.currentPage());
        },
        error: (err: any) => {
          console.error('Erreur lors de la suppression:', err);
          alert("Erreur lors de la suppression de l'utilisateur.");
        }
      });
    }
  }
}
