import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartItemComponent } from '../../components/cart-item/cart-item.component';
import { CartService } from '../../services/cart.service';
import { WalletService } from '../../services/wallet.service';
import { AuthService } from '../../services/auth.service';
import { Cart, CartItem } from '../../models/cart.model';
import { PriceFormat } from '../../utils/price-format';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, CartItemComponent],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cart: Cart = { items: [], total: 0 };
  walletBalance = 0;
  discountCode = '';
  discountMessage = '';
  applyingDiscount = false;
  checkingOut = false;

  constructor(
    private cartService: CartService,
    private walletService: WalletService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCart();
    this.loadWalletBalance();
  }

  loadCart(): void {
    this.cartService.getCart().subscribe({
      next: (cart) => {
        this.cart = cart;
      }
    });
  }

  loadWalletBalance(): void {
    this.walletService.getBalance().subscribe({
      next: (response) => {
        this.walletBalance = response.balance;
      }
    });
  }

  get subtotal(): number {
    return this.cart.items.reduce((sum, item) => sum + item.game.price, 0);
  }

  removeFromCart(item: CartItem): void {
    if (item.game.id) {
      this.cartService.removeFromCart(item.game.id).subscribe({
        next: (cart) => {
          this.cart = cart;
        }
      });
    }
  }

  applyDiscount(): void {
    if (!this.discountCode.trim()) return;

    this.applyingDiscount = true;
    this.cartService.applyDiscountCode(this.discountCode).subscribe({
      next: (cart) => {
        this.cart = cart;
        this.discountMessage = 'Discount applied successfully!';
        this.applyingDiscount = false;
      },
      error: (error) => {
        this.discountMessage = error.error?.message || 'Invalid discount code';
        this.applyingDiscount = false;
      }
    });
  }

  checkout(): void {
    if (this.walletBalance < this.cart.total) return;

    this.checkingOut = true;
    const gameIds = this.cart.items.map(item => item.game.id!);
    const totalAmount = this.cart.total;
    const discountAmount = this.cart.discountAmount || 0;
    
    this.cartService.checkout({
      gameIds,
      discountCode: this.cart.discountCode
    }).subscribe({
      next: () => {
        this.checkingOut = false;
        // Navigate to success page with purchase details
        this.router.navigate(['/purchase-success'], {
          queryParams: {
            gameIds: gameIds.join(','),
            total: totalAmount,
            discount: discountAmount
          }
        });
      },
      error: (error) => {
        this.checkingOut = false;
        console.error('Checkout error:', error);
      }
    });
  }

  clearCart(): void {
    this.cartService.clearCart().subscribe({
      next: (cart) => {
        this.cart = cart;
        this.discountCode = '';
        this.discountMessage = '';
      }
    });
  }

  navigateToStore(): void {
    this.router.navigate(['/store']);
  }

  formatPrice(price: number): string {
    return PriceFormat.formatCurrency(price);
  }
}