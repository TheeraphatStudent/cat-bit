export interface Game {
  id?: number;
  name: string;
  price: number;
  type: string;
  image?: string;
  description?: string;
  releaseDate?: Date;
  salesCount?: number;
  rank?: number;
  purchaseDate?: Date;
  isPurchased?: boolean;
}

export interface LibraryGame extends Game {
  purchaseDate: Date;
}

export interface GameFilter {
  name?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
}
