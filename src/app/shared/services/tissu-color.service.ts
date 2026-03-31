import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {TissuColor} from '../../core/models/tissuColor.model';

@Injectable({
  providedIn: 'root',
})
export class TissuColorService {
  private apiUrl = `${environment.apiUrl}/tissu-color`;
  private readonly http = inject(HttpClient);

  /**
   * Get all tissu colors
   */
  getAll(): Observable<TissuColor[]> {
    return this.http.get<TissuColor[]>(this.apiUrl);
  }

  /**
   * Get tissu color by ID
   */
  getById(id: number): Observable<TissuColor> {
    return this.http.get<TissuColor>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new tissu color
   */
  create(request: TissuColor): Observable<TissuColor> {
    return this.http.post<TissuColor>(this.apiUrl, request);
  }

  /**
   * Create a new tissu color with image (multipart/form-data)
   * @param tissuId - The tissu ID
   * @param couleurId - The couleur ID
   * @param imageFiles - One or more image files
   * @param active - Whether the tissu color is active
   */
  createWithImages(
    tissuId: number,
    couleurId: number,
    imageFiles: File[],
    active: boolean = true
  ): Observable<TissuColor> {
    const formData = new FormData();
    formData.append('tissuId', tissuId.toString());
    formData.append('couleurId', couleurId.toString());
    formData.append('active', active.toString());

    imageFiles.forEach((file, index) => {
      formData.append(`images`, file);
    });

    return this.http.post<TissuColor>(this.apiUrl, formData);
  }

  /**
   * Update a tissu color
   */
  update(
    id: number,
    request: TissuColor
  ): Observable<TissuColor> {
    return this.http.put<TissuColor>(`${this.apiUrl}/${id}`, request);
  }

  /**
   * Delete a tissu color
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get tissu colors by tissu ID
   */
  getByTissuId(tissuId: number): Observable<TissuColor[]> {
    return this.http.get<TissuColor[]>(`${this.apiUrl}/tissu/${tissuId}`);
  }

  /**
   * Get tissu colors by color ID
   */
  getByColorId(colorId: number): Observable<TissuColor[]> {
    return this.http.get<TissuColor[]>(`${this.apiUrl}/color/${colorId}`);
  }

  /**
   * Get active tissu colors
   */
  getActive(): Observable<TissuColor[]> {
    return this.http.get<TissuColor[]>(`${this.apiUrl}/active`);
  }
}
