import { describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { CarrierAdapterRegistry } from './carrier-adapter.registry';

describe('CarrierAdapterRegistry', () => {
  let registry: CarrierAdapterRegistry;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CarrierAdapterRegistry],
    }).compile();

    registry = module.get<CarrierAdapterRegistry>(CarrierAdapterRegistry);
  });

  it('should be defined', () => {
    expect(registry).toBeDefined();
  });

  it('should return manual adapter by default when null or undefined is passed', () => {
    const adapterNull = registry.get(null);
    const adapterUndefined = registry.get(undefined);

    expect(adapterNull).toBeDefined();
    expect(adapterUndefined).toBeDefined();
    expect(adapterNull.code).toBe('manual');
  });

  it('should return registered adapters for valid codes', () => {
    const codes = ['manual', 'colissimo', 'dhl', 'fedex', 'local_mg'];
    for (const code of codes) {
      const adapter = registry.get(code);
      expect(adapter).toBeDefined();
      expect(adapter.code).toBe(code);
    }
  });

  it('should fallback to manual adapter when an unknown code is provided', () => {
    const adapter = registry.get('unknown_carrier');
    expect(adapter).toBeDefined();
    expect(adapter.code).toBe('manual');
  });
});
