import {
  PaymentAdapter,
  PaymentAdapterRequest,
  PaymentAdapterResult,
} from './payment-adapter.interface';

export class LocalPaymentAdapter implements PaymentAdapter {
  constructor(readonly provider: string) {}

  async initiate(
    request: PaymentAdapterRequest,
  ): Promise<PaymentAdapterResult> {
    return {
      externalId: `${this.provider}_${request.paymentId}`,
      status:
        this.provider === 'cod' || this.provider === 'manual'
          ? 'AUTHORIZED'
          : 'PENDING',
      metadata: { orderId: request.orderId, amount: request.amount },
    };
  }

  async verify(payment: {
    id: string;
    externalId?: string | null;
  }): Promise<PaymentAdapterResult> {
    return {
      externalId: payment.externalId ?? `${this.provider}_${payment.id}`,
      status: 'AUTHORIZED',
    };
  }

  async refund(): Promise<PaymentAdapterResult> {
    return {
      externalId: `${this.provider}_refund_${Date.now()}`,
      status: 'SUCCEEDED',
    };
  }
}
