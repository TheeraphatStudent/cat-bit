import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletTransaction } from '../../models/wallet.model';
import { PriceFormat } from '../../utils/price-format';
import { DateFormat } from '../../utils/date-format';

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transaction-history.component.html',
  styleUrls: ['./transaction-history.component.css']
})
export class TransactionHistoryComponent {
  @Input() transactions: WalletTransaction[] = [];

  formatPrice(amount: number): string {
    return PriceFormat.formatCurrency(amount);
  }

  formatDateTime(date: Date | string): string {
    return DateFormat.formatDateTime(date);
  }
}