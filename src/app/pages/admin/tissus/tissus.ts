import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DashboardLayoutComponent } from '../../../shared/components/dashboard-layout/dashboard-layout.component';
import { TissuType } from '../../../core/models/tissuType.model';
import { Tissu } from '../../../core/models/tissu.model';
import { Color } from '../../../core/models/color.model';
import { TissuService } from '../../../shared/services/tissu.service';
import { TissuTypeService } from '../../../shared/services/tissu-type.service';
import { TissuColorService } from '../../../shared/services/tissu-color.service';
import { ColorService } from '../../../shared/services/color.service';

type WorkflowStep = 'step-1' | 'step-2' | 'step-3';

@Component({
  selector: 'app-tissus',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DashboardLayoutComponent],
  templateUrl: './tissus.html',
  styleUrl: './tissus.css',
})
export class Tissus implements OnInit {
  // Step 1: Créer le tissu
  tissuForm: FormGroup;

  // Step 2: Ajouter les couleurs et images
  colorForm: FormGroup;
  colorFormMode = signal<'select' | 'new'>('select'); // Mode sélection ou création
  selectedColorImage = signal<File | null>(null); // Image sélectionnée

  // UI State
  currentStep = signal<WorkflowStep>('step-1');
  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Data
  tissus = signal<Tissu[]>([]);
  types = signal<TissuType[]>([]);
  colors = signal<Color[]>([]);

  // Color selection with chips
  selectedColorIds = signal<number[]>([]);
  colorSearchTerm = signal<string>('');

  // Workflow State
  createdTissuId = signal<number | null>(null);
  createdTissuName = signal<string | null>(null);
  selectedImageFiles = signal<File[]>([]); // Ancien, gardé pour compatibilité

  // Edit mode
  editingTissuId = signal<number | null>(null);

