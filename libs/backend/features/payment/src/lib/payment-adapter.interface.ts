export interface PaymentAdapterRequest {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
}

export interface PaymentAdapterResult {
  externalId: string;
  status: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentAdapter {
  readonly provider: string;
  initiate(request: PaymentAdapterRequest): Promise<PaymentAdapterResult>;
  verify(payment: {
    id: string;
    externalId?: string | null;
  }): Promise<PaymentAdapterResult>;
  refund(request: {
    paymentId: string;
    amount: number;
    reason?: string;
  }): Promise<PaymentAdapterResult>;
}
