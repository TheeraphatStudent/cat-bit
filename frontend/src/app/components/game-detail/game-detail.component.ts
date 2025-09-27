import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Game } from '../../models/game.model';
import { PriceFormat } from '../../utils/price-format';
import { DateFormat } from '../../utils/date-format';

@Component({
  selector: 'app-game-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-detail.component.html',
  styleUrls: ['./game-detail.component.css']
})
export class GameDetailComponent {
  @Input() game!: Game;
  @Input() inCart: boolean = false;
  @Input() owned: boolean = false;
  @Output() addToCart = new EventEmitter<Game>();
  @Output() close = new EventEmitter<void>();

  formatPrice(price: number): string {
    return PriceFormat.formatCurrency(price);
  }

  formatDate(date: Date | string): string {
    return DateFormat.formatDate(date);
  }

  formatNumber(num: number): string {
    return PriceFormat.formatNumber(num);
  }

  onAddToCart(): void {
    this.addToCart.emit(this.game);
  }

  onClose(): void {
    this.close.emit();
  }
}