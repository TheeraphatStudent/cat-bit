import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DiscountCode } from '../models/discount.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DiscountService {
  private apiUrl = `${environment.apiEndpoint}/discount`;

  constructor(private http: HttpClient) {}

  validateCode(code: string): Observable<{ valid: boolean, discount: number }> {
    return this.http.post<{ valid: boolean, discount: number }>(`${this.apiUrl}/validate`, { code });
  }

  getDiscountCodes(): Observable<DiscountCode[]> {
    return this.http.get<DiscountCode[]>(`${this.apiUrl}`);
  }

  createDiscountCode(discount: Partial<DiscountCode>): Observable<DiscountCode> {
    return this.http.post<DiscountCode>(`${this.apiUrl}`, discount);
  }

  updateDiscountCode(id: number, discount: Partial<DiscountCode>): Observable<DiscountCode> {
    return this.http.put<DiscountCode>(`${this.apiUrl}/${id}`, discount);
  }

  deleteDiscountCode(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}