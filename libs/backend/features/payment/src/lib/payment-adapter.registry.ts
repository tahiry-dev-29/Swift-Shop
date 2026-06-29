import { Injectable } from '@nestjs/common';
import { PaymentAdapter } from './payment-adapter.interface';
import { LocalPaymentAdapter } from './local-payment-adapter';

@Injectable()
export class PaymentAdapterRegistry {
  private readonly adapters = new Map<string, PaymentAdapter>(
    ['mvola', 'airtelmoney', 'stripe', 'paypal', 'cod', 'manual'].map(
      (provider) => [provider, new LocalPaymentAdapter(provider)],
    ),
  );

  get(provider: string): PaymentAdapter {
    const adapter = this.adapters.get(provider.toLowerCase());
    if (!adapter) {
      const manual = this.adapters.get('manual');
      if (!manual) {
        throw new Error('Manual payment adapter not found in registry');
      }
      return manual;
    }
    return adapter;
  }
}
