import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Game } from '../../models/game.model';
import { PriceFormat } from '../../utils/price-format';
import { DateFormat } from '../../utils/date-format';

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
    this.cardClick.emit(this.game);
  }

  onAddToCart(event: Event): void {
    event.stopPropagation();
    this.addToCart.emit(this.game);
  }
}