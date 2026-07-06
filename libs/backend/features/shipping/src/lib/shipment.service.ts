import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { Prisma } from '@swift-shop/prisma-client';
import { CarrierAdapterRegistry } from './carrier-adapter.registry';

@Injectable()
export class ShipmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly carrierAdapters: CarrierAdapterRegistry,
  ) {}

  async createShipment(
    orderId: string,
    carrierId?: string,
    trackingNumber?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const carrier = carrierId
      ? await this.prisma.carrier.findUnique({ where: { id: carrierId } })
      : null;

    if (carrierId && !carrier) {
      throw new NotFoundException('Carrier not found');
    }

    return this.prisma.shipment.create({
      data: {
        orderId,
        carrierId,
        carrier: carrier?.name,
        trackingNumber,
        status: trackingNumber ? 'IN_TRANSIT' : 'CREATED',
      },
      include: { events: true },
    });
  }

  async updateShipmentStatus(
    shipmentId: string,
    status: string,
    description?: string,
    location?: string,
  ) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
    });
    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.shipmentEvent.create({
        data: { shipmentId, status, description, location },
      });

      return tx.shipment.update({
        where: { id: shipmentId },
        data: { status },
        include: { events: { orderBy: { occurredAt: 'desc' } } },
      });
    });
  }

  async syncTrackingFromCarrier(shipmentId: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { carrierRef: true },
    });
    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }
    if (!shipment.trackingNumber) {
      throw new BadRequestException('Shipment has no tracking number');
    }

    const adapter = this.carrierAdapters.get(shipment.carrierRef?.adapter);
    const snapshot = await adapter.syncTracking(shipment.trackingNumber);

    return this.prisma.$transaction(async (tx) => {
      await tx.shipmentEvent.create({
        data: {
          shipmentId,
          status: snapshot.status,
          description: snapshot.description,
          location: snapshot.location,
          occurredAt: snapshot.occurredAt,
          rawPayload: snapshot.rawPayload as Prisma.InputJsonObject | undefined,
        },
      });

      return tx.shipment.update({
        where: { id: shipmentId },
        data: { status: snapshot.status },
        include: { events: { orderBy: { occurredAt: 'desc' } } },
      });
    });
  }
}
