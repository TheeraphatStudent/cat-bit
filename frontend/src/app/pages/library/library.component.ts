import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SkeletonCardComponent } from '../../components/skeleton-card/skeleton-card.component';
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
  imports: [CommonModule, SkeletonCardComponent],
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.css']
})
export class LibraryComponent implements OnInit {
  coupons: Coupon[] = [];
  loading = false;
  copiedCode: string | null = null;
  showToast = false;
  errorMessage = '';
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
    this.errorMessage = '';
    // Use /available endpoint for regular users to see available coupons
    this.http.get<Coupon[]>(`${this.apiUrl}/available`).subscribe({
      next: (coupons) => {
        this.coupons = coupons;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Failed to load coupons';
        console.error('Load coupons error:', error);
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