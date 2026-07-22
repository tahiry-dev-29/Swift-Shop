import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { ShipmentService } from './shipment.service';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { CarrierAdapterRegistry } from './carrier-adapter.registry';
import { BadRequestException, NotFoundException } from '@nestjs/common';

function makePrisma(): Mocked<PrismaService> {
  return {
    order: { findUnique: vi.fn() },
    carrier: { findUnique: vi.fn() },
    shipment: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    shipmentEvent: { create: vi.fn() },
    $transaction: vi.fn(),
  } as unknown as Mocked<PrismaService>;
}

function makeRegistry(): Mocked<CarrierAdapterRegistry> {
  return {
    get: vi.fn(),
  } as unknown as Mocked<CarrierAdapterRegistry>;
}

describe('ShipmentService', () => {
  let service: ShipmentService;
  let prisma: Mocked<PrismaService>;
  let registry: Mocked<CarrierAdapterRegistry>;

  beforeEach(() => {
    prisma = makePrisma();
    registry = makeRegistry();
    service = new ShipmentService(prisma, registry);
  });

  // ─── createShipment ───────────────────────────────────────────────────────

  describe('createShipment', () => {
    it('should throw NotFoundException when order not found', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.createShipment('missing-order')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when carrierId provided but carrier not found', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'o1' } as never);
      prisma.carrier.findUnique.mockResolvedValue(null);

      await expect(service.createShipment('o1', 'bad-carrier')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should create shipment with status CREATED when no tracking number', async () => {
      const shipment = { id: 'ship1', status: 'CREATED', events: [] } as never;
      prisma.order.findUnique.mockResolvedValue({ id: 'o1' } as never);
      prisma.carrier.findUnique.mockResolvedValue({
        id: 'c1',
        name: 'Colissimo',
      } as never);
      prisma.shipment.create.mockResolvedValue(shipment);

      const result = await service.createShipment('o1', 'c1');
      expect(prisma.shipment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'CREATED' }),
        }),
      );
      expect(result).toBe(shipment);
    });

    it('should create shipment with status IN_TRANSIT when tracking number provided', async () => {
      const shipment = {
        id: 'ship1',
        status: 'IN_TRANSIT',
        trackingNumber: 'TK123',
        events: [],
      } as never;
      prisma.order.findUnique.mockResolvedValue({ id: 'o1' } as never);
      prisma.carrier.findUnique.mockResolvedValue({
        id: 'c1',
        name: 'DHL',
      } as never);
      prisma.shipment.create.mockResolvedValue(shipment);

      const result = await service.createShipment('o1', 'c1', 'TK123');
      expect(prisma.shipment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            trackingNumber: 'TK123',
            status: 'IN_TRANSIT',
          }),
        }),
      );
      expect(result).toBe(shipment);
    });

    it('should create shipment without carrier when no carrierId given', async () => {
      const shipment = { id: 'ship1', carrierId: null, events: [] } as never;
      prisma.order.findUnique.mockResolvedValue({ id: 'o1' } as never);
      prisma.shipment.create.mockResolvedValue(shipment);

      const result = await service.createShipment('o1');
      expect(prisma.carrier.findUnique).not.toHaveBeenCalled();
      expect(result).toBe(shipment);
    });
  });

  // ─── updateShipmentStatus ─────────────────────────────────────────────────

  describe('updateShipmentStatus', () => {
    it('should throw NotFoundException when shipment not found', async () => {
      prisma.shipment.findUnique.mockResolvedValue(null);
      await expect(
        service.updateShipmentStatus('missing', 'DELIVERED'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create event and update shipment status', async () => {
      prisma.shipment.findUnique.mockResolvedValue({ id: 'ship1' } as never);
      const updated = { id: 'ship1', status: 'DELIVERED', events: [] } as never;

      prisma.$transaction.mockImplementation(
        async (cb: (tx: unknown) => unknown) => {
          const tx = {
            shipmentEvent: { create: vi.fn() },
            shipment: { update: vi.fn().mockResolvedValue(updated) },
          };
          return cb(tx);
        },
      );

      const result = await service.updateShipmentStatus(
        'ship1',
        'DELIVERED',
        'Package delivered',
      );
      expect(result).toBe(updated);
    });
  });

  // ─── syncTrackingFromCarrier ──────────────────────────────────────────────

  describe('syncTrackingFromCarrier', () => {
    it('should throw NotFoundException when shipment not found', async () => {
      prisma.shipment.findUnique.mockResolvedValue(null);
      await expect(service.syncTrackingFromCarrier('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when shipment has no tracking number', async () => {
      prisma.shipment.findUnique.mockResolvedValue({
        id: 'ship1',
        trackingNumber: null,
        carrierRef: null,
      } as never);
      await expect(service.syncTrackingFromCarrier('ship1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should sync tracking and create event from adapter snapshot', async () => {
      const snapshot = {
        status: 'IN_TRANSIT',
        description: 'In transit',
        location: 'Paris',
        occurredAt: new Date(),
        rawPayload: {},
      };
      const mockAdapter = { syncTracking: vi.fn().mockResolvedValue(snapshot) };
      registry.get.mockReturnValue(mockAdapter as never);

      prisma.shipment.findUnique.mockResolvedValue({
        id: 'ship1',
        trackingNumber: 'TK123',
        carrierRef: { adapter: 'colissimo' },
      } as never);

      const updatedShipment = {
        id: 'ship1',
        status: 'IN_TRANSIT',
        events: [],
      } as never;
      prisma.$transaction.mockImplementation(
        async (cb: (tx: unknown) => unknown) => {
          const tx = {
            shipmentEvent: { create: vi.fn() },
            shipment: { update: vi.fn().mockResolvedValue(updatedShipment) },
          };
          return cb(tx);
        },
      );

      const result = await service.syncTrackingFromCarrier('ship1');
      expect(mockAdapter.syncTracking).toHaveBeenCalledWith('TK123');
      expect(result).toBe(updatedShipment);
    });
  });
});

// ─── CarrierAdapterRegistry ───────────────────────────────────────────────

describe('CarrierAdapterRegistry', () => {
  let registry: CarrierAdapterRegistry;

  beforeEach(() => {
    registry = new CarrierAdapterRegistry();
  });

  it('should return adapter for known carrier code "dhl"', () => {
    const adapter = registry.get('dhl');
    expect(adapter).toBeDefined();
  });

  it('should return adapter for known carrier code "colissimo"', () => {
    const adapter = registry.get('colissimo');
    expect(adapter).toBeDefined();
  });

  it('should return fallback manual adapter for unknown code', () => {
    const adapter = registry.get('UNKNOWN_CARRIER');
    expect(adapter).toBeDefined();
  });

  it('should return fallback manual adapter when code is undefined', () => {
    const adapter = registry.get(undefined);
    expect(adapter).toBeDefined();
  });

  it('should return fallback manual adapter when code is null', () => {
    const adapter = registry.get(null);
    expect(adapter).toBeDefined();
  });
});
