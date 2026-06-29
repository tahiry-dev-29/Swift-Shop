import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ShippingCalculationService } from './shipping-calculation.service';
import { ShipmentService } from './shipment.service';
import {
  CreateShipmentInput,
  ShipmentType,
  ShippingQuoteInput,
  ShippingRateQuoteType,
} from './dto';

@Resolver()
export class ShippingResolver {
  constructor(
    private readonly shippingCalculationService: ShippingCalculationService,
    private readonly shipmentService: ShipmentService,
  ) {}

  @Query(() => [ShippingRateQuoteType])
  async availableCarriers(@Args('input') input: ShippingQuoteInput) {
    return this.shippingCalculationService.getAvailableCarriers(
      input.countryIsoCode,
      input.weightGrams,
    );
  }

  @Mutation(() => ShipmentType)
  async createShipment(@Args('input') input: CreateShipmentInput) {
    return this.shipmentService.createShipment(
      input.orderId,
      input.carrierId,
      input.trackingNumber,
    );
  }

  @Mutation(() => ShipmentType)
  async updateShipmentStatus(
    @Args('shipmentId', { type: () => ID }) shipmentId: string,
    @Args('status') status: string,
    @Args('description', { nullable: true }) description?: string,
    @Args('location', { nullable: true }) location?: string,
  ) {
    return this.shipmentService.updateShipmentStatus(
      shipmentId,
      status,
      description,
      location,
    );
  }

  @Mutation(() => ShipmentType)
  async syncShipmentTracking(
    @Args('shipmentId', { type: () => ID }) shipmentId: string,
  ) {
    return this.shipmentService.syncTrackingFromCarrier(shipmentId);
  }
}
