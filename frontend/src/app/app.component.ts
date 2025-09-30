import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CartService } from './services/cart.service';
import { SoundService } from './services/sound.service';
import { filter } from 'rxjs/operators';
import { PixelGrid } from './components/pixel-grid/pixel-grid';
import { ParticleDirective } from './interceptors/partical/partical';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, PixelGrid],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
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
    private router: Router,
    private soundService: SoundService
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    this.soundService.playClick();
    this.soundService.enableBackgroundMusic();
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Backspace' || event.key === 'Delete') {
      this.soundService.playDelete();
      this.soundService.enableBackgroundMusic();
    }
    
    else if (/^[a-zA-Z0-9]$|^(Space|Enter|Tab)$/.test(event.key)) {
      this.soundService.playTyping();
      this.soundService.enableBackgroundMusic();
    }
  }
}