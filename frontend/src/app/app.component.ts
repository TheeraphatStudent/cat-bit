import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CartService } from './services/cart.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="app-container">
      <!-- Navigation Header -->
      <nav class="navbar" *ngIf="showNavbar">
        <div class="nav-content">
          <div class="nav-brand">
            <h1 class="brand-title" (click)="navigateHome()">GameShop</h1>
          </div>

          <div class="nav-links">
            <a (click)="navigate('/store')" 
               [class.active]="currentRoute === '/store'"
               class="nav-link">Store</a>
            
            <ng-container *ngIf="currentUser">
              <a (click)="navigate('/library')" 
                 [class.active]="currentRoute === '/library'"
                 class="nav-link">Library</a>
              
              <a (click)="navigate('/cart')" 
                 [class.active]="currentRoute === '/cart'"
                 class="nav-link cart-link">
                Cart
                <span class="cart-badge" *ngIf="cartItemCount > 0">{{cartItemCount}}</span>
              </a>
              
              <a (click)="navigate('/profile')" 
                 [class.active]="currentRoute === '/profile'"
                 class="nav-link">Profile</a>
              
              <a (click)="navigate('/admin-dashboard')" 
                 [class.active]="currentRoute === '/admin-dashboard'"
                 class="nav-link"
                 *ngIf="isAdmin">Admin</a>
              
              <button (click)="logout()" class="nav-btn logout-btn">Logout</button>
            </ng-container>
            
            <ng-container *ngIf="!currentUser">
              <a (click)="navigate('/login')" 
                 [class.active]="currentRoute === '/login'"
                 class="nav-link">Login</a>
              <a (click)="navigate('/register')" 
                 [class.active]="currentRoute === '/register'"
                 class="nav-btn signup-btn">Sign Up</a>
            </ng-container>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="main-content" [class.with-navbar]="showNavbar">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background: var(--color-background);
    }

    .navbar {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--color-border);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .nav-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 20px;
      height: 70px;
    }

    .nav-brand {
      cursor: pointer;
    }

    .brand-title {
      margin: 0;
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      background: var(--gradient-primary-135);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .nav-link {
      color: var(--color-text-secondary);
      text-decoration: none;
      font-weight: var(--font-weight-medium);
      transition: all var(--transition-base);
      cursor: pointer;
      position: relative;
    }

    .nav-link:hover, .nav-link.active {
      color: var(--color-primary-2);
    }

    .nav-link.active::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--gradient-primary-135);
      border-radius: 1px;
    }

    .cart-link {
      position: relative;
    }

    .cart-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: var(--gradient-primary-135);
      color: white;
      border-radius: var(--radius-full);
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
    }

    .nav-btn {
      padding: var(--space-sm) var(--space-md);
      border: none;
      border-radius: var(--radius-sm);
      font-weight: var(--font-weight-semibold);
      cursor: pointer;
      transition: all var(--transition-base);
      text-decoration: none;
      font-size: var(--font-size-sm);
    }

    .signup-btn {
      background: var(--gradient-primary-135);
      color: white;
    }

    .signup-btn:hover {
      background: var(--gradient-primary);
      transform: translateY(-1px);
    }

    .logout-btn {
      background: var(--color-border);
      color: var(--color-text-secondary);
    }

    .logout-btn:hover {
      background: var(--color-border-hover);
    }

    .main-content {
      min-height: 100vh;
    }

    .main-content.with-navbar {
      min-height: calc(100vh - 70px);
    }

    @media (max-width: 768px) {
      .nav-content {
        padding: 0 16px;
        height: 60px;
      }

      .brand-title {
        font-size: var(--font-size-2xl);
      }

      .nav-links {
        gap: var(--space-md);
      }

      .nav-link {
        font-size: var(--font-size-sm);
      }

      .nav-btn {
        padding: var(--space-xs) var(--space-sm);
        font-size: var(--font-size-xs);
      }
    }
  `]
})
export class AppComponent implements OnInit {
  currentUser: any = null;
  isAdmin = false;
  cartItemCount = 0;
  currentRoute = '';
  showNavbar = true;

  private noNavbarRoutes = ['/login', '/register'];

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {
    // Listen to route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.url;
      this.showNavbar = !this.noNavbarRoutes.includes(event.url);
    });
  }

  ngOnInit(): void {
    // Subscribe to current user changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAdmin = user?.role === 'admin';
    });

    // Subscribe to cart changes
    this.cartService.cart$.subscribe(cart => {
      this.cartItemCount = cart.items.length;
    });
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }

  navigateHome(): void {
    this.router.navigate(['/store']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/store']);
  }
}