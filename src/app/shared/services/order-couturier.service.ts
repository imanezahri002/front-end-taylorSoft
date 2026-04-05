import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CoutourierOrder,
  CoutourierOrderRequest,
  CoutourierOrderStatus,
} from '../../core/models/orderCouturier.model';

@Injectable({
  providedIn: 'root',
})
export class OrderCoutourierService {
  private apiUrl = `${environment.apiUrl}/coutourier-orders`;
  private readonly http = inject(HttpClient);

  /**
   * Create a new couturier order with items
   * @param request CoutourierOrderRequest containing order items
   * @returns Observable<CoutourierOrder>
   */
  create(request: CoutourierOrderRequest): Observable<CoutourierOrder> {
    return this.http.post<CoutourierOrder>(this.apiUrl, request);
  }

  /**
   * Get all orders
   * @returns Observable<CoutourierOrder[]>
   */
  getAll(): Observable<CoutourierOrder[]> {
    return this.http.get<CoutourierOrder[]>(this.apiUrl);
  }

  /**
   * Get order by ID
   * @param id Order ID
   * @returns Observable<CoutourierOrder>
   */
  getById(id: number): Observable<CoutourierOrder> {
    return this.http.get<CoutourierOrder>(`${this.apiUrl}/${id}`);
  }

  /**
   * Update an existing order
   * @param id Order ID
   * @param request CoutourierOrderRequest with updated data
   * @returns Observable<CoutourierOrder>
   */
  update(
    id: number,
    request: CoutourierOrderRequest
  ): Observable<CoutourierOrder> {
    return this.http.put<CoutourierOrder>(`${this.apiUrl}/${id}`, request);
  }

  /**
   * Delete an order
   * @param id Order ID
   * @returns Observable<void>
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get orders by couturier ID
   * @param couturierId Couturier ID
   * @returns Observable<CoutourierOrder[]>
   */
  getByCouturierId(couturierId: number): Observable<CoutourierOrder[]> {
    return this.http.get<CoutourierOrder[]>(
      `${this.apiUrl}/coutourier/${couturierId}`
    );
  }

  /**
   * Get orders by fournisseur ID
   * @param fournisseurId Fournisseur ID
   * @returns Observable<CoutourierOrder[]>
   */
  getByFournisseurId(
    fournisseurId: number
  ): Observable<CoutourierOrder[]> {
    return this.http.get<CoutourierOrder[]>(
      `${this.apiUrl}/fournisseur/${fournisseurId}`
    );
  }

  /**
   * Get orders by status
   * @param status Order status
   * @returns Observable<CoutourierOrder[]>
   */
  getByStatus(status: CoutourierOrderStatus): Observable<CoutourierOrder[]> {
    return this.http.get<CoutourierOrder[]>(
      `${this.apiUrl}/status/${status}`
    );
  }

  /**
   * Update order status
   * @param id Order ID
   * @param status New status
   * @returns Observable<CoutourierOrder>
   */
  updateStatus(
    id: number,
    status: CoutourierOrderStatus
  ): Observable<CoutourierOrder> {
    return this.http.patch<CoutourierOrder>(
      `${this.apiUrl}/${id}/status`,
      { status }
    );
  }
}
