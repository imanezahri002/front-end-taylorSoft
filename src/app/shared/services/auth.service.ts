import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthResponse {
  token: string;
  type: string;
  userId: number;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  statut: string;
}

@Injectable({
  providedIn: 'root'
})

export class AuthService {

private apiUrl = environment.apiUrl;

constructor(private http: HttpClient) {}

login(data: { email: string; password: string }): Observable<AuthResponse> {
  return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, data);
}
register(data: any) {
  return this.http.post(`${this.apiUrl}/auth/register`, data);
}

getUserRole(): string | null {
  return localStorage.getItem('userRole');
}

logout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('userRole');
}

}
