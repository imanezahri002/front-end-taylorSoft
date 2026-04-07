import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Mesure } from '../../core/models/mesure.model';

@Injectable({
  providedIn: 'root',
})
export class MesureService {
  private apiUrl = `${environment.apiUrl}/mesures`;

  constructor(private http: HttpClient) {}

  /**
   * Get all mesures
   */
  getAll(): Observable<Mesure[]> {
    return this.http.get<Mesure[]>(this.apiUrl);
  }

  /**
   * Get mesure by ID
   */
  getById(id: number): Observable<Mesure> {
    return this.http.get<Mesure>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get mesure by client ID
   */
  getByClientId(clientId: number): Observable<Mesure> {
    return this.http.get<Mesure>(`${this.apiUrl}/client/${clientId}`);
  }

  /**
   * Create a new mesure
   */
  create(mesure: Mesure): Observable<Mesure> {
    return this.http.post<Mesure>(this.apiUrl, mesure);
  }

  /**
   * Update mesure by ID
   */
  update(id: number, mesure: Mesure): Observable<Mesure> {
    return this.http.put<Mesure>(`${this.apiUrl}/${id}`, mesure);
  }

  /**
   * Delete mesure by ID
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
