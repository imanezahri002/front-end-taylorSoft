import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Color } from '../../core/models/color.model';

@Injectable({
  providedIn: 'root',
})
export class ColorService {
  private apiUrl = `${environment.apiUrl}/couleur`;
  private readonly http = inject(HttpClient);

  /**
   * Get all colors
   */
  getAll(): Observable<Color[]> {
    return this.http.get<Color[]>(this.apiUrl);
  }

  /**
   * Get color by ID
   */
  getById(id: number): Observable<Color> {
    return this.http.get<Color>(`${this.apiUrl}/${id}`);
  }

  /**
   * Update color by ID
   */
  update(id: number, color: Color): Observable<Color> {
    return this.http.put<Color>(`${this.apiUrl}/${id}`, color);
  }

  /**
   * Create a new color
   */
  create(color: Color): Observable<Color> {
    return this.http.post<Color>(this.apiUrl, color);
  }

  /**
   * Delete color by ID
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
