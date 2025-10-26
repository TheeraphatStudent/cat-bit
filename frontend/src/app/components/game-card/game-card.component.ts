import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Game } from '../../models/game.model';
import { PriceFormat } from '../../utils/price-format';
import { DateFormat } from '../../utils/date-format';
import { AuthService } from '../../services/auth.service';

/*
{
        "id": 3,
        "name": "Call of Duty: Modern Warfare",
        "price": "49.99",
        "type": "Action",
        "description": "The stakes have never been higher as players take on the role of lethal Tier One operators.",
        "image": "https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg",
        "releaseDate": "2025-10-12T22:40:01.938Z",
        "salesCount": 23458,
        "rank": "2",
        "isPurchased": false
    },
*/

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-card.component.html',
  styleUrls: ['./game-card.component.css']
})
export class GameCardComponent {
  @Input() game!: Game;
  @Input() inCart: boolean = false;
  @Input() owned: boolean = false;
  @Output() cardClick = new EventEmitter<Game>();
  @Output() addToCart = new EventEmitter<Game>();

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  formatPrice(price: number): string {
    return PriceFormat.formatCurrency(price);
  }

  formatDate(date: Date | string): string {
    return DateFormat.formatDate(date);
  }

  formatNumber(num: number): string {
    return PriceFormat.formatNumber(num);
  }

  truncateText(text: string | undefined, maxLength: number): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  onCardClick(): void {
    if (this.game.isPurchased || this.owned) {
      this.router.navigate(['/your-games']);
      return;
    }
    this.cardClick.emit(this.game);
  }

  onAddToCart(event: Event): void {
    event.stopPropagation();

    if (!this.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.addToCart.emit(this.game);
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }
}