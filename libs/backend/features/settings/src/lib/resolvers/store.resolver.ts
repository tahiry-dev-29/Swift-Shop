import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PermissionGuard, RequirePermission } from '@swift-shop/backend/auth';
import { StoreService } from '../store.service';
import { StoreType, CreateStoreInput, UpdateStoreInput } from '../dto';

@Resolver(() => StoreType)
@UseGuards(PermissionGuard)
export class StoreResolver {
  constructor(private readonly storeService: StoreService) {}

  @Query(() => [StoreType])
  @RequirePermission('manage_settings')
  async stores() {
    return this.storeService.findAll();
  }

  @Query(() => StoreType, { nullable: true })
  @RequirePermission('manage_settings')
  async store(@Args('id', { type: () => ID }) id: string) {
    return this.storeService.findById(id);
  }

  @Mutation(() => StoreType)
  @RequirePermission('manage_settings')
  async createStore(@Args('input') input: CreateStoreInput) {
    return this.storeService.create(input);
  }

  @Mutation(() => StoreType)
  @RequirePermission('manage_settings')
  async updateStore(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateStoreInput,
  ) {
    return this.storeService.update(id, input);
  }
}
