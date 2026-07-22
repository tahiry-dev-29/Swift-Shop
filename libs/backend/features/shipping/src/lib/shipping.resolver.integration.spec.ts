import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { ShippingResolver } from './shipping.resolver';
import { ShippingCalculationService } from './shipping-calculation.service';
import { ShipmentService } from './shipment.service';

describe('ShippingResolver (Integration)', () => {
  let resolver: ShippingResolver;
  let calcService: Mocked<ShippingCalculationService>;
  let shipmentService: Mocked<ShipmentService>;

  const mockShipment = {
    id: 'ship-1',
    orderId: 'ord-1',
    carrierId: 'carr-1',
    trackingNumber: 'TRACK123',
    status: 'SHIPPED',
    events: [],
  };

  beforeEach(() => {
    calcService = {
      getAvailableCarriers: vi.fn(),
      calculateShippingCost: vi.fn(),
    } as any;

    shipmentService = {
      createShipment: vi.fn(),
      updateShipmentStatus: vi.fn(),
      syncTrackingFromCarrier: vi.fn(),
    } as any;

    resolver = new ShippingResolver(calcService, shipmentService);
  });

  describe('availableCarriers query', () => {
    it('should return available carriers for given address country and weight', async () => {
      const quotes = [{ carrierId: 'carr-1', name: 'DHL', cost: 15 }];
      calcService.getAvailableCarriers.mockResolvedValue(quotes as any);

      const res = await resolver.availableCarriers({
        countryIsoCode: 'MG',
        weightGrams: 500,
      });
      expect(calcService.getAvailableCarriers).toHaveBeenCalledWith('MG', 500);
      expect(res).toEqual(quotes);
    });
  });

  describe('createShipment & updateShipmentStatus mutations', () => {
    it('should create shipment with tracking number', async () => {
      shipmentService.createShipment.mockResolvedValue(mockShipment as any);

      const res = await resolver.createShipment({
        orderId: 'ord-1',
        carrierId: 'carr-1',
        trackingNumber: 'TRACK123',
      });
      expect(shipmentService.createShipment).toHaveBeenCalledWith(
        'ord-1',
        'carr-1',
        'TRACK123',
      );
      expect(res).toEqual(mockShipment);
    });

    it('should update shipment status and log event', async () => {
      shipmentService.updateShipmentStatus.mockResolvedValue({
        ...mockShipment,
        status: 'DELIVERED',
      } as any);

      const res = await resolver.updateShipmentStatus(
        'ship-1',
        'DELIVERED',
        'Package delivered',
        'Antananarivo',
      );
      expect(shipmentService.updateShipmentStatus).toHaveBeenCalledWith(
        'ship-1',
        'DELIVERED',
        'Package delivered',
        'Antananarivo',
      );
      expect(res.status).toBe('DELIVERED');
    });

    it('should sync shipment tracking from carrier adapter', async () => {
      shipmentService.syncTrackingFromCarrier.mockResolvedValue(
        mockShipment as any,
      );

      const res = await resolver.syncShipmentTracking('ship-1');
      expect(shipmentService.syncTrackingFromCarrier).toHaveBeenCalledWith(
        'ship-1',
      );
      expect(res).toEqual(mockShipment);
    });
  });
});
