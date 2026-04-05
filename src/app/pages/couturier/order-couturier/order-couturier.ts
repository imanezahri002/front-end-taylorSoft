import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { OrderCoutourierService } from '../../../shared/services/order-couturier.service';
import { TissuColorService } from '../../../shared/services/tissu-color.service';
import { UserService } from '../../../shared/services/user.service';
import { AuthService } from '../../../shared/services/auth.service';
import {
  CoutourierOrder,
  CoutourierOrderRequest,
  CoutourierOrderItemRequest,
} from '../../../core/models/orderCouturier.model';
import { TissuColor } from '../../../core/models/tissuColor.model';
import { UserResponse } from '../../../core/models/user.model';
import { DashboardLayoutComponent } from '../../../shared/components/dashboard-layout/dashboard-layout.component';

// Constants
const REDIRECT_DELAY_MS = 2000;
const DEFAULT_COLOR_HEX = '#E5E4E2';
const ORDER_ID_PADDING = 5;

@Component({
  selector: 'app-order-couturier',
  imports: [CommonModule, ReactiveFormsModule, DashboardLayoutComponent],
  templateUrl: './order-couturier.html',
  styleUrl: './order-couturier.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderCouturier implements OnInit, OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly orderService = inject(OrderCoutourierService);
  private readonly tissuColorService = inject(TissuColorService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  orderForm: FormGroup;
  tissuColors: TissuColor[] = [];
  fournisseurs: UserResponse[] = [];
  orders: CoutourierOrder[] = [];
  loading = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';
  showForm = false;
  showOrderDetailsModal = false;
  selectedOrder: CoutourierOrder | null = null;
  currentUserId: number = 0;

  constructor() {
    this.orderForm = this.createOrderForm();
  }

  private createOrderForm(): FormGroup {
    return this.formBuilder.group({
      fournisseurId: ['', Validators.required],
      items: this.formBuilder.array([]),
    });
  }

  ngOnInit(): void {
    const userId = this.authService.getUserId();
    console.log('AuthService getUserId():', userId);
    if (userId) {
      this.currentUserId = userId;
      console.log('currentUserId set to:', this.currentUserId);
    } else {
      this.errorMessage = 'Vous devez être connecté pour créer une commande';
    }

    this.loadFournisseurs();
    this.loadTissuColors();
    this.loadOrders();
    this.addItem();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load all fournisseurs
   */
  loadFournisseurs(): void {
    this.userService.getAllSuppliers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.fournisseurs = data;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Erreur lors du chargement des fournisseurs';
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Load all tissu colors
   */
  loadTissuColors(): void {
    this.tissuColorService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.tissuColors = data;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Erreur lors du chargement des couleurs de tissu';
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Load all orders for current user
   */
  loadOrders(): void {
    console.log('loadOrders() called with currentUserId:', this.currentUserId);
    if (!this.currentUserId) {
      console.warn('No currentUserId, skipping loadOrders');
      return;
    }

    this.orderService.getByCouturierId(this.currentUserId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('Orders loaded successfully:', data);
          console.log('First order structure:', JSON.stringify(data[0], null, 2));
          this.orders = data;
          this.cdr.markForCheck();
          console.log('Total orders:', this.orders.length);
        },
        error: (error) => {
          console.error('Error loading orders:', error);
          // Error silently logged by interceptor
        },
      });
  }

  /**
   * Enrich order with complete tissuColor data
   * Maps each item's tissuColorId to the full TissuColor object
   */
  private enrichOrderWithTissuColors(order: CoutourierOrder): CoutourierOrder {
    return {
      ...order,
      items: order.items.map(item => ({
        ...item,
        tissuColor: item.tissuColorId
          ? this.findTissuColor(item.tissuColorId)
          : item.tissuColor
      }))
    };
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
  addItem(): void {
    const itemForm = this.createItemForm();

    itemForm.get('tissuColorId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((colorId) => {
        this.updateItemPrice(itemForm, colorId);
      });

    this.items.push(itemForm);
  }

  private createItemForm(): FormGroup {
    return this.formBuilder.group({
      tissuColorId: ['', Validators.required],
      nombreMetres: ['', [Validators.required, Validators.min(0.01)]],
      prixMetre: [{ value: 0, disabled: true }],
      prixTotalMetres: [{ value: 0, disabled: true }],
    });
  }

  /**
   * Remove item from array
   */
  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }



  /**
   * Update item price based on selected tissu color (using tissu.prixMetre)
   */
  private updateItemPrice(itemForm: FormGroup, tissuColorId: number): void {
    const selectedColor = this.tissuColors.find((tc) => tc.id === tissuColorId);
    if (selectedColor?.tissu) {
      itemForm.patchValue({
        prixMetre: selectedColor.tissu.prixMetre || 0,
      });
      this.calculateItemTotal(itemForm);
    }
  }

  /**
   * Calculate total price for an item (nombreMetres * prixMetre)
   */
  private calculateItemTotal(itemForm: FormGroup): void {
    const nombreMetres = itemForm.get('nombreMetres')?.value || 0;
    const prixMetre = itemForm.get('prixMetre')?.value || 0;
    const total = nombreMetres * prixMetre;
    itemForm.patchValue({ prixTotalMetres: total }, { emitEvent: false });
  }

  /**
   * Get total price of all items
   */
  getTotalPrice(): number {
    return this.items.controls.reduce((sum, item) => {
      return sum + (item.get('prixTotalMetres')?.value || 0);
    }, 0);
  }

  /**
   * Submit the order form
   */
  submitOrder(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    const validationError = this.validateOrder();
    if (validationError) {
      this.errorMessage = validationError;
      return;
    }

    this.loading = true;
    const orderRequest = this.buildOrderRequest();

    this.orderService.create(orderRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.handleOrderSuccess(response);
        },
        error: (error) => {
          this.handleOrderError(error);
        },
      });
  }

  private validateOrder(): string | null {
    if (!this.currentUserId || this.currentUserId === 0) {
      return 'Vous devez être connecté pour créer une commande';
    }
    if (this.orderForm.invalid) {
      return 'Veuillez remplir tous les champs obligatoires';
    }
    if (this.items.length === 0) {
      return 'Veuillez ajouter au moins un article à la commande';
    }
    return null;
  }

  private buildOrderRequest(): CoutourierOrderRequest {
    return {
      couturierId: this.currentUserId,
      fournisseurId: Number(this.orderForm.get('fournisseurId')?.value),
      items: this.items.value.map((item: any) => ({
        tissuColorId: Number(item.tissuColorId),
        nombreMetres: Number(item.nombreMetres),
      } as CoutourierOrderItemRequest)),
    };
  }

  private handleOrderSuccess(response: CoutourierOrder): void {
    this.loading = false;
    this.successMessage = 'Commande créée avec succès!';
    this.orders.unshift(response);
    this.showForm = false;
    this.resetForm();
    this.cdr.markForCheck();

    setTimeout(() => {
      this.router.navigate(['/couturier/orders']);
    }, REDIRECT_DELAY_MS);
  }

  private handleOrderError(error: any): void {
    this.loading = false;
    this.errorMessage = error.error?.message || 'Erreur lors de la création de la commande';
    this.cdr.markForCheck();
  }

  /**
   * Reset the form
   */
  resetForm(): void {
    this.orderForm.reset();
    this.items.clear();
    this.addItem();
    this.submitted = false;
  }

  /**
   * Open the order form modal
   */
  openForm(): void {
    this.showForm = true;
    this.cdr.markForCheck();
  }

  /**
   * Close the order form modal
   */
  closeForm(): void {
    this.showForm = false;
    this.resetForm();
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();
  }

  /**
   * Get tissu color display name
   */
  getTissuColorDisplay(id: number): string {
    const color = this.findTissuColor(id);
    if (!color) return 'Sélectionner une couleur';

    const tissuName = color.tissuNom || color.tissu?.nom;
    const colorName = color.couleurNom || color.couleur?.nom;

    return tissuName && colorName ? `${tissuName} - ${colorName}` : 'Sélectionner une couleur';
  }

  private findTissuColor(id: number): TissuColor | undefined {
    return this.tissuColors.find((tc) => tc.id === id);
  }

  /**
   * Format order ID for display
   */
  formatOrderId(id: number | undefined): string {
    if (!id) return '#ORD-00000';
    return `#ORD-${String(id).padStart(ORDER_ID_PADDING, '0')}`;
  }

  /**
   * Calculate total meters for an order
   */
  calculateOrderTotalMeters(order: CoutourierOrder): number {
    return order.items?.reduce((sum, item) => sum + (item.nombreMetres || 0), 0) || 0;
  }

  /**
   * Handle tissu color selection change
   */
  onTissuColorChange(itemIndex: number): void {
    const selectedColorId = this.items.at(itemIndex)?.get('tissuColorId')?.value;
    if (!selectedColorId) return;

    const selectedColor = this.findTissuColor(Number(selectedColorId));
    if (selectedColor?.prixMetre) {
      this.items.at(itemIndex)?.patchValue({
        prixMetre: selectedColor.prixMetre,
      });
      const itemForm = this.items.at(itemIndex) as FormGroup;
      this.calculateItemTotal(itemForm);
    }
  }

  /**
   * Get selected color hex code for display
   */
  getSelectedColorHex(itemIndex: number): string {
    const selectedColorId = this.items.at(itemIndex)?.get('tissuColorId')?.value;
    if (!selectedColorId) {
      return DEFAULT_COLOR_HEX;
    }

    const colorIdAsNumber = Number(selectedColorId);
    const selectedColor = this.findTissuColor(colorIdAsNumber);

    if (!selectedColor) {
      return DEFAULT_COLOR_HEX;
    }

    const hexCode = selectedColor.couleurCodeHex?.trim() || selectedColor.couleur?.codeHex?.trim();
    return hexCode || DEFAULT_COLOR_HEX;
  }

  /**
   * Get selected color name
   */
  getSelectedColorName(itemIndex: number): string {
    const selectedColorId = this.items.at(itemIndex)?.get('tissuColorId')?.value;
    if (!selectedColorId) {
      return 'Aucune couleur sélectionnée';
    }

    const selectedColor = this.findTissuColor(Number(selectedColorId));
    return selectedColor?.couleurNom || selectedColor?.couleur?.nom || 'Couleur sélectionnée';
  }

  /**
   * View order items details
   */
  viewOrderItems(order: CoutourierOrder): void {
    // Enrich the order with complete tissuColor data before displaying
    this.selectedOrder = this.enrichOrderWithTissuColors(order);
    this.showOrderDetailsModal = true;
    console.log('Order enriched and modal opened:', this.selectedOrder);
    this.cdr.markForCheck();
  }

  /**
   * Close order details modal
   */
  closeOrderDetails(): void {
    this.showOrderDetailsModal = false;
    this.selectedOrder = null;
    this.cdr.markForCheck();
  }

  /**
   * Edit an existing order
   */
  editOrder(order: CoutourierOrder): void {
    console.log('Editing order:', order.id);
    alert('Fonction modification commande - À implémenter');
    // TODO: Implement order editing
  }

  /**
   * Delete an order
   */
  deleteOrder(orderId: number | undefined): void {
    if (!orderId) return;

    if (confirm('Êtes-vous sûr de vouloir supprimer cette commande?')) {
      console.log('Deleting order:', orderId);
      this.orderService.delete(orderId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.orders = this.orders.filter(o => o.id !== orderId);
            this.successMessage = 'Commande supprimée avec succès';
            this.cdr.markForCheck();
          },
          error: (error) => {
            this.errorMessage = 'Erreur lors de la suppression de la commande';
            console.error('Delete error:', error);
            this.cdr.markForCheck();
          }
        });
    }
  }
}
