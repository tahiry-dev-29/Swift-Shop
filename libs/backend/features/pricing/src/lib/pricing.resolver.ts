import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard, SuperAdminGuard } from '@dima-new/backend/auth';
import { PriceCalculationService } from './price-calculation.service';
import { PrismaService } from '@dima-new/data-access-prisma';
import {
  PriceDetailType,
  SpecificPriceType,
  CreateSpecificPriceInput,
  UpdateSpecificPriceInput,
} from './dto';

@Resolver()
export class PricingResolver {
  constructor(
    private priceCalculationService: PriceCalculationService,
    private prisma: PrismaService,
  ) {}

  @Query(() => PriceDetailType)
  async calculatePrice(
    @Args('productId', { type: () => ID }) productId: string,
    @Args('countryId', { type: () => ID }) countryId: string,
    @Args('combinationId', { type: () => ID, nullable: true })
    combinationId?: string,
    @Args('customerId', { type: () => ID, nullable: true }) customerId?: string,
    @Args('quantity', { type: () => Int, nullable: true, defaultValue: 1 })
    quantity?: number,
    @Args('currencyCode', { type: () => String, nullable: true })
    currencyCode?: string,
    @Args('cartRuleCodes', { type: () => [String], nullable: true })
    cartRuleCodes?: string[],
  ) {
    return this.priceCalculationService.calculatePrice({
      productId,
      countryId,
      combinationId,
      customerId,
      quantity,
      currencyCode,
      cartRuleCodes,
    });
  }

  @Query(() => [SpecificPriceType])
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async specificPrices(
    @Args('productId', { type: () => ID, nullable: true }) productId?: string,
    @Args('customerId', { type: () => ID, nullable: true }) customerId?: string,
  ) {
    const where: Record<string, unknown> = { active: true };
    if (productId) where.productId = productId;
    if (customerId) where.customerId = customerId;

    return this.prisma.specificPrice.findMany({
      where,
      orderBy: { priority: 'desc' },
    });
  }

  @Mutation(() => SpecificPriceType)
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async createSpecificPrice(@Args('input') input: CreateSpecificPriceInput) {
    return this.prisma.specificPrice.create({
      data: input,
    });
  }

  @Mutation(() => SpecificPriceType)
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async updateSpecificPrice(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateSpecificPriceInput,
  ) {
    return this.prisma.specificPrice.update({
      where: { id },
      data: input,
    });
  }

  @Mutation(() => SpecificPriceType)
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async deleteSpecificPrice(@Args('id', { type: () => ID }) id: string) {
    return this.prisma.specificPrice.delete({
      where: { id },
    });
  }
}
