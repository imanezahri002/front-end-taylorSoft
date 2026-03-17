import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DashboardLayoutComponent } from '../../../shared/components/dashboard-layout/dashboard-layout.component';
import { CategoryService } from '../../../shared/services/category.service';
import { Category } from '../../../core/models/category.model';

@Component({
  selector: 'app-category',
  imports: [CommonModule, ReactiveFormsModule, DashboardLayoutComponent],
  templateUrl: './category.html',
  styleUrl: './category.css',
  standalone: true
})
export class CategoryComponent implements OnInit {
  // Signaux réactifs
  categories = signal<Category[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  isSubmitting = signal<boolean>(false);

  // Formulaire réactif
  categoryForm: FormGroup;

  constructor(
    private categoryService: CategoryService,
    private fb: FormBuilder
  ) {
    this.categoryForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  /**
   * Charger toutes les catégories
   */
  loadCategories(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.categoryService.getAll().subscribe({
      next: (data: Category[]) => {
        console.log('Catégories reçues:', data);
        this.categories.set(data);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des catégories:', err);
        this.error.set('Impossible de charger les catégories. Vérifiez votre connexion au serveur.');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Ajouter une nouvelle catégorie
   */
  addCategory(): void {
    if (this.categoryForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.categoryForm.value;

    this.categoryService.create(formValue).subscribe({
      next: (newCategory: Category) => {
        console.log('Catégorie créée:', newCategory);
        // Ajouter la nouvelle catégorie à la liste
        const currentCategories = this.categories();
        this.categories.set([...currentCategories, newCategory]);
        // Réinitialiser le formulaire
        this.categoryForm.reset();
        this.isSubmitting.set(false);
      },
      error: (err: any) => {
        console.error('Erreur lors de la création:', err);
        this.error.set('Erreur lors de la création de la catégorie.');
        this.isSubmitting.set(false);
      }
    });
  }

  /**
   * Supprimer une catégorie
   */
  deleteCategory(id: number | undefined, name: string): void {
    if (!id) {
      this.error.set('ID de la catégorie invalide');
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer "${name}" ?`)) {
      this.categoryService.delete(id).subscribe({
        next: () => {
          console.log('Catégorie supprimée');
          // Retirer la catégorie de la liste
          const currentCategories = this.categories();
          this.categories.set(currentCategories.filter(cat => cat.id !== id));
        },
        error: (err: any) => {
          console.error('Erreur lors de la suppression:', err);
          this.error.set('Erreur lors de la suppression de la catégorie.');
        }
      });
    }
  }

  /**
   * Obtenir les erreurs du formulaire
   */
  getFormError(fieldName: string): string | null {
    const control = this.categoryForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${fieldName} est requis`;
    }
    if (control?.hasError('minlength')) {
      return `${fieldName} doit contenir au moins 3 caractères`;
    }
    if (control?.hasError('maxlength')) {
      return `${fieldName} ne doit pas dépasser 500 caractères`;
    }
    return null;
  }
}
