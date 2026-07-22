import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { PaymentResolver } from './payment.resolver';
import { PaymentService } from './payment.service';

describe('PaymentResolver (Integration)', () => {
  let resolver: PaymentResolver;
  let paymentService: Mocked<PaymentService>;

  const mockPayment = {
    id: 'pay-1',
    orderId: 'ord-1',
    provider: 'cod',
    amount: 100,
    status: 'AUTHORIZED',
  };

  beforeEach(() => {
    paymentService = {
      initiatePayment: vi.fn(),
      verifyPayment: vi.fn(),
      processRefund: vi.fn(),
      processWebhook: vi.fn(),
    } as any;

    resolver = new PaymentResolver(paymentService);
  });

  describe('initiatePayment mutation', () => {
    it('should initiate payment instantly for COD / Manual or return pending state for gateways', async () => {
      paymentService.initiatePayment.mockResolvedValue(mockPayment as any);

      const input = {
        orderId: 'ord-1',
        provider: 'cod',
        amount: 100,
        currency: 'USD',
      };
      const res = await resolver.initiatePayment(input as any);

      expect(paymentService.initiatePayment).toHaveBeenCalledWith(
        'ord-1',
        'cod',
        100,
        'USD',
        undefined,
      );
      expect(res).toEqual(mockPayment);
    });
  });

  describe('verifyPayment mutation', () => {
    it('should verify payment status with gateway', async () => {
      paymentService.verifyPayment.mockResolvedValue({
        ...mockPayment,
        status: 'COMPLETED',
      } as any);

      const res = await resolver.verifyPayment('pay-1');
      expect(paymentService.verifyPayment).toHaveBeenCalledWith('pay-1');
      expect(res.status).toBe('COMPLETED');
    });
  });

  describe('processRefund mutation', () => {
    it('should record refund linked to payment', async () => {
      const mockRefund = {
        id: 'ref-1',
        paymentId: 'pay-1',
        amount: 50,
        status: 'SUCCEEDED',
      };
      paymentService.processRefund.mockResolvedValue(mockRefund as any);

      const input = {
        paymentId: 'pay-1',
        amount: 50,
        reason: 'Customer return',
      };
      const res = await resolver.processRefund(input as any);

      expect(paymentService.processRefund).toHaveBeenCalledWith(
        'pay-1',
        50,
        'Customer return',
      );
      expect(res).toEqual(mockRefund);
    });
  });
});
