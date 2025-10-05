import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { User, LoginRequest, RegisterRequest } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiEndpoint}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const token = sessionStorage.getItem('token');
    if (token) {
      this.getCurrentUser().subscribe();
    }
  }

  register(request: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, request);
  }

  login(request: LoginRequest): Observable<User> {
    return this.http.post<{user: User, token: string}>(`${this.apiUrl}/login`, request)
      .pipe(
        tap(response => {
          sessionStorage.setItem('token', response.token);
          this.currentUserSubject.next(response.user);
        }),
        map(response => response.user)
      );
  }

  logout(): void {
    sessionStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`)
      .pipe(
        tap(user => this.currentUserSubject.next(user))
      );
  }

  updateProfile(user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/update`, user)
      .pipe(
        tap(updatedUser => this.currentUserSubject.next(updatedUser))
      );
  }

  deleteAccount(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete`)
      .pipe(
        tap(() => this.logout())
      );
  }

  getToken(): string | null {
    return sessionStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'admin';
  }
}