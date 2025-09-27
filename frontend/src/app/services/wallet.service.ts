import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WalletTransaction, TopupRequest } from '../models/wallet.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private apiUrl = `${environment.apiEndpoint}/wallet`;

  constructor(private http: HttpClient) {}

  getBalance(): Observable<{ balance: number }> {
    return this.http.get<{ balance: number }>(`${this.apiUrl}/balance`);
  }

  topUp(request: TopupRequest): Observable<{ balance: number }> {
    return this.http.post<{ balance: number }>(`${this.apiUrl}/topup`, request);
  }

  getTransactions(): Observable<WalletTransaction[]> {
    return this.http.get<WalletTransaction[]>(`${this.apiUrl}/transactions`);
  }
}