export interface WalletTransaction {
  id?: number;
  userId: number;
  type: 'topup' | 'purchase';
  amount: number;
  transactionDate?: Date;
}

export interface TopupRequest {
  amount: number;
}