import { Injectable } from '@nestjs/common';
import { CarrierAdapter } from './carrier-adapter.interface';
import { ManualCarrierAdapter } from './manual-carrier-adapter';

@Injectable()
export class CarrierAdapterRegistry {
  private readonly adapters = new Map<string, CarrierAdapter>(
    ['manual', 'colissimo', 'dhl', 'fedex', 'local_mg'].map((code) => [
      code,
      new ManualCarrierAdapter(code),
    ]),
  );

  get(adapterCode?: string | null): CarrierAdapter {
    const adapter = this.adapters.get(adapterCode ?? 'manual');
    if (adapter) {
      return adapter;
    }
    const fallback = this.adapters.get('manual');
    if (!fallback) {
      throw new Error('Manual carrier adapter not found in registry');
    }
    return fallback;
  }
}
