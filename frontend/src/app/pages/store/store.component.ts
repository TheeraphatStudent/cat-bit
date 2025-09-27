import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameCardComponent } from '../../components/game-card/game-card.component';
import { GameDetailComponent } from '../../components/game-detail/game-detail.component';
import { GameService } from '../../services/game.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { Game, GameFilter } from '../../models/game.model';

@Component({
  selector: 'app-store',
  standalone: true,
  imports: [CommonModule, FormsModule, GameCardComponent, GameDetailComponent],
  template: `
    <div class="store-container">
      <div class="store-header">
        <h1 class="store-title">GameShop Store</h1>
        <p class="store-subtitle">Discover and purchase amazing games</p>
      </div>

      <div class="filters-section">
        <div class="search-filter">
          <input type="text" 
                 [(ngModel)]="filter.name" 
                 (ngModelChange)="onFilterChange()"
                 placeholder="Search games..."
                 class="search-input">
        </div>
        
        <div class="type-filter">
          <select [(ngModel)]="filter.type" 
                  (ngModelChange)="onFilterChange()"
                  class="filter-select">
            <option value="">All Types</option>
            <option value="Action">Action</option>
            <option value="Adventure">Adventure</option>
            <option value="RPG">RPG</option>
            <option value="Strategy">Strategy</option>
            <option value="Sports">Sports</option>
            <option value="Racing">Racing</option>
            <option value="Puzzle">Puzzle</option>
            <option value="Simulation">Simulation</option>
          </select>
        </div>

        <div class="price-filter">
          <label>Price Range:</label>
          <div class="price-inputs">
            <input type="number" 
                   [(ngModel)]="filter.minPrice" 
                   (ngModelChange)="onFilterChange()"
                   placeholder="Min"
                   class="price-input">
            <span>-</span>
            <input type="number" 
                   [(ngModel)]="filter.maxPrice" 
                   (ngModelChange)="onFilterChange()"
                   placeholder="Max"
                   class="price-input">
          </div>
        </div>
      </div>

      <div class="games-grid" *ngIf="!selectedGame && !loading">
        <app-game-card 
          *ngFor="let game of games" 
          [game]="game"
          [inCart]="isInCart(game.id!)"
          [owned]="isOwned(game.id!)"
          (cardClick)="selectGame(game)"
          (addToCart)="addToCart(game)">
        </app-game-card>
      </div>

      <div class="loading" *ngIf="loading">
        <div class="loading-spinner"></div>
        <p>Loading games...</p>
      </div>

      <div class="no-games" *ngIf="!loading && games.length === 0">
        <p>No games found matching your criteria.</p>
      </div>

      <div class="game-detail-overlay" *ngIf="selectedGame" (click)="closeGameDetail()">
        <div class="game-detail-container" (click)="$event.stopPropagation()">
          <app-game-detail 
            [game]="selectedGame"
            [inCart]="isInCart(selectedGame.id!)"
            [owned]="isOwned(selectedGame.id!)"
            (addToCart)="addToCart($event)"
            (close)="closeGameDetail()">
          </app-game-detail>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .store-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--space-lg);
    }

    .store-header {
      text-align: center;
      margin-bottom: var(--space-xl);
    }

    .store-title {
      margin: 0 0 var(--space-sm) 0;
      font-size: var(--font-size-4xl);
      font-weight: var(--font-weight-bold);
      background: var(--gradient-primary-135);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .store-subtitle {
      margin: 0;
      color: var(--color-text-secondary);
      font-size: var(--font-size-lg);
    }

    .filters-section {
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: var(--space-md);
      margin-bottom: var(--space-xl);
      padding: var(--space-lg);
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
    }

    .search-input, .filter-select, .price-input {
      padding: var(--space-sm) var(--space-md);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--font-size-base);
      transition: all var(--transition-base);
    }

    .search-input:focus, .filter-select:focus, .price-input:focus {
      outline: none;
      border-color: var(--color-primary-2);
      box-shadow: 0 0 0 3px rgba(249, 195, 62, 0.1);
    }

    .price-filter {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .price-filter label {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }

    .price-inputs {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
    }

    .price-input {
      width: 80px;
      padding: var(--space-sm) var(--space-sm);
      font-size: var(--font-size-sm);
    }

    .games-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: var(--space-lg);
    }

    .loading {
      text-align: center;
      padding: var(--space-2xl);
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--color-border);
      border-left: 4px solid var(--color-primary-2);
      border-radius: var(--radius-full);
      animation: spin 1s linear infinite;
      margin: 0 auto var(--space-md);
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .no-games {
      text-align: center;
      padding: var(--space-2xl);
      color: var(--color-text-secondary);
      font-size: var(--font-size-lg);
    }

    .game-detail-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-lg);
    }

    .game-detail-container {
      max-width: 90vw;
      max-height: 90vh;
      overflow-y: auto;
    }

    @media (max-width: 768px) {
      .filters-section {
        grid-template-columns: 1fr;
      }
      
      .games-grid {
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;
      }
      
      .store-title {
        font-size: var(--font-size-3xl);
      }
    }
  `]
})
export class StoreComponent implements OnInit {
  games: Game[] = [];
  selectedGame: Game | null = null;
  loading = false;
  filter: GameFilter = {};
  cartItems: number[] = [];
  ownedGames: number[] = [];

  constructor(
    private gameService: GameService,
    private cartService: CartService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadGames();
    this.loadCartItems();
    this.loadOwnedGames();
  }

  loadGames(): void {
    this.loading = true;
    this.gameService.getGames(this.filter).subscribe({
      next: (games) => {
        this.games = games.map((game, index) => ({
          ...game,
          rank: index + 1
        }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadCartItems(): void {
    if (this.authService.isAuthenticated()) {
      this.cartService.getCart().subscribe({
        next: (cart) => {
          this.cartItems = cart.items.map(item => item.game.id!);
        }
      });
    }
  }

  loadOwnedGames(): void {
    if (this.authService.isAuthenticated()) {
      this.gameService.getUserLibrary().subscribe({
        next: (ownedGames) => {
          this.ownedGames = ownedGames.map(game => game.id!);
        }
      });
    }
  }

  onFilterChange(): void {
    this.loadGames();
  }

  selectGame(game: Game): void {
    this.selectedGame = game;
  }

  closeGameDetail(): void {
    this.selectedGame = null;
  }

  addToCart(game: Game): void {
    if (this.authService.isAuthenticated() && game.id) {
      this.cartService.addToCart(game.id).subscribe({
        next: () => {
          this.loadCartItems();
        }
      });
    }
  }

  isInCart(gameId: number): boolean {
    return this.cartItems.includes(gameId);
  }

  isOwned(gameId: number): boolean {
    return this.ownedGames.includes(gameId);
  }
}