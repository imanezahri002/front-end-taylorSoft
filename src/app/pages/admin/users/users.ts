import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DashboardLayoutComponent } from '../../../shared/components/dashboard-layout/dashboard-layout.component';
import { UserService } from '../../../shared/services/user.service';
import { UserRequest, UserResponse } from '../../../core/models/user.model';
import { Page } from '../../../core/models/page.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DashboardLayoutComponent],
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
  isCreating = signal<boolean>(false);
  showCreateForm = signal<boolean>(false);

  createUserForm: FormGroup;

  constructor(
    private userService: UserService,
    private fb: FormBuilder
  ) {
    this.createUserForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['CLIENT', [Validators.required]],
      statut: ['ACTIF', [Validators.required]],
      telephone: [''],
      adresse: [''],
    });
  }

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

  openCreateUserForm(): void {
    this.error.set(null);
    this.showCreateForm.set(true);
  }

  cancelCreateUser(): void {
    this.showCreateForm.set(false);
    this.createUserForm.reset({
      nom: '',
      prenom: '',
      email: '',
      password: '',
      role: 'CLIENT',
      statut: 'ACTIF',
      telephone: '',
      adresse: '',
    });
  }

  createUser(): void {
    if (this.createUserForm.invalid) {
      this.createUserForm.markAllAsTouched();
      return;
    }

    this.isCreating.set(true);
    this.error.set(null);

    const payload: UserRequest = this.createUserForm.value as UserRequest;

    this.userService.createUser(payload).subscribe({
      next: () => {
        this.isCreating.set(false);
        this.cancelCreateUser();
        this.loadUsers(0);
      },
      error: (err: any) => {
        this.isCreating.set(false);
        const apiMessage = err?.error?.message;
        this.error.set(apiMessage || "Erreur lors de la creation de l'utilisateur.");
      }
    });
  }

  getCreateFormError(fieldName: string): string | null {
    const control = this.createUserForm.get(fieldName);

    if (!control || !control.touched) {
      return null;
    }

    if (control.hasError('required')) {
      return `${fieldName} est requis`;
    }
    if (control.hasError('email')) {
      return 'Email invalide';
    }
    if (control.hasError('minlength')) {
      if (fieldName === 'password') {
        return 'password doit contenir au moins 6 caracteres';
      }
      return `${fieldName} doit contenir au moins 2 caracteres`;
    }

    return null;
  }
}
