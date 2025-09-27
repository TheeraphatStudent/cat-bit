export interface DiscountCode {
  id?: number;
  code: string;
  discountValue: number;
  maxUsage: number;
  usedCount?: number;
  expireDate?: Date;
}