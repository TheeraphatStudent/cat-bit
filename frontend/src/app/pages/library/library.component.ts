import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameService } from '../../services/game.service';
import { Game, LibraryGame } from '../../models/game.model';
import { PriceFormat } from '../../utils/price-format';
import { DateFormat } from '../../utils/date-format';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.css']
})
export class LibraryComponent implements OnInit {
  games: LibraryGame[] = [];
  selectedGame: Game | null = null;
  loading = false;

  constructor(
    private gameService: GameService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadLibrary();
  }

  loadLibrary(): void {
    this.loading = true;
    this.gameService.getUserLibrary().subscribe({
      next: (games) => {
        this.games = games as LibraryGame[];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  showGameDetails(game: Game): void {
    this.selectedGame = game;
  }

  closeGameDetail(): void {
    this.selectedGame = null;
  }

  navigateToStore(): void {
    this.router.navigate(['/store']);
  }

  formatPrice(price: number): string {
    return PriceFormat.formatCurrency(price);
  }

  formatDate(date: Date | string): string {
    return DateFormat.formatDate(date);
  }

  truncateText(text: string | undefined, maxLength: number): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
}