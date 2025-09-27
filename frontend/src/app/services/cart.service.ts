import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Cart, CartItem, CheckoutRequest } from '../models/cart.model';
import { Game } from '../models/game.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = `${environment.apiEndpoint}/cart`;
  private cartSubject = new BehaviorSubject<Cart>({ items: [], total: 0 });
  public cart$ = this.cartSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCart();
  }

  private loadCart(): void {
    this.getCart().subscribe(cart => this.cartSubject.next(cart));
  }

  getCart(): Observable<Cart> {
    return this.http.get<Cart>(`${this.apiUrl}`);
  }

  addToCart(gameId: number): Observable<Cart> {
    return this.http.post<Cart>(`${this.apiUrl}/add`, { gameId })
      .pipe(tap(cart => this.cartSubject.next(cart)));
  }

  removeFromCart(gameId: number): Observable<Cart> {
    return this.http.delete<Cart>(`${this.apiUrl}/remove/${gameId}`)
      .pipe(tap(cart => this.cartSubject.next(cart)));
  }

  applyDiscountCode(code: string): Observable<Cart> {
    return this.http.post<Cart>(`${this.apiUrl}/discount`, { code })
      .pipe(tap(cart => this.cartSubject.next(cart)));
  }

  checkout(request: CheckoutRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/checkout`, request)
      .pipe(tap(() => this.loadCart()));
  }

  clearCart(): Observable<Cart> {
    return this.http.delete<Cart>(`${this.apiUrl}/clear`)
      .pipe(tap(cart => this.cartSubject.next(cart)));
  }
}