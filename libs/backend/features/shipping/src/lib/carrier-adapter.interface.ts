export interface TrackingSnapshot {
  status: string;
  description?: string;
  location?: string;
  occurredAt: Date;
  rawPayload?: Record<string, unknown>;
}

export interface CarrierAdapter {
  readonly code: string;
  syncTracking(trackingNumber: string): Promise<TrackingSnapshot>;
}
