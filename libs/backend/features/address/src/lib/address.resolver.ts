import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AddressService } from './address.service';
import { CustomerGuard, EmployeeGuard, CurrentUser, AuthUser } from '@dima-new/backend/auth';
import { AddressType, CreateAddressInput, UpdateAddressInput } from './dto';

@Resolver()
export class AddressResolver {
  constructor(private readonly addressService: AddressService) {}

  @Query(() => [AddressType])
  @UseGuards(CustomerGuard)
  async myAddresses(@CurrentUser() user: AuthUser) {
    return this.addressService.findByCustomer(user.id);
  }

  @Query(() => AddressType)
  @UseGuards(CustomerGuard)
  async address(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user: AuthUser
  ) {
    const address = await this.addressService.findById(id);
    if (!address) {
      throw new NotFoundException(`Address #${id} not found`);
    }
    if (address.customerId !== user.id && user.type !== 'employee') {
      throw new ForbiddenException('Access denied');
    }
    return address;
  }

  @Query(() => [AddressType])
  @UseGuards(EmployeeGuard)
  async addresses() {
    return this.addressService.findAll();
  }

  @Mutation(() => AddressType)
  @UseGuards(CustomerGuard)
  async createAddress(
    @Args('input') input: CreateAddressInput,
    @CurrentUser() user: AuthUser
  ) {
    return this.addressService.create(user.id, input);
  }

  @Mutation(() => AddressType)
  @UseGuards(CustomerGuard)
  async updateAddress(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateAddressInput,
    @CurrentUser() user: AuthUser
  ) {
    const address = await this.addressService.findById(id);
    if (!address) {
      throw new NotFoundException(`Address #${id} not found`);
    }
    if (address.customerId !== user.id && user.type !== 'employee') {
      throw new ForbiddenException('Access denied');
    }
    return this.addressService.update(id, input);
  }

  @Mutation(() => AddressType)
  @UseGuards(CustomerGuard)
  async deleteAddress(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user: AuthUser
  ) {
    const address = await this.addressService.findById(id);
    if (!address) {
      throw new NotFoundException(`Address #${id} not found`);
    }
    if (address.customerId !== user.id && user.type !== 'employee') {
      throw new ForbiddenException('Access denied');
    }
    return this.addressService.delete(id);
  }
}
