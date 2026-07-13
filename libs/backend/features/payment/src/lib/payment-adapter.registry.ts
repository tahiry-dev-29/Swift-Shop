import { Injectable, BadRequestException } from '@nestjs/common';
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
      throw new BadRequestException(
        `Unsupported payment provider: ${provider}`,
      );
    }
    return adapter;
  }
}
