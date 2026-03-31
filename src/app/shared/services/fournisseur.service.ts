import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Fournisseur, FournisseurResponse, FournisseurRequest } from '../../core/models/fournisseur.model';

@Injectable({
  providedIn: 'root',
})
export class FournisseurService {
  private apiUrl = `${environment.apiUrl}/fournisseurs`;
  private readonly http = inject(HttpClient);

  /**
   * Get all fournisseurs
   */
  getAll(): Observable<FournisseurResponse[]> {
    return this.http.get<FournisseurResponse[]>(this.apiUrl);
  }

  /**
   * Get fournisseur by ID
   */
  getById(id: number): Observable<FournisseurResponse> {
    return this.http.get<FournisseurResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new fournisseur
   */
  create(request: FournisseurRequest): Observable<FournisseurResponse> {
    return this.http.post<FournisseurResponse>(this.apiUrl, request);
  }

  /**
   * Update a fournisseur
   */
  update(
    id: number,
    request: FournisseurRequest
  ): Observable<FournisseurResponse> {
    return this.http.put<FournisseurResponse>(`${this.apiUrl}/${id}`, request);
  }

  /**
   * Delete a fournisseur
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
