export interface User {
  id?: number;
  username: string;
  email: string;
  password?: string;
  role: 'user' | 'admin';
  profileImage?: string;
  wallet_balance?: number;
  created_at?: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  profileImage?: string;
}
