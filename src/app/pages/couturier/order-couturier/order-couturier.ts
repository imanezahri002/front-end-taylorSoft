import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { OrderCoutourierService } from '../../../shared/services/order-couturier.service';
import { TissuColorService } from '../../../shared/services/tissu-color.service';
import { FournisseurService } from '../../../shared/services/fournisseur.service';
import {
  CoutourierOrderRequest,
  CoutourierOrderItemRequest,
} from '../../../core/models/orderCouturier.model';
import { TissuColor } from '../../../core/models/tissuColor.model';
import { DashboardLayoutComponent } from '../../../shared/components/dashboard-layout/dashboard-layout.component';

@Component({
  selector: 'app-order-couturier',
  imports: [CommonModule, ReactiveFormsModule, DashboardLayoutComponent],
  templateUrl: './order-couturier.html',
  styleUrl: './order-couturier.css',
})
export class OrderCouturier implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly orderService = inject(OrderCoutourierService);
  private readonly tissuColorService = inject(TissuColorService);
  private readonly fournisseurService = inject(FournisseurService);

  orderForm: FormGroup;
  tissuColors: TissuColor[] = [];
  fournisseurs: any[] = [];
  loading = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';
  showForm = false;
  currentUserId = 1; // À récupérer du service d'authentification
  itemPhotos = signal<Map<number, File[]>>(new Map()); // Store files for each item index

  constructor() {
    this.orderForm = this.formBuilder.group({
      fournisseurId: ['', Validators.required],
      items: this.formBuilder.array([]),
    });
  }

  ngOnInit() {
    this.loadFournisseurs();
    this.loadTissuColors();
    this.addItem(); // Ajouter une première ligne vide
  }

  /**
   * Load all fournisseurs
   */
  loadFournisseurs() {
    this.fournisseurService.getAll().subscribe({
      next: (data) => {
        this.fournisseurs = data;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des fournisseurs', error);
        this.errorMessage = 'Erreur lors du chargement des fournisseurs';
      },
    });
  }

  /**
   * Load all tissu colors
   */
  loadTissuColors() {
    this.tissuColorService.getAll().subscribe({
      next: (data) => {
        this.tissuColors = data;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des couleurs de tissu', error);
        this.errorMessage = 'Erreur lors du chargement des couleurs de tissu';
      },
    });
  }

  /**
   * Get items form array
   */
  get items(): FormArray {
    return this.orderForm.get('items') as FormArray;
  }

  /**
   * Get items as FormGroup[] for type safety in template
   */
  get itemControls(): FormGroup[] {
    return this.items.controls as FormGroup[];
  }

  /**
   * Add a new item row
   */
  addItem() {
    const itemForm = this.formBuilder.group({
      tissuColorId: ['', Validators.required],
      nombreMetres: ['', [Validators.required, Validators.min(0.01)]],
      prixMetre: [{ value: 0, disabled: true }],
      prixTotalMetres: [{ value: 0, disabled: true }],
    });

    // Subscribe to tissuColorId changes to update price
    itemForm.get('tissuColorId')?.valueChanges.subscribe((colorId) => {
      this.updateItemPrice(itemForm, colorId);
    });

    this.items.push(itemForm);
  }

  /**
   * Remove item from array
   */
  removeItem(index: number) {
    if (this.items.length > 1) {
      this.items.removeAt(index);
      // Remove photos for this item
      const photos = this.itemPhotos();
      photos.delete(index);
      this.itemPhotos.set(new Map(photos));
    }
  }

  /**
   * Handle multiple photo uploads for an item
   */
  onPhotosSelected(index: number, event: any) {
    const files = event.target.files as FileList;
    if (files && files.length > 0) {
      const photos = this.itemPhotos();
      const currentPhotos = photos.get(index) || [];
      // Add new files to existing photos
      const newPhotos = [...currentPhotos, ...Array.from(files)];
      photos.set(index, newPhotos);
      this.itemPhotos.set(new Map(photos));
      console.log(`${newPhotos.length} photo(s) ajoutée(s) pour l'article ${index}`);
    }
  }

  /**
   * Remove a specific photo from an item
   */
  removePhoto(itemIndex: number, photoIndex: number) {
    const photos = this.itemPhotos();
    const itemPhotos = photos.get(itemIndex) || [];
    itemPhotos.splice(photoIndex, 1);
    if (itemPhotos.length > 0) {
      photos.set(itemIndex, itemPhotos);
    } else {
      photos.delete(itemIndex);
    }
    this.itemPhotos.set(new Map(photos));
  }

  /**
   * Get photos for an item
   */
  getItemPhotos(index: number): File[] {
    return this.itemPhotos().get(index) || [];
  }

  /**
   * Get preview URL for a file
   */
  getPhotoPreview(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * Update item price based on selected tissu color (using tissu.prixMetre)
   */
  updateItemPrice(itemForm: FormGroup, tissuColorId: any) {
    const selectedColor = this.tissuColors.find((tc) => tc.id === tissuColorId);
    if (selectedColor && selectedColor.tissu) {
      itemForm.patchValue({
        prixMetre: selectedColor.tissu.prixMetre || 0,
      });
      this.calculateItemTotal(itemForm);
    }
  }

  /**
   * Calculate total price for an item (nombreMetres * prixMetre)
   */
  calculateItemTotal(itemForm: any) {
    if (itemForm && typeof itemForm.get === 'function') {
      const nombreMetres = itemForm.get('nombreMetres')?.value || 0;
      const prixMetre = itemForm.get('prixMetre')?.value || 0;
      const total = nombreMetres * prixMetre;
      itemForm.patchValue({ prixTotalMetres: total }, { emitEvent: false });
    }
  }

  /**
   * Get total price of all items
   */
  getTotalPrice(): number {
    let total = 0;
    this.items.controls.forEach((item) => {
      total += item.get('prixTotalMetres')?.value || 0;
    });
    return total;
  }

  /**
   * Submit the order form
   */
  submitOrder() {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.orderForm.invalid) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    if (this.items.length === 0) {
      this.errorMessage = 'Veuillez ajouter au moins un article à la commande';
      return;
    }

    this.loading = true;

    const orderRequest: CoutourierOrderRequest = {
      couturierId: this.currentUserId,
      fournisseurId: this.orderForm.get('fournisseurId')?.value,
      items: this.items.value.map((item: any) => ({
        tissuColorId: item.tissuColorId,
        nombreMetres: item.nombreMetres,
      } as CoutourierOrderItemRequest)),
    };

    this.orderService.create(orderRequest).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = 'Commande créée avec succès!';
        this.resetForm();
        // Optionnel: rediriger vers les commandes
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        this.loading = false;
        console.error('Erreur lors de la création de la commande', error);
        this.errorMessage =
          error.error?.message ||
          'Erreur lors de la création de la commande';
      },
    });
  }

  /**
   * Reset the form
   */
  resetForm() {
    this.orderForm.reset();
    this.items.clear();
    this.addItem();
    this.submitted = false;
  }

  /**
   * Open the order form modal
   */
  openForm() {
    this.showForm = true;
  }

  /**
   * Close the order form modal
   */
  closeForm() {
    this.showForm = false;
    this.resetForm();
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * Get tissu color display name
   */
  getTissuColorDisplay(id: number): string {
    const color = this.tissuColors.find((tc) => tc.id === id);
    return color && color.tissu && color.couleur
      ? `${color.tissu.nom} - ${color.couleur.nom}`
      : 'Sélectionner une couleur';
  }

  /**
   * Get fournisseur display name
   */
  getFournisseurDisplay(id: number): string {
    const fournisseur = this.fournisseurs.find((f) => f.id === id);
    return fournisseur
      ? fournisseur.nomEntreprise || fournisseur.firstName
      : 'Sélectionner un fournisseur';
  }
}
