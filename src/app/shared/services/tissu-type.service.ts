import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TissuType } from '../../core/models/tissuType.model';

@Injectable({
  providedIn: 'root',
})
export class TissuTypeService {
  private apiUrl = `${environment.apiUrl}/type-tissu`;
  private readonly http = inject(HttpClient);

  /**
   * Get all tissu types
   */
  getAll(): Observable<TissuType[]> {
    return this.http.get<TissuType[]>(this.apiUrl);
  }

  /**
   * Get tissu type by ID
   */
  getById(id: number): Observable<TissuType> {
    return this.http.get<TissuType>(`${this.apiUrl}/${id}`);
  }

  /**
   * Update tissu type by ID
   */
  update(id: number, tissuType: TissuType): Observable<TissuType> {
    return this.http.put<TissuType>(`${this.apiUrl}/${id}`, tissuType);
  }

  /**
   * Create a new tissu type
   */
  create(tissuType: TissuType): Observable<TissuType> {
    return this.http.post<TissuType>(this.apiUrl, tissuType);
  }

  /**
   * Delete tissu type by ID
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
