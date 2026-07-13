import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PermissionGuard, RequirePermission } from '@swift-shop/backend/auth';
import { CurrencyService } from '../currency.service';
import { CurrencyType, CreateCurrencyInput, UpdateCurrencyInput } from '../dto';

@Resolver(() => CurrencyType)
@UseGuards(PermissionGuard)
export class CurrencyResolver {
  constructor(private readonly currencyService: CurrencyService) {}

  @Query(() => [CurrencyType])
  @RequirePermission('manage_settings')
  async currencies() {
    return this.currencyService.findAll();
  }

  @Query(() => CurrencyType, { nullable: true })
  @RequirePermission('manage_settings')
  async currency(@Args('id', { type: () => ID }) id: string) {
    return this.currencyService.findById(id);
  }

  @Mutation(() => CurrencyType)
  @RequirePermission('manage_settings')
  async createCurrency(@Args('input') input: CreateCurrencyInput) {
    return this.currencyService.create(input);
  }

  @Mutation(() => CurrencyType)
  @RequirePermission('manage_settings')
  async updateCurrency(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateCurrencyInput,
  ) {
    return this.currencyService.update(id, input);
  }

  @Mutation(() => Boolean)
  @RequirePermission('manage_settings')
  async syncExchangeRates(
    // Normally you would pass a JSON or InputType with rates
    @Args('rates', { type: () => String, description: 'JSON string of rates' })
    ratesJson: string,
  ) {
    const rates = JSON.parse(ratesJson);
    await this.currencyService.syncExchangeRates(rates);
    return true;
  }
}
