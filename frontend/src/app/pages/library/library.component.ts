import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DateFormat } from '../../utils/date-format';
import { environment } from '../../../environments/environment';

interface Coupon {
  id: number;
  code: string;
  discount_value: number;
  max_usage: number;
  used_count: number;
  expire_date: string | null;
}

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.css']
})
export class LibraryComponent implements OnInit {
  coupons: Coupon[] = [];
  loading = false;
  copiedCode: string | null = null;
  showToast = false;
  private apiUrl = `${environment.apiEndpoint}/discount`;

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCoupons();
  }

  loadCoupons(): void {
    this.loading = true;
    this.http.get<Coupon[]>(`${this.apiUrl}`).subscribe({
      next: (coupons) => {
        this.coupons = coupons;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  copyCouponCode(code: string, inputElement: HTMLInputElement): void {
    inputElement.select();
    navigator.clipboard.writeText(code).then(() => {
      this.copiedCode = code;
      this.showToast = true;

      setTimeout(() => {
        this.copiedCode = null;
      }, 2000);

      setTimeout(() => {
        this.showToast = false;
      }, 3000);
    });
  }

  isExpired(expireDate: string | null): boolean {
    if (!expireDate) return false;
    return new Date(expireDate) < new Date();
  }

  navigateToStore(): void {
    this.router.navigate(['/store']);
  }

  formatDate(date: Date | string): string {
    return DateFormat.formatDate(date);
  }
}