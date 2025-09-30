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