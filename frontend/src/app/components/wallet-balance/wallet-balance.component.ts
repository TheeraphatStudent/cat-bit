import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PriceFormat } from '../../utils/price-format';

@Component({
  selector: 'app-wallet-balance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wallet-balance.component.html',
  styleUrls: ['./wallet-balance.component.css']
})
export class WalletBalanceComponent {
  @Input() balance: number = 0;
  @Input() loading: boolean = false;
  @Output() topUp = new EventEmitter<number>();

  presetAmounts = [100, 200, 500];
  selectedAmount: number | null = null;
  customAmount: number | null = null;

  selectAmount(amount: number): void {
    this.selectedAmount = amount;
    this.customAmount = null;
  }

  onCustomAmountChange(amount: number): void {
    this.customAmount = amount;
    this.selectedAmount = amount;
  }

  onTopUp(): void {
    if (this.selectedAmount && this.selectedAmount > 0) {
      this.topUp.emit(this.selectedAmount);
    }
  }

  formatPrice(amount: number): string {
    return PriceFormat.formatCurrency(amount);
  }
}