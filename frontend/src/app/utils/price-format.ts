export class PriceFormat {
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  static formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(num);
  }

  static calculateDiscount(price: number, discountPercent: number): number {
    return price * (discountPercent / 100);
  }

  static applyDiscount(price: number, discountPercent: number): number {
    return price - this.calculateDiscount(price, discountPercent);
  }
}