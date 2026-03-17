import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DashboardLayoutComponent } from '../../../shared/components/dashboard-layout/dashboard-layout.component';
import { TissuTypeService } from '../../../shared/services/tissu-type.service';
import { TissuType } from '../../../core/models/tissuType.model';

@Component({
  selector: 'app-tissu-type',
  imports: [CommonModule, ReactiveFormsModule, DashboardLayoutComponent],
  templateUrl: './tissu-type.html',
  styleUrl: './tissu-type.css',
  standalone: true
})
export class TissuTypeComponent implements OnInit {
  tissuTypes = signal<TissuType[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  isSubmitting = signal<boolean>(false);

  tissuTypeForm: FormGroup;

  constructor(
    private tissuTypeService: TissuTypeService,
    private fb: FormBuilder
  ) {
    this.tissuTypeForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.maxLength(500)]],
    });
  }

  ngOnInit(): void {
    this.loadTissuTypes();
  }

  loadTissuTypes(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.tissuTypeService.getAll().subscribe({
      next: (data: TissuType[]) => {
        console.log('Types de tissu recus:', data);
        this.tissuTypes.set(data);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des types de tissu:', err);
        this.error.set('Impossible de charger les types de tissu. Verifiez votre connexion au serveur.');
        this.isLoading.set(false);
      },
    });
  }

  addTissuType(): void {
    if (this.tissuTypeForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.tissuTypeForm.value;

    this.tissuTypeService.create(formValue).subscribe({
      next: (newTissuType: TissuType) => {
        console.log('Type de tissu cree:', newTissuType);
        const currentTissuTypes = this.tissuTypes();
        this.tissuTypes.set([...currentTissuTypes, newTissuType]);
        this.tissuTypeForm.reset();
        this.isSubmitting.set(false);
      },
      error: (err: any) => {
        console.error('Erreur lors de la creation:', err);
        this.error.set('Erreur lors de la creation du type de tissu.');
        this.isSubmitting.set(false);
      },
    });
  }

  deleteTissuType(id: number | undefined, name: string): void {
    if (!id) {
      this.error.set('ID du type de tissu invalide');
      return;
    }

    if (confirm(`Etes-vous sur de vouloir supprimer "${name}" ?`)) {
      this.tissuTypeService.delete(id).subscribe({
        next: () => {
          console.log('Type de tissu supprime');
          const currentTissuTypes = this.tissuTypes();
          this.tissuTypes.set(currentTissuTypes.filter((item) => item.id !== id));
        },
        error: (err: any) => {
          console.error('Erreur lors de la suppression:', err);
          this.error.set('Erreur lors de la suppression du type de tissu.');
        },
      });
    }
  }

  getFormError(fieldName: string): string | null {
    const control = this.tissuTypeForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${fieldName} est requis`;
    }
    if (control?.hasError('minlength')) {
      return `${fieldName} doit contenir au moins 3 caracteres`;
    }
    if (control?.hasError('maxlength')) {
      return `${fieldName} ne doit pas depasser 500 caracteres`;
    }
    return null;
  }

}
