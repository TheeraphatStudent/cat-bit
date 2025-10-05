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
  templateUrl: './store.component.html',
  styleUrls: ['./store.component.css']
})
export class StoreComponent implements OnInit {
  games: Game[] = [];
  visibleGames: Game[] = [];
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
        this.games = games;
        this.updateVisibleGames();
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
          this.updateVisibleGames();
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
    if (!this.authService.isAuthenticated()) {
      console.error('User not authenticated');
      return;
    }

    if (!game.id || isNaN(game.id)) {
      console.error('Invalid game ID:', game.id);
      return;
    }

    console.log('Adding game to cart:', game.id);
    this.cartService.addToCart(game.id).subscribe({
      next: (cart) => {
        console.log('Game added to cart successfully', cart);
        this.loadCartItems();
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        if (error?.error?.message === 'You already own this game') {
          this.loadOwnedGames();
        }
      }
    });
  }

  isInCart(gameId: number): boolean {
    return this.cartItems.includes(gameId);
  }

  isOwned(gameId: number): boolean {
    return this.ownedGames.includes(gameId);
  }

  private updateVisibleGames(): void {
    const filtered = this.games.filter(game => !(game.id && this.isOwned(game.id)));
    this.visibleGames = filtered.map((game, index) => ({
      ...game,
      rank: index + 1
    }));

    if (this.selectedGame?.id && this.isOwned(this.selectedGame.id)) {
      this.closeGameDetail();
    }
  }
}
