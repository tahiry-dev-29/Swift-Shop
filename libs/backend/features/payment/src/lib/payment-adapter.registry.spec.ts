import { describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PaymentAdapterRegistry } from './payment-adapter.registry';

describe('PaymentAdapterRegistry', () => {
  let registry: PaymentAdapterRegistry;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentAdapterRegistry],
    }).compile();

    registry = module.get<PaymentAdapterRegistry>(PaymentAdapterRegistry);
  });

  it('should be defined', () => {
    expect(registry).toBeDefined();
  });

  it('should return registered payment adapters for supported providers', () => {
    const providers = [
      'mvola',
      'airtelmoney',
      'stripe',
      'paypal',
      'cod',
      'manual',
    ];
    for (const provider of providers) {
      const adapter = registry.get(provider);
      expect(adapter).toBeDefined();
      expect(adapter.provider).toBe(provider);
    }
  });

  it('should handle case-insensitivity when looking up providers', () => {
    const adapterUpper = registry.get('MVOLA');
    const adapterMixed = registry.get('StRiPe');

    expect(adapterUpper.provider).toBe('mvola');
    expect(adapterMixed.provider).toBe('stripe');
  });

  it('should throw BadRequestException for unsupported providers', () => {
    expect(() => registry.get('unsupported_provider')).toThrow(
      BadRequestException,
    );
    expect(() => registry.get('unsupported_provider')).toThrow(
      'Unsupported payment provider: unsupported_provider',
    );
  });
});
