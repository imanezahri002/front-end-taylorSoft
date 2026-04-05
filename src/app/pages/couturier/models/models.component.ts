import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ModelService } from '../../../shared/services/model.service';
import { CategoryService } from '../../../shared/services/category.service';
import { TissuService } from '../../../shared/services/tissu.service';
import { ColorService } from '../../../shared/services/color.service';
import { AuthService } from '../../../shared/services/auth.service';
import { Model, ModelRequest, ModelColorRequest, PhotoOrder } from '../../../core/models/model.model';
import { Category } from '../../../core/models/category.model';
import { Tissu } from '../../../core/models/tissu.model';
import { Color } from '../../../core/models/color.model';
import { DashboardLayoutComponent } from '../../../shared/components/dashboard-layout/dashboard-layout.component';

const REDIRECT_DELAY_MS = 2000;

@Component({
  selector: 'app-models',
  imports: [CommonModule, ReactiveFormsModule, DashboardLayoutComponent],
  templateUrl: './models.component.html',
  styleUrl: './models.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelsComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly modelService = inject(ModelService);
  private readonly categoryService = inject(CategoryService);
  private readonly tissuService = inject(TissuService);
  private readonly colorService = inject(ColorService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  modelForm: FormGroup;
  models: Model[] = [];
  categories: Category[] = [];
  tissus: Tissu[] = [];
  colors: Color[] = [];

  loading = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';
  showForm = false;
  showDetailsModal = false;
  selectedModel: Model | null = null;
  currentUserId: number = 0;

  // For file uploads
  selectedFiles: File[] = [];
  fileInputs: HTMLInputElement[] = [];

  PhotoOrder = PhotoOrder;

  constructor() {
    this.modelForm = this.createModelForm();
  }

  private createModelForm(): FormGroup {
    return this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(5)]],
      prix: ['', [Validators.required, Validators.min(0.01)]],
      tissuId: ['', Validators.required],
      categorieId: ['', Validators.required],
      couleurs: this.fb.array([]),
      active: [true],
    });
  }

  ngOnInit(): void {
    const userId = this.authService.getUserId();
    if (userId) {
      this.currentUserId = userId;
    }

    this.loadCategories();
    this.loadTissus();
    this.loadColors();
    this.loadModels();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load categories
   */
  loadCategories(): void {
    this.categoryService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.categories = data;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Erreur lors du chargement des catégories';
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Load tissus
   */
  loadTissus(): void {
    this.tissuService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.tissus = data;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Erreur lors du chargement des tissus';
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Load colors
   */
  loadColors(): void {
    this.colorService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.colors = data;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Erreur lors du chargement des couleurs';
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Load models for current couturier
   */
  loadModels(): void {
    if (!this.currentUserId) return;

    this.modelService
      .getByCouturierId(this.currentUserId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.models = data;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Erreur lors du chargement des modèles';
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Get couleurs form array
   */
  get couleurs(): FormArray {
    return this.modelForm.get('couleurs') as FormArray;
  }

  /**
   * Get couleur FormGroups for template iteration
   */
  get couleurControls(): FormGroup[] {
    return this.couleurs.controls as FormGroup[];
  }

  /**
   * Add a color to the model
   */
  addColor(): void {
    const colorGroup = this.fb.group({
      couleurId: ['', Validators.required],
      photos: this.fb.array([
        this.createPhotoGroup()
      ]),
    });
    this.couleurs.push(colorGroup);
  }

  /**
   * Remove a color from the model
   */
  removeColor(index: number): void {
    if (this.couleurs.length > 1) {
      this.couleurs.removeAt(index);
      if (this.selectedFiles.length > 0) {
        this.selectedFiles.splice(index, 1);
      }
    }
  }

  /**
   * Get photos form array for a color
   */
  getPhotosArray(colorIndex: number): FormArray {
    return this.couleurs.at(colorIndex).get('photos') as FormArray;
  }

  /**
   * Get photos FormGroups for template iteration
   */
  getPhotoControls(colorIndex: number): FormGroup[] {
    return this.getPhotosArray(colorIndex).controls as FormGroup[];
  }

  /**
   * Add a photo to a color
   */
  addPhotoToColor(colorIndex: number): void {
    const photosArray = this.getPhotosArray(colorIndex);
    if (photosArray.length < 4) {
      photosArray.push(this.createPhotoGroup());
    }
  }

  /**
   * Remove a photo from a color
   */
  removePhotoFromColor(colorIndex: number, photoIndex: number): void {
    const photosArray = this.getPhotosArray(colorIndex);
    if (photosArray.length > 1) {
      photosArray.removeAt(photoIndex);
    }
  }

  /**
   * Create a photo form group
   */
  private createPhotoGroup(): FormGroup {
    return this.fb.group({
      principal: [false],
      photo_order: ['PREMIERE', Validators.required],
    });
  }

  /**
   * Handle file selection
   */
  onFileSelected(event: Event, colorIndex: number): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!this.selectedFiles[colorIndex]) {
        this.selectedFiles[colorIndex] = file;
      } else {
        this.selectedFiles[colorIndex] = file;
      }
    }
  }

  /**
   * Open the model form modal
   */
  openForm(): void {
    this.showForm = true;
    this.resetForm();
    this.addColor();
    this.cdr.markForCheck();
  }

  /**
   * Close the model form modal
   */
  closeForm(): void {
    this.showForm = false;
    this.resetForm();
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();
  }

  /**
   * Reset the form
   */
  resetForm(): void {
    this.modelForm.reset({ active: true });
    this.couleurs.clear();
    this.selectedFiles = [];
    this.submitted = false;
  }

  /**
   * Submit the model form
   */
  submitModel(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.modelForm.invalid) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    if (this.couleurs.length === 0) {
      this.errorMessage = 'Veuillez ajouter au moins une couleur';
      return;
    }

    // Collect all files from form
    const allFiles: File[] = [];
    this.couleurs.controls.forEach((colorGroup) => {
      const photosArray = colorGroup.get('photos') as FormArray;
      photosArray.controls.forEach((photoGroup, photoIndex) => {
        // Get file from the file input or selected files
        const fileInput = document.getElementById(`file-${this.couleurs.controls.indexOf(colorGroup)}-${photoIndex}`) as HTMLInputElement;
        if (fileInput?.files?.[0]) {
          allFiles.push(fileInput.files[0]);
        }
      });
    });

    if (allFiles.length === 0) {
      this.errorMessage = 'Veuillez sélectionner au moins une photo';
      return;
    }

    this.loading = true;
    const request: ModelRequest = {
      ...this.modelForm.getRawValue(),
      couturierId: this.currentUserId,
    };

    this.modelService
      .create(request, allFiles)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.successMessage = 'Modèle créé avec succès!';
          this.models.unshift(response);
          this.loading = false;
          this.showForm = false;
          this.resetForm();
          this.cdr.markForCheck();

          setTimeout(() => {
            this.loadModels();
          }, REDIRECT_DELAY_MS);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Erreur lors de la création du modèle';
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * View model details
   */
  viewModel(model: Model): void {
    this.selectedModel = model;
    this.showDetailsModal = true;
    this.cdr.markForCheck();
  }

  /**
   * Close model details modal
   */
  closeModelDetails(): void {
    this.showDetailsModal = false;
    this.selectedModel = null;
    this.cdr.markForCheck();
  }

  /**
   * Delete a model
   */
  deleteModel(id: number | undefined): void {
    if (!id) return;

    if (confirm('Êtes-vous sûr de vouloir supprimer ce modèle?')) {
      this.modelService
        .delete(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.models = this.models.filter((m) => m.id !== id);
            this.successMessage = 'Modèle supprimé avec succès';
            this.cdr.markForCheck();
          },
          error: (error) => {
            this.errorMessage = error.error?.message || 'Erreur lors de la suppression';
            this.cdr.markForCheck();
          },
        });
    }
  }

  /**
   * Get color by ID
   */
  getColorName(colorId: number | undefined): string {
    if (!colorId) return 'Couleur inconnue';
    return this.colors.find((c) => c.id === colorId)?.nom || 'Couleur inconnue';
  }

  /**
   * Get tissu by ID
   */
  getTissuName(tissuId: number | undefined): string {
    if (!tissuId) return 'Tissu inconnu';
    return this.tissus.find((t) => t.id === tissuId)?.nom || 'Tissu inconnu';
  }
}
