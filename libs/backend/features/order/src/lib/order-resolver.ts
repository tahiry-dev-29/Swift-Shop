import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CustomerGuard, CurrentUser } from '@dima-new/backend/auth';
import { OrderService } from './order-service';
import { OrderType, CreateOrderInput, OrderStateType } from './dto/order-types';

interface CurrentUserType {
  id: string;
}

@Resolver(() => OrderType)
export class OrderResolver {
  constructor(private readonly orderService: OrderService) {}

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
    return this.orderService.createOrderFromCart(
      input.cartId,
      user.id,
      input.deliveryAddressId,
      input.billingAddressId,
    );
  }
}
