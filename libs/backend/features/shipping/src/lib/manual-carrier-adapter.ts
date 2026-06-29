import { CarrierAdapter, TrackingSnapshot } from './carrier-adapter.interface';

export class ManualCarrierAdapter implements CarrierAdapter {
  constructor(readonly code: string) {}

  async syncTracking(trackingNumber: string): Promise<TrackingSnapshot> {
    return {
      status: 'IN_TRANSIT',
      description: `Tracking ${trackingNumber} accepted by ${this.code}`,
      occurredAt: new Date(),
      rawPayload: { trackingNumber, adapter: this.code },
    };
  }
}
