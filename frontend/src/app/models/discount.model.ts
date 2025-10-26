export interface DiscountCode {
  id?: number;
  code: string;
  discount_value: number;
  max_usage: number;
  used_count?: number;
  expire_date?: Date;
}