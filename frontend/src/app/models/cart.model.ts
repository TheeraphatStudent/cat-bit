import { Game } from './game.model';

export interface CartItem {
  game: Game;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  discountCode?: string;
  discountAmount?: number;
}

export interface CheckoutRequest {
  gameIds: number[];
  discountCode?: string;
}