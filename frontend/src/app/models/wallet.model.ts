export interface WalletTransaction {
  id?: number;
  userId: number;
  type: 'topup' | 'purchase';
  amount: number;
  gameId?: number;
  game?: {
    id: number;
    name: string;
    price: number;
    type: string;
    image: string;
  };
  transaction_date?: Date;
}

export interface TopupRequest {
  amount: number;
}