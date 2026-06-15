import {
  Resolver,
  Query,
  Mutation,
  Subscription,
  Args,
  ID,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CustomerGuard, CurrentUser } from '@dima-new/backend/auth';
import { OrderService } from './order-service';
import { OrderCreationService } from './order-creation.service';
import { OrderActionService } from './order-action.service';
import {
  OrderType,
  CreateOrderInput,
  OrderStateType,
  ReturnType,
  RequestReturnInput,
  OrderNoteType,
} from './dto/order-types';

interface CurrentUserType {
  id: string;
}

@Resolver(() => OrderType)
export class OrderResolver {
  constructor(
    private readonly orderService: OrderService,
    private readonly orderCreationService: OrderCreationService,
    private readonly orderActionService: OrderActionService,
  ) {}

  @Query(() => [OrderType])
  @UseGuards(CustomerGuard)
  async myOrders(@CurrentUser() user: CurrentUserType) {
    return this.orderService.getMyOrders(user.id);
  }

  @Query(() => OrderType)
  @UseGuards(CustomerGuard)
  async order(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.orderService.getOrder(id, user.id);
  }

  @Query(() => [OrderStateType])
  async orderStates() {
    return this.orderService.getOrderStates();
  }

  @Mutation(() => OrderType)
  @UseGuards(CustomerGuard)
  async createOrder(
    @CurrentUser() user: CurrentUserType,
    @Args('input') input: CreateOrderInput,
  ) {
    return this.orderCreationService.createOrderFromCart(
      input.cartId,
      user.id,
      input.deliveryAddressId,
      input.billingAddressId,
    );
  }

  @Mutation(() => OrderType)
  @UseGuards(CustomerGuard)
  async cancelOrder(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    const order = await this.orderService.getOrder(id, user.id);
    return this.orderActionService.cancelOrder(order.id, user.id);
  }

  @Mutation(() => ReturnType)
  @UseGuards(CustomerGuard)
  async requestReturn(
    @CurrentUser() user: CurrentUserType,
    @Args('input') input: RequestReturnInput,
  ) {
    const order = await this.orderService.getOrder(input.orderId, user.id);
    return this.orderActionService.requestReturn(
      order.id,
      input.items,
      input.customerNotes,
    );
  }

  @Mutation(() => OrderNoteType)
  @UseGuards(CustomerGuard)
  async addOrderNote(
    @Args('orderId', { type: () => ID }) orderId: string,
    @Args('note') note: string,
    @Args('isInternal', { defaultValue: false }) isInternal: boolean,
    @CurrentUser() user: CurrentUserType,
  ) {
    const order = await this.orderService.getOrder(orderId, user.id);
    return this.orderService.addOrderNote(
      order.id,
      note,
      isInternal,
      undefined,
      user.id,
    );
  }

  @Subscription(() => OrderType, {
    filter: (payload, variables) =>
      payload.orderStatusChanged.id === variables.orderId,
  })
  orderStatusChanged(@Args('orderId', { type: () => ID }) orderId: string) {
    void orderId; // Fix unused variable
    // In a real app, this would use a PubSub instance.
    // e.g., return pubSub.asyncIterableIterator('orderStatusChanged');
    return (async function* () {
      yield null;
    })();
  }
}
