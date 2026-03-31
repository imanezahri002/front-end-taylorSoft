import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Tissu } from '../../core/models/tissu.model';

@Injectable({
  providedIn: 'root',
})
export class TissuService {
  private apiUrl = `${environment.apiUrl}/tissu`;
  private readonly http = inject(HttpClient);

  getAll(): Observable<Tissu[]> {
    return this.http.get<Tissu[]>(this.apiUrl);
  }

  getById(id: number): Observable<Tissu> {
    return this.http.get<Tissu>(`${this.apiUrl}/${id}`);
  }

  create(tissu: Tissu): Observable<Tissu> {
    return this.http.post<Tissu>(this.apiUrl, tissu);
  }

  update(id: number, tissu: Tissu): Observable<Tissu> {
    return this.http.put<Tissu>(`${this.apiUrl}/${id}`, tissu);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
