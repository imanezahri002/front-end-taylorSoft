import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Page } from '../../core/models/page.model';
import { UserResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8080/api/admin/users';

  constructor(private http: HttpClient) {}

  /**
   * Get all users with pagination
   */
  getAllUsers(page: number = 0, size: number = 10): Observable<Page<UserResponse>> {
    return this.http.get<Page<UserResponse>>(`${this.apiUrl}?page=${page}&size=${size}`);
  }

  /**
   * Get user by ID
   */
  getUserById(id: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Delete user by ID
   */
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
