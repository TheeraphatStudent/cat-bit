import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameService } from '../../services/game.service';
import { SkeletonCardComponent } from '../../components/skeleton-card/skeleton-card.component';
import { Game } from '../../models/game.model';
import { PriceFormat } from '../../utils/price-format';
import { DateFormat } from '../../utils/date-format';

interface RawGame extends Game {
  purchase_date?: Date | string;
  release_date?: Date | string;
  sales_count?: number;
}

@Component({
  selector: 'app-your-games',
  standalone: true,
  imports: [CommonModule, SkeletonCardComponent],
  templateUrl: './your-games.component.html',
  styleUrls: ['./your-games.component.css']
})
export class YourGamesComponent implements OnInit {
  ownedGames: Game[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private gameService: GameService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOwnedGames();
  }

  loadOwnedGames(): void {
    this.loading = true;
    this.error = null;

    this.gameService.getUserLibrary().subscribe({
      next: (games) => {
        this.ownedGames = games.map(game => this.normalizeGame(game));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'We could not load your games right now. Please try again.';
      }
    });
  }

  formatPrice(price: number): string {
    return PriceFormat.formatCurrency(price);
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) {
      return 'Unknown';
    }
    return DateFormat.formatDate(date);
  }

  trackByGameId(_: number, game: Game): number | undefined {
    return game.id;
  }

  browseStore(): void {
    this.router.navigate(['/store']);
  }

  private normalizeGame(game: RawGame): Game {
    const purchaseDate = game.purchaseDate ?? game.purchase_date;
    const releaseDate = game.releaseDate ?? game.release_date;
    const salesCount = game.salesCount ?? game.sales_count;

    return {
      ...game,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      releaseDate: releaseDate ? new Date(releaseDate) : undefined,
      salesCount: salesCount ?? 0
    };
  }
}
