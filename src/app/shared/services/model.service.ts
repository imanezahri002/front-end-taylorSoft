import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Model, ModelRequest } from '../../core/models/model.model';

@Injectable({
  providedIn: 'root',
})
export class ModelService {
  private apiUrl = `${environment.apiUrl}/models`;
  private readonly http = inject(HttpClient);

  /**
   * Create a new model with colors and photos
   * @param request ModelRequest containing model data
   * @param files List of image files
   * @returns Observable<Model>
   */
  create(request: ModelRequest, files: File[]): Observable<Model> {
    const formData = new FormData();

    // Add JSON data as string
    formData.append('data', JSON.stringify(request));

    // Add all files
    files.forEach((file) => {
      formData.append('files', file);
    });

    return this.http.post<Model>(this.apiUrl, formData);
  }

  /**
   * Get all models
   * @returns Observable<Model[]>
   */
  getAll(): Observable<Model[]> {
    return this.http.get<Model[]>(this.apiUrl);
  }

  /**
   * Get model by ID
   * @param id Model ID
   * @returns Observable<Model>
   */
  getById(id: number): Observable<Model> {
    return this.http.get<Model>(`${this.apiUrl}/${id}`);
  }

  /**
   * Delete a model
   * @param id Model ID
   * @returns Observable<void>
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get models by tissu ID
   * @param tissuId Tissu ID
   * @returns Observable<Model[]>
   */
  getByTissuId(tissuId: number): Observable<Model[]> {
    return this.http.get<Model[]>(`${this.apiUrl}/tissu/${tissuId}`);
  }

  /**
   * Get models by couturier ID
   * @param couturierId Couturier ID
   * @returns Observable<Model[]>
   */
  getByCouturierId(couturierId: number): Observable<Model[]> {
    return this.http.get<Model[]>(`${this.apiUrl}/couturier/${couturierId}`);
  }

  /**
   * Get only active models
   * @returns Observable<Model[]>
   */
  getActiveOnly(): Observable<Model[]> {
    return this.http.get<Model[]>(`${this.apiUrl}/active`);
  }
}
