import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  currentUser: any = null;
  isAdmin = false;
  cartItemCount = 0;
  currentRoute = '';
  showProfileMenu = false;

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.url;
    });
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAdmin = user?.role === 'admin';
    });

    this.cartService.cart$.subscribe(cart => {
      this.cartItemCount = cart.items.length;
    });
  }

  navigate(route: string): void {
    this.showProfileMenu = false;
    this.router.navigate([route]);
  }

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }

  navigateHome(): void {
    this.router.navigate(['/store']);
  }

  logout(): void {
    this.showProfileMenu = false;
    this.authService.logout();
    this.router.navigate(['/store']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-menu')) {
      this.showProfileMenu = false;
    }
  }
}
