export interface StockAlertRow {
  id: string;
  quantity: number;
  minQuantity: number;
  productName: string | null;
  productRef: string | null;
  combinationRef: string | null;
  combinationProductName: string | null;
}
