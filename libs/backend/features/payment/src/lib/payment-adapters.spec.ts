import { describe, it, expect } from 'vitest';
import { LocalPaymentAdapter } from './local-payment-adapter';

describe('Payment Provider Adapters (Stripe, MVola, Airtel, COD, Manual)', () => {
  it('should handle Stripe adapter initiate, verify, and refund flows', async () => {
    const stripeAdapter = new LocalPaymentAdapter('stripe');
    expect(stripeAdapter.provider).toBe('stripe');

    const initResult = await stripeAdapter.initiate({
      paymentId: 'pay-1',
      orderId: 'ord-1',
      amount: 100,
    });
    expect(initResult.externalId).toContain('stripe_pay-1');
    expect(initResult.status).toBe('PENDING');

    const verifyResult = await stripeAdapter.verify({
      id: 'pay-1',
      externalId: 'pi_123',
    });
    expect(verifyResult.externalId).toBe('pi_123');
    expect(verifyResult.status).toBe('AUTHORIZED');

    const refundResult = await stripeAdapter.refund();
    expect(refundResult.status).toBe('SUCCEEDED');
  });

  it('should handle MVola adapter initiate and status verification', async () => {
    const mvolaAdapter = new LocalPaymentAdapter('mvola');
    const initResult = await mvolaAdapter.initiate({
      paymentId: 'pay-2',
      orderId: 'ord-2',
      amount: 50,
    });
    expect(initResult.externalId).toContain('mvola_pay-2');
    expect(initResult.status).toBe('PENDING');

    const verifyResult = await mvolaAdapter.verify({
      id: 'pay-2',
      externalId: 'trans_mvola_123',
    });
    expect(verifyResult.status).toBe('AUTHORIZED');
  });

  it('should handle Airtel Money adapter initiate and status verification', async () => {
    const airtelAdapter = new LocalPaymentAdapter('airtelmoney');
    const initResult = await airtelAdapter.initiate({
      paymentId: 'pay-3',
      orderId: 'ord-3',
      amount: 75,
    });
    expect(initResult.externalId).toContain('airtelmoney_pay-3');
    expect(initResult.status).toBe('PENDING');

    const verifyResult = await airtelAdapter.verify({
      id: 'pay-3',
      externalId: 'trans_airtel_456',
    });
    expect(verifyResult.status).toBe('AUTHORIZED');
  });
});