  constructor(
    private tissuService: TissuService,
    private tissuTypeService: TissuTypeService,
    private tissuColorService: TissuColorService,
    private colorService: ColorService,
    private fb: FormBuilder,
  ) {
    this.tissuForm = this.fb.group({
      reference: ['', [Validators.required, Validators.minLength(2)]],
      nom: ['', [Validators.required, Validators.minLength(2)]],
      largeur: [null],
      prixMetre: [null, [Validators.required]],
      active: [true],
      typeTissuId: [null, [Validators.required]],
    });

    this.colorForm = this.fb.group({
      couleurIds: [null, Validators.required],  // Array pour multichoix
      nom: [''],
      codeHex: [''],
      active: [true],
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

    this.colorService.getAll().subscribe({
      next: (colors) => {
        this.colors.set(colors);
      },
      error: () => {
        this.error.set('Impossible de charger les couleurs.');
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

  /**
   * ÉTAPE 1️⃣ : Créer le tissu
   * Envoie POST /tissus → récupère tissuId
   */
  submitTissu(): void {
    if (this.tissuForm.invalid) {
      this.tissuForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    const formValue = this.tissuForm.value;
    const payload: any = {
      reference: formValue.reference.trim(),
      nom: formValue.nom.trim(),
      prixMetre: Number(formValue.prixMetre),
      active: formValue.active ?? true,
      typeTissuId: Number(formValue.typeTissuId),
    };

    // Ajouter largeur seulement si elle a une valeur
    if (formValue.largeur !== null && formValue.largeur !== undefined && formValue.largeur !== '') {
      payload.largeur = Number(formValue.largeur);
    }

    console.log('Payload envoyé:', payload); // Debug

    this.tissuService.create(payload).subscribe({
      next: (created) => {
        if (!created.id) {
          this.error.set('Erreur : l\'ID du tissu créé est manquant.');
          this.isSubmitting.set(false);
          return;
        }

        // ✅ Étape 1 réussie : Stocker tissuId et passer à l'étape 2
        this.createdTissuId.set(created.id);
        this.createdTissuName.set(created.nom);
        this.tissus.set([created, ...this.tissus()]);
        this.tissuForm.reset({ active: true, typeTissuId: null });
        this.successMessage.set(`Tissu "${created.nom}" créé avec succès ! Passons à l'ajout des couleurs.`);
        this.isSubmitting.set(false);

        // ⏭️ Passer à l'étape 2 après 1 seconde
        setTimeout(() => {
          this.goToStep('step-2');
        }, 1000);
      },
      error: (err) => {
        console.error('Erreur 400:', err); // Debug complet
        let errorMsg = 'Erreur lors de la création du tissu.';

        if (err.error) {
          if (typeof err.error === 'string') {
            errorMsg = err.error;
          } else if (err.error.message) {
            errorMsg = err.error.message;
          }

          // Extraire les fieldErrors détaillés
          if (err.error.fieldErrors && typeof err.error.fieldErrors === 'object') {
            const fieldErrors = Object.entries(err.error.fieldErrors)
              .map(([field, errors]: any) => {
                const errorArray = Array.isArray(errors) ? errors : [errors];
                return `${field}: ${errorArray.join(', ')}`;
              })
              .join(' | ');

            if (fieldErrors) {
              errorMsg = `Validation échouée: ${fieldErrors}`;
              console.log('Field errors:', err.error.fieldErrors); // Debug détaillé
            }
          }
        }

        this.error.set(errorMsg);
        this.isSubmitting.set(false);
      },
    });
  }

  /**
   * ÉTAPE 2️⃣ : Ajouter les couleurs et images
   * Envoie POST /tissu-color avec tissuId + couleurId (ou crée une couleur d'abord)
   */
  submitColor(): void {
    const mode = this.colorFormMode();
    const formValue = this.colorForm.value;
    const tissuId = this.createdTissuId();

    if (!tissuId) {
      this.error.set('Erreur : l\'ID du tissu est manquant.');
      return;
    }

    // Validation selon le mode
    if (mode === 'select') {
      const selectedIds = this.selectedColorIds();

      if (!selectedIds || selectedIds.length === 0) {
        this.error.set('Veuillez sélectionner au moins une couleur.');
        return;
      }
      this.submitColorWithExistingColor(tissuId, selectedIds, formValue.active);
    } else {
      // Mode 'new'
      if (!formValue.nom || !formValue.nom.trim()) {
        this.error.set('Veuillez entrer le nom de la couleur.');
        return;
      }
      if (!formValue.codeHex || !formValue.codeHex.trim()) {
        this.error.set('Veuillez entrer le code hexa de la couleur.');
        return;
      }
      this.submitColorWithNewColor(tissuId, formValue.nom, formValue.codeHex, formValue.active);
    }
  }

  /**
   * Ajouter un tissu-color avec une ou plusieurs couleurs existantes (JSON)
   */
  private submitColorWithExistingColor(tissuId: number, couleurIds: number[], active: boolean): void {
    const imageFile = this.selectedColorImage();

    if (!imageFile) {
      this.error.set('Veuillez sélectionner une image.');
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    // Convertir l'image en base64
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64String = e.target.result;

      console.log('Envoi couleurs existantes avec image:', { tissuId, couleurIds, active });

      let completedCount = 0;
      let errorOccurred = false;

      // Créer un tissu-color pour chaque couleur sélectionnée
      couleurIds.forEach((couleurId) => {
        const payload = {
          tissuId,
          couleurId: Number(couleurId),
          photo: base64String, // Image en base64
          active: active ?? true,
        };

        this.tissuColorService.create(payload as any).subscribe({
          next: () => {
            completedCount++;
            if (completedCount === couleurIds.length && !errorOccurred) {
              this.successMessage.set(
                `${couleurIds.length} couleur${couleurIds.length > 1 ? 's' : ''} ajoutée${couleurIds.length > 1 ? 's' : ''} avec succès au tissu "${this.createdTissuName()}" !`
              );
              this.colorForm.reset();
              this.colorForm.patchValue({ active: true });
              this.colorFormMode.set('select');
              this.selectedColorImage.set(null);
              this.selectedColorIds.set([]);
              this.colorSearchTerm.set('');
              this.isSubmitting.set(false);

              setTimeout(() => {
                this.goToStep('step-3');
              }, 1000);
            }
          },
          error: (err) => {
            if (!errorOccurred) {
              console.error('Erreur couleur:', err);
              let errorMsg = 'Erreur lors de l\'ajout des couleurs.';
              if (err.error?.fieldErrors) {
                const fieldErrors = Object.entries(err.error.fieldErrors)
                  .map(([field, errors]: any) => {
                    const errorArray = Array.isArray(errors) ? errors : [errors];
                    return `${field}: ${errorArray.join(', ')}`;
                  })
                  .join(' | ');
                if (fieldErrors) errorMsg = `Validation échouée: ${fieldErrors}`;
              }
              this.error.set(errorMsg);
              this.isSubmitting.set(false);
              errorOccurred = true;
            }
          },
        });
      });
    };

    reader.onerror = () => {
      this.error.set('Erreur lors de la lecture de l\'image.');
      this.isSubmitting.set(false);
    };

    reader.readAsDataURL(imageFile);
  }

  /**
   * Créer une nouvelle couleur ET l'ajouter au tissu
   */
  private submitColorWithNewColor(tissuId: number, nom: string, codeHex: string, active: boolean): void {
    const imageFile = this.selectedColorImage();

    if (!imageFile) {
      this.error.set('Veuillez sélectionner une image.');
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    console.log('Création couleur + ajout au tissu:', { nom, codeHex });

    const newColor: Color = {
      nom: nom.trim(),
      codeHex: codeHex.trim(),
    };

    // Convertir l'image en base64
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64String = e.target.result;

      // D'abord créer la couleur
      this.colorService.create(newColor).subscribe({
        next: (createdColor) => {
          if (!createdColor.id) {
            this.error.set('Erreur : l\'ID de la couleur créée est manquant.');
            this.isSubmitting.set(false);
            return;
          }

          // Puis ajouter le tissu-color
          const payload = {
            tissuId,
            couleurId: createdColor.id,
            photo: base64String, // Image en base64
            active: active ?? true,
          };

          this.tissuColorService.create(payload as any).subscribe({
            next: () => {
              this.successMessage.set(
                `Couleur "${nom}" créée et ajoutée avec succès au tissu "${this.createdTissuName()}" !`
              );
              this.colorForm.reset({ active: true });
              this.colorFormMode.set('select');
              this.colors.set([createdColor, ...this.colors()]);
              this.selectedColorImage.set(null);
              this.isSubmitting.set(false);

              setTimeout(() => {
                this.goToStep('step-3');
              }, 1000);
            },
            error: (err) => {
              console.error('Erreur tissu-color:', err);
              let errorMsg = 'Erreur lors de l\'ajout du tissu-color.';
              if (err.error?.fieldErrors) {
                const fieldErrors = Object.entries(err.error.fieldErrors)
                  .map(([field, errors]: any) => {
                    const errorArray = Array.isArray(errors) ? errors : [errors];
                    return `${field}: ${errorArray.join(', ')}`;
                  })
                  .join(' | ');
                if (fieldErrors) errorMsg = `Validation échouée: ${fieldErrors}`;
              }
              this.error.set(errorMsg);
              this.isSubmitting.set(false);
            },
          });
        },
        error: (err) => {
          console.error('Erreur création couleur:', err);
          let errorMsg = 'Erreur lors de la création de la couleur.';
          if (err.error?.fieldErrors) {
            const fieldErrors = Object.entries(err.error.fieldErrors)
              .map(([field, errors]: any) => {
                const errorArray = Array.isArray(errors) ? errors : [errors];
                return `${field}: ${errorArray.join(', ')}`;
              })
              .join(' | ');
            if (fieldErrors) errorMsg = `Validation échouée: ${fieldErrors}`;
          }
          this.error.set(errorMsg);
          this.isSubmitting.set(false);
        },
      });
    };

    reader.onerror = () => {
      this.error.set('Erreur lors de la lecture de l\'image.');
      this.isSubmitting.set(false);
    };

    reader.readAsDataURL(imageFile);
  }

  /**
   * ÉTAPE 3️⃣ : Confirmation / Feedback
   * Afficher un message de succès et proposer les options suivantes
   */
  finishWorkflow(): void {
    // Réinitialiser le workflow
    this.createdTissuId.set(null);
    this.createdTissuName.set(null);
    this.selectedColorImage.set(null);
    this.successMessage.set(null);
    this.error.set(null);
    this.selectedColorIds.set([]);
    this.colorSearchTerm.set('');

    // Retourner à l'étape 1
    this.goToStep('step-1');

    // Recharger la liste des tissus
    this.loadTissus();
  }

  /**
   * Navigation entre les étapes
   */
  goToStep(step: WorkflowStep): void {
    this.currentStep.set(step);
  }

  goBack(): void {
    this.error.set(null);
    this.successMessage.set(null);

    if (this.currentStep() === 'step-2') {
      // Si on revient à step 1, on réinitialise
      this.colorForm.reset({ active: true });
      this.selectedColorImage.set(null);
      this.selectedColorIds.set([]);
      this.colorSearchTerm.set('');
      this.goToStep('step-1');
    } else if (this.currentStep() === 'step-3') {
      this.goToStep('step-2');
    }
  }

  /**
   * Gestion des fichiers images
   */
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedColorImage.set(input.files[0]);
    }
  }

  getImageFileName(): string {
    const file = this.selectedColorImage();
    return file ? file.name : 'Aucune image sélectionnée';
  }

  onCouleursSelected(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const selectedValues: number[] = [];

    for (let i = 0; i < select.options.length; i++) {
      const option = select.options[i];
      if (option.selected) {
        selectedValues.push(Number(option.value));
      }
    }

    this.colorForm.patchValue({ couleurIds: selectedValues });
  }

  addColor(colorId: number | undefined): void {
    if (!colorId) return;
    const current = this.selectedColorIds();
    if (!current.includes(colorId)) {
      this.selectedColorIds.set([...current, colorId]);
    }
    this.colorSearchTerm.set(''); // Réinitialiser la recherche
  }

  removeColor(colorId: number): void {
    this.selectedColorIds.set(this.selectedColorIds().filter(id => id !== colorId));
  }

  getFilteredColors(): Color[] {
    const selected = this.selectedColorIds();
    const search = this.colorSearchTerm().toLowerCase();

    return this.colors().filter(color => {
      // Exclure les couleurs déjà sélectionnées
      if (color.id && selected.includes(color.id)) return false;

      // Filtrer par terme de recherche
      if (search) {
        return color.nom.toLowerCase().includes(search) ||
               (color.codeHex && color.codeHex.toLowerCase().includes(search));
      }

      return true;
    });
  }

  onSearchColorInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.colorSearchTerm.set(input.value);
  }

  getSelectedColorNames(): string {
    const selected = this.selectedColorIds();
    return selected
      .map(id => this.colors().find(c => c.id === id)?.nom)
      .filter(Boolean)
      .join(', ');
  }

  /**
   * Utilitaires pour l'affichage
   */
  getColorName(colorId: number): string {
    const color = this.colors().find((item) => item.id === colorId);
    return color?.nom ?? 'Inconnu';
  }

  getTypeName(typeId: number): string {
    const type = this.types().find((item) => item.id === typeId);
    return type?.nom ?? 'Inconnu';
  }
}
