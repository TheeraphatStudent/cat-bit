import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { GameService } from '../../services/game.service';
import { Game } from '../../models/game.model';
import { PriceFormat } from '../../utils/price-format';

@Component({
  selector: 'app-purchase-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './purchase-success.component.html',
  styleUrls: ['./purchase-success.component.css']
})
export class PurchaseSuccessComponent implements OnInit {
  purchasedGames: Game[] = [];
  totalAmount: number = 0;
  discountApplied: number = 0;
  loading = true;
  confettiActive = true;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private gameService: GameService
  ) {}

  ngOnInit(): void {
    // Get purchase details from query params
    this.route.queryParams.subscribe(params => {
      const gameIds = params['gameIds'] ? params['gameIds'].split(',').map((id: string) => parseInt(id)) : [];
      this.totalAmount = parseFloat(params['total']) || 0;
      this.discountApplied = parseFloat(params['discount']) || 0;

      if (gameIds.length > 0) {
        this.loadPurchasedGames(gameIds);
      } else {
        this.loading = false;
      }
    });

    // Stop confetti after 5 seconds
    setTimeout(() => {
      this.confettiActive = false;
    }, 5000);
  }

  loadPurchasedGames(gameIds: number[]): void {
    // Load each game's details
    const gameRequests = gameIds.map(id => 
      this.gameService.getGame(id).toPromise()
    );

    Promise.all(gameRequests).then(games => {
      this.purchasedGames = games.filter((g: Game | undefined): g is Game => g !== undefined);
      this.loading = false;
    }).catch(() => {
      this.loading = false;
    });
  }

  formatPrice(price: number): string {
    return PriceFormat.formatCurrency(price);
  }

  navigateToLibrary(): void {
    this.router.navigate(['/library']);
  }

  navigateToStore(): void {
    this.router.navigate(['/store']);
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }
}
