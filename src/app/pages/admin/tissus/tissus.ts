import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DashboardLayoutComponent } from '../../../shared/components/dashboard-layout/dashboard-layout.component';
import { TissuType } from '../../../core/models/tissuType.model';
import { Tissu } from '../../../core/models/tissu.model';
import { Color } from '../../../core/models/color.model';
import { TissuColorResponse } from '../../../core/models/tissuColorResponse.model';
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
  tissuColors = signal<Map<number, TissuColorResponse[]>>(new Map()); // Map tissuId -> array of color responses

  // New: API Response data for tissue-color display
  tissuColorResponses = signal<TissuColorResponse[]>([]);

  // Color selection with chips
  selectedColorIds = signal<number[]>([]);
  colorSearchTerm = signal<string>('');

  // RGB Color picker
  showColorPicker = signal<boolean>(false);
  rgbRed = signal<number>(0);
  rgbGreen = signal<number>(255);
  rgbBlue = signal<number>(0);

  // Modal Image
  showImageModal = signal<boolean>(false);
  modalImageUrl = signal<string | null>(null);
  modalImageTissuName = signal<string | null>(null);

  // Image carousel state
  imagesForCurrentTissu = signal<Array<{ colorName: string; imageUrl: string }>>([]);
  currentImageIndex = signal<number>(0);
  currentTissuIdForImages = signal<number | null>(null);

  // Workflow State
  createdTissuId = signal<number | null>(null);
  createdTissuName = signal<string | null>(null);

  // Edit State
  editingTissuId = signal<number | null>(null);
  selectedImageFiles = signal<File[]>([]); // Ancien, gardé pour compatibilité

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

    // Load types
    this.tissuTypeService.getAll().subscribe({
      next: (types) => {
        this.types.set(types);
      },
      error: () => {
        console.warn('Could not load tissue types');
        this.error.set('Impossible de charger les types de tissu.');
      },
    });

    // Load colors
    this.colorService.getAll().subscribe({
      next: (colors) => {
        this.colors.set(colors);
      },
      error: () => {
        console.warn('Could not load colors');
        this.error.set('Impossible de charger les couleurs.');
      },
    });

    // Load tissues (most important - not dependent on types or colors)
    this.loadTissus();
  }

  loadTissus(): void {
    // Load tissues from the main API
    this.tissuService.getAll().subscribe({
      next: (tissues) => {
        console.log('Tissues loaded:', tissues);
        console.log('First tissue sample:', tissues[0]);
        this.tissus.set(tissues);
        this.isLoading.set(false);

        // Load tissue-color data in parallel (non-blocking)
        this.loadTissuColorData();
      },
      error: (err) => {
        console.error('Error loading tissues:', err);
        this.error.set('Impossible de charger les tissus.');
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Load tissue color data separately - non-blocking
   */
  private loadTissuColorData(): void {
    this.tissuColorService.getAllTissusWithCouleurs().subscribe({
      next: (rawResponses: any) => {
        console.log('Raw API response received:', rawResponses);
        console.log('Response type:', Array.isArray(rawResponses) ? 'Array' : typeof rawResponses);

        // Normalize responses to ensure they are in the expected format
        let responses: TissuColorResponse[] = [];

        if (Array.isArray(rawResponses)) {
          // Case 1: Direct array of color responses
          responses = rawResponses;
          console.log('Response is a direct array');
        } else if (rawResponses && typeof rawResponses === 'object') {
          // Case 2: Might be wrapped in an object or have a different structure
          console.warn('Response is not a direct array. Available keys:', Object.keys(rawResponses));
          if (Array.isArray(rawResponses.data)) {
            responses = rawResponses.data;
            console.log('Extracted from .data property');
          } else if (Array.isArray(rawResponses.colors)) {
            responses = rawResponses.colors;
            console.log('Extracted from .colors property');
          } else if (Array.isArray(rawResponses.tissuColors)) {
            responses = rawResponses.tissuColors;
            console.log('Extracted from .tissuColors property');
          } else {
            responses = rawResponses as TissuColorResponse[];
          }
        }

        console.log('Normalized responses count:', responses.length);
        if (responses.length > 0) {
          console.log('First response sample:', responses[0]);
        }

        // Enrich responses with color data if missing
        this.enrichResponsesWithColors(responses);

        // Store raw responses
        this.tissuColorResponses.set(responses);

        if (responses.length === 0) {
          console.warn('API returned empty response - falling back to loading colors per tissue');
          this.loadTissuColorsFallback();
        } else {
          // Build color map from responses
          const colorMap = this.buildTissuColorMap(responses);
          console.log('Built color map with size:', colorMap.size);
          this.tissuColors.set(colorMap);
        }
      },
      error: (err) => {
        // Non-blocking - log error but don't block UI
        console.error('Error loading tissue color data:', err);
        console.warn('Falling back to loading colors per tissue');
        // Set empty color map as fallback
        this.loadTissuColorsFallback();
      },
    });
  }

  /**
   * Fallback: Load colors for each tissue individually
   */
  private loadTissuColorsFallback(): void {
    const tissues = this.tissus();
    const colorMap = new Map<number, TissuColorResponse[]>();

    // For each tissue, load its colors from tissu-color service
    tissues.forEach(tissu => {
      if (tissu.id) {
        this.tissuColorService.getByTissuId(tissu.id).subscribe({
          next: (tissuColors) => {
            // Convert TissuColor[] to TissuColorResponse[] format
            const colorResponses: TissuColorResponse[] = tissuColors.map(tc => ({
              id: tc.id || 0,
              photo: tc.photo,
              active: tc.active,
              couleurId: tc.couleurId,
              tissuId: tc.tissuId,
              couleur: tc.couleur,
              tissu: tc.tissu,
            }));

            colorMap.set(tissu.id!, colorResponses);
            this.tissuColors.set(new Map(colorMap)); // Trigger reactivity
            console.log(`Loaded ${colorResponses.length} colors for tissue ${tissu.id}`);
          },
          error: (err) => {
            console.warn(`Could not load colors for tissue ${tissu.id}:`, err);
          },
        });
      }
    });
  }

  /**
   * Enrich responses with color data if the couleur field is missing
   * Uses couleurId to lookup color from the loaded colors array
   * Also triggers re-enrichment if colors load later
   */
  private enrichResponsesWithColors(responses: TissuColorResponse[]): void {
    const enrichWithCurrentColors = () => {
      const colors = this.colors();
      let enrichmentCount = 0;

      console.log('Attempting to enrich responses with colors. Available colors:', colors.length);

      responses.forEach((response, idx) => {
        // If couleur is missing but couleurId exists, lookup the color
        if (!response.couleur && response.couleurId && colors.length > 0) {
          const foundColor = colors.find(c => c.id === response.couleurId);
          if (foundColor) {
            response.couleur = foundColor;
            enrichmentCount++;
            console.log(`Response ${idx}: Enriched couleur from couleurId ${response.couleurId}:`, foundColor);
          } else {
            console.warn(`Response ${idx}: couleurId ${response.couleurId} not found in colors list`);
          }
        }
      });

      console.log(`Enrichment complete: ${enrichmentCount} colors enriched`);
      return enrichmentCount;
    };

    // Try enrichment immediately
    const enriched = enrichWithCurrentColors();

    // If colors weren't available, watch for them and retry
    if (enriched === 0 && responses.some(r => r.couleurId && !r.couleur)) {
      console.warn('Some responses need enrichment but colors not loaded yet. Setting up delayed retry...');
      // Retry after a short delay to allow colors to load
      setTimeout(() => {
        console.log('Retry: Attempting enrichment again...');
        enrichWithCurrentColors();
        // Rebuild color map with newly enriched data
        const colorMap = this.buildTissuColorMap(responses);
        this.tissuColors.set(colorMap);
        console.log('Color map rebuilt after enrichment retry');
      }, 500);
    }
  }

  /**
   * Build a map of tissu IDs to their color responses
   * Handles different API response structures
   */
  private buildTissuColorMap(responses: TissuColorResponse[]): Map<number, TissuColorResponse[]> {
    const colorMap = new Map<number, TissuColorResponse[]>();

    responses.forEach(response => {
      console.log('Processing response:', response);

      // Try to get tissuId from multiple sources
      const tissuId = response.tissuId || response.tissu?.id;

      if (!tissuId) {
        console.warn('Response without tissuId at any level:', response);
        return; // Skip this response
      }

      if (!colorMap.has(tissuId)) {
        colorMap.set(tissuId, []);
      }
      colorMap.get(tissuId)!.push(response);
      console.log(`Added color to tissue ${tissuId}. Color info:`, {
        colorName: response.couleur?.nom,
        hexCode: response.couleur?.codeHex,
        photoExists: !!response.photo,
        active: response.active
      });
    });

    // Enrich tissues with data from responses (e.g., prixMetre, active status)
    this.enrichTissusFromResponses(responses);

    const mapEntries = Array.from(colorMap.entries()).map(([id, colors]) => ({
      tissuId: id,
      colorCount: colors.length,
      colorsPreview: colors.map(c => ({
        name: c.couleur?.nom,
        hex: c.couleur?.codeHex,
        hasPhoto: !!c.photo
      }))
    }));
    console.log('Final color map entries:', mapEntries);
    return colorMap;
  }

  /**
   * Enrich tissue data with information from color responses
   * Searches for prixMetre in multiple locations (response.tissu or direct response)
   */
  private enrichTissusFromResponses(responses: TissuColorResponse[]): void {
    const tissues = this.tissus();
    const enrichedTissues = tissues.map(tissu => {
      // Find responses for this tissue
      const tissueResponses = responses.filter(r => r.tissuId === tissu.id);

      if (tissueResponses.length > 0) {
        const firstResponse = tissueResponses[0];

        // Try to get prix from different locations
        let prixMetre = tissu.prixMetre;
        if (firstResponse.tissu?.prixMetre) {
          prixMetre = firstResponse.tissu.prixMetre;
          console.log(`Tissue ${tissu.id}: Found prix in response.tissu:`, prixMetre);
        } else if ((firstResponse as any)?.prixMetre) {
          prixMetre = (firstResponse as any).prixMetre;
          console.log(`Tissue ${tissu.id}: Found prix in response root:`, prixMetre);
        }

        const enrichedTissu = {
          ...tissu,
          prixMetre: prixMetre,
          active: firstResponse.tissu?.active !== undefined ? firstResponse.tissu.active : tissu.active,
        };

        console.log(`Tissue ${tissu.id}: Enriched with prix=${prixMetre}`);
        return enrichedTissu;
      }
      return tissu;
    });

    console.log('Enriched tissues:', enrichedTissues);
    this.tissus.set(enrichedTissues);
  }

  loadTissuColors(tissuId: number): void {
    // This method is now handled by buildTissuColorMap
    // Kept for backward compatibility
  }

  getTissuColors(tissuId: number): TissuColorResponse[] {
    return this.tissuColors().get(tissuId) || [];
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

    // Check if we're editing or creating
    const isEditing = this.editingTissuId() !== null;
    const submitAction = isEditing
      ? this.tissuService.update(this.editingTissuId()!, payload)
      : this.tissuService.create(payload);

    submitAction.subscribe({
      next: (result) => {
        if (!result.id) {
          this.error.set('Erreur : l\'ID du tissu est manquant.');
          this.isSubmitting.set(false);
          return;
        }

        if (isEditing) {
          // Mode édition : mettre à jour le tableau
          const updatedTissus = this.tissus().map((t) =>
            t.id === this.editingTissuId() ? result : t
          );
          this.tissus.set(updatedTissus);
          this.successMessage.set(`Tissu "${result.nom}" modifié avec succès !`);

          // Reload color data to get updated prices
          this.loadTissuColorData();

          // Set up for color editing (step-2)
          const editedTissuId = this.editingTissuId()!;
          this.createdTissuId.set(editedTissuId);
          this.createdTissuName.set(result.nom);
          this.editingTissuId.set(null);
          this.isSubmitting.set(false);
          this.tissuForm.reset({ active: true, typeTissuId: null });

          // Pass to step-2 to edit colors (same as creation workflow)
          setTimeout(() => {
            this.goToStep('step-2');
          }, 1000);
        } else {
          // Mode création : passer à l'étape 2
          this.createdTissuId.set(result.id);
          this.createdTissuName.set(result.nom);
          this.tissus.set([result, ...this.tissus()]);
          this.tissuForm.reset({ active: true, typeTissuId: null });
          this.successMessage.set(`Tissu "${result.nom}" créé avec succès ! Passons à l'ajout des couleurs.`);
          this.isSubmitting.set(false);

          // ⏭️ Passer à l'étape 2 après 1 seconde
          setTimeout(() => {
            this.goToStep('step-2');
          }, 1000);
        }
      },
      error: (err) => {
        console.error('Erreur:', err); // Debug complet
        let errorMsg = isEditing ? 'Erreur lors de la modification du tissu.' : 'Erreur lors de la création du tissu.';

        if (err.error) {
          if (typeof err.error === 'string') {
            errorMsg = err.error;
          } else if (err.error.message) {
            errorMsg = err.error.message;
          }
        }

        this.error.set(errorMsg);
        this.isSubmitting.set(false);
      },
    });
  }

  /**
   * Toggle the RGB color picker
   */
  toggleColorPicker(): void {
    this.showColorPicker.set(!this.showColorPicker());
  }

  /**
   * Convert RGB to Hex
   */
  rgbToHex(): string {
    const r = this.rgbRed().toString(16).padStart(2, '0');
    const g = this.rgbGreen().toString(16).padStart(2, '0');
    const b = this.rgbBlue().toString(16).padStart(2, '0');
    return `#${r}${g}${b}`.toUpperCase();
  }

  /**
   * Parse Hex to RGB
   */
  hexToRgb(hex: string): void {
    const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (match) {
      this.rgbRed.set(parseInt(match[1], 16));
      this.rgbGreen.set(parseInt(match[2], 16));
      this.rgbBlue.set(parseInt(match[3], 16));
    }
  }

  /**
   * Update RGB sliders and apply color
   */
  applyRgbColor(): void {
    const hexColor = this.rgbToHex();
    this.colorForm.patchValue({ codeHex: hexColor });
    this.showColorPicker.set(false);
    console.log('Color applied:', hexColor);
  }

  /**   * Handle color picker change and update the form control
   */
  onColorPickerChange(event: Event, mode: 'new' | 'select'): void {
    const input = event.target as HTMLInputElement;
    const hexValue = input.value;
    console.log(`Color picked (${mode} mode):`, hexValue);

    // Update the form control with the hex value
    this.colorForm.patchValue({ codeHex: hexValue });
  }

  /**   * ÉTAPE 2️⃣ : Ajouter les couleurs et images
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

  // Modal Image Methods
  /**
   * Open image modal for a specific tissue with carousel
   */
  openImageModalForTissu(tissuId: number, tissuName: string): void {
    console.log(`Opening image modal for tissue ${tissuId} (${tissuName})`);

    // Get all color responses for this tissue
    const colorResponses = this.getTissuColors(tissuId);
    console.log(`Found ${colorResponses.length} color responses for tissue ${tissuId}`);

    // Debug: Log each response to see what's available
    colorResponses.forEach((response, idx) => {
      console.log(`  Response ${idx}:`, {
        id: response.id,
        hasPhoto: !!response.photo,
        photoPrev: response.photo?.substring(0, 50),
        hasCouleur: !!response.couleur,
        couleurNom: response.couleur?.nom,
        couleurHex: response.couleur?.codeHex,
      });
    });

    // Build array of images with color names
    const images = colorResponses
      .filter(response => {
        const hasPhoto = !!response.photo;
        const hasCouleur = !!response.couleur;
        if (!hasPhoto) console.log(`Skipping response - no photo`);
        if (!hasCouleur) console.log(`Skipping response - no couleur`);
        return hasPhoto && hasCouleur;
      })
      .map(response => ({
        colorName: response.couleur?.nom || 'Couleur inconnue',
        imageUrl: response.photo,
      }));

    console.log(`Filtered to ${images.length} images with photos and colors`, images);

    if (images.length > 0) {
      this.imagesForCurrentTissu.set(images);
      this.currentImageIndex.set(0);
      this.currentTissuIdForImages.set(tissuId);
      this.modalImageTissuName.set(tissuName);
      this.updateModalImageUrl();
      this.showImageModal.set(true);
      console.log(`Modal opened successfully with ${images.length} images`);
    } else {
      console.warn('No images found for tissue', tissuId, '- colorResponses:', colorResponses);
      alert(`Aucune image disponible pour ce tissu. Détails:\nColors trouvées: ${colorResponses.length}\nImages valides: ${images.length}`);
    }
  }

  /**
   * Update the modal image URL based on current index
   */
  private updateModalImageUrl(): void {
    const images = this.imagesForCurrentTissu();
    const index = this.currentImageIndex();

    if (images.length > 0 && index >= 0 && index < images.length) {
      this.modalImageUrl.set(images[index].imageUrl);
    }
  }

  /**
   * Navigate to next image in carousel
   */
  nextImage(): void {
    const images = this.imagesForCurrentTissu();
    const currentIndex = this.currentImageIndex();

    if (images.length > 1) {
      const nextIndex = (currentIndex + 1) % images.length;
      this.currentImageIndex.set(nextIndex);
      this.updateModalImageUrl();
    }
  }

  /**
   * Navigate to previous image in carousel
   */
  previousImage(): void {
    const images = this.imagesForCurrentTissu();
    const currentIndex = this.currentImageIndex();

    if (images.length > 1) {
      const previousIndex = (currentIndex - 1 + images.length) % images.length;
      this.currentImageIndex.set(previousIndex);
      this.updateModalImageUrl();
    }
  }

  closeImageModal(): void {
    this.showImageModal.set(false);
    this.modalImageUrl.set(null);
    this.modalImageTissuName.set(null);
    this.imagesForCurrentTissu.set([]);
    this.currentImageIndex.set(0);
    this.currentTissuIdForImages.set(null);
  }

  // Edit Tissu
  editTissu(tissuId: number): void {
    const tissu = this.tissus().find((t) => t.id === tissuId);
    if (!tissu) {
      console.error('Tissu not found');
      return;
    }

    // Track the editing tissu ID
    this.editingTissuId.set(tissuId);

    // Populate the form with the tissue data
    this.tissuForm.patchValue({
      reference: tissu.reference,
      nom: tissu.nom,
      largeur: tissu.largeur,
      prixMetre: tissu.prixMetre,
      typeTissuId: tissu.typeTissuId,
    });

    // Scroll to the form and change step to step-1
    this.goToStep('step-1');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Cancel Edit
  cancelEdit(): void {
    this.editingTissuId.set(null);
    this.tissuForm.reset({ active: true, typeTissuId: null });
  }

  // Toggle Active Status
  toggleActiveTissu(tissuId: number): void {
    const tissu = this.tissus().find((t) => t.id === tissuId);
    if (!tissu) {
      console.error('Tissu not found');
      return;
    }

    const updatedTissu = { ...tissu, active: !tissu.active };
    this.isSubmitting.set(true);

    this.tissuService.update(tissuId, updatedTissu).subscribe({
      next: () => {
        // Update the local array
        const updatedTissus = this.tissus().map((t) =>
          t.id === tissuId ? updatedTissu : t
        );
        this.tissus.set(updatedTissus);

        // Show success message
        this.successMessage.set(
          `Tissu ${updatedTissu.active ? 'activé' : 'désactivé'} avec succès`
        );
        setTimeout(() => this.successMessage.set(null), 3000);

        this.isSubmitting.set(false);
      },
      error: (err) => {
        console.error('Error toggling tissu status:', err);
        this.error.set('Erreur lors de la mise à jour du statut du tissu');
        this.isSubmitting.set(false);
      },
    });
  }
}
