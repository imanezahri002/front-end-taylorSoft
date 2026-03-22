import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DashboardLayoutComponent } from '../../../shared/components/dashboard-layout/dashboard-layout.component';
import { TissuType } from '../../../core/models/tissuType.model';
import { Tissu } from '../../../core/models/tissu.model';
import { TissuService } from '../../../shared/services/tissu.service';
import { TissuTypeService } from '../../../shared/services/tissu-type.service';

@Component({
  selector: 'app-tissus',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DashboardLayoutComponent],
  templateUrl: './tissus.html',
  styleUrl: './tissus.css',
})
export class Tissus implements OnInit {
  tissus = signal<Tissu[]>([]);
  types = signal<TissuType[]>([]);
  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);
  editingTissuId = signal<number | null>(null);
  error = signal<string | null>(null);

  tissuForm: FormGroup;

  constructor(
    private tissuService: TissuService,
    private tissuTypeService: TissuTypeService,
    private fb: FormBuilder,
  ) {
    this.tissuForm = this.fb.group({
      reference: ['', [Validators.required, Validators.minLength(2)]],
      nom: ['', [Validators.required, Validators.minLength(2)]],
      largeur: [null],
      active: [true],
      typeTissuId: [null, [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.tissuTypeService.getAll().subscribe({
      next: (types) => {
        this.types.set(types);
        this.loadTissus();
      },
      error: () => {
        this.error.set('Impossible de charger les types de tissu.');
        this.isLoading.set(false);
      },
    });
  }

  loadTissus(): void {
    this.tissuService.getAll().subscribe({
      next: (data) => {
        this.tissus.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les tissus.');
        this.isLoading.set(false);
      },
    });
  }

  submitTissu(): void {
    if (this.tissuForm.invalid) {
      this.tissuForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    const payload: Tissu = {
      reference: this.tissuForm.value.reference,
      nom: this.tissuForm.value.nom,
      largeur: this.tissuForm.value.largeur,
      active: this.tissuForm.value.active,
      typeTissuId: Number(this.tissuForm.value.typeTissuId),
    };

    const editingId = this.editingTissuId();
    const request$ = editingId
      ? this.tissuService.update(editingId, payload)
      : this.tissuService.create(payload);

    request$.subscribe({
      next: (created) => {
        if (editingId) {
          this.tissus.set(
            this.tissus().map((item) => (item.id === editingId ? created : item)),
          );
        } else {
          this.tissus.set([created, ...this.tissus()]);
        }
        this.tissuForm.reset({ active: true, typeTissuId: null });
        this.editingTissuId.set(null);
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Erreur lors de l enregistrement du tissu.');
        this.isSubmitting.set(false);
      },
    });
  }

  startEdit(tissu: Tissu): void {
    if (!tissu.id) {
      return;
    }

    this.editingTissuId.set(tissu.id);
    this.tissuForm.patchValue({
      reference: tissu.reference,
      nom: tissu.nom,
      largeur: tissu.largeur ?? null,
      active: tissu.active ?? true,
      typeTissuId: tissu.typeTissuId,
    });
  }

  cancelEdit(): void {
    this.editingTissuId.set(null);
    this.tissuForm.reset({ active: true, typeTissuId: null });
  }

  deleteTissu(tissu: Tissu): void {
    if (!tissu.id) {
      return;
    }

    if (!confirm(`Supprimer le tissu "${tissu.nom}" ?`)) {
      return;
    }

    this.tissuService.delete(tissu.id).subscribe({
      next: () => {
        this.tissus.set(this.tissus().filter((item) => item.id !== tissu.id));
        if (this.editingTissuId() === tissu.id) {
          this.cancelEdit();
        }
      },
      error: () => {
        this.error.set('Erreur lors de la suppression du tissu.');
      },
    });
  }

  getTypeName(typeId: number): string {
    const type = this.types().find((item) => item.id === typeId);
    return type?.nom ?? 'Inconnu';
  }

}
