import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard, SuperAdminGuard } from '@swift-shop/backend/auth';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { CountryType, CreateCountryInput, UpdateCountryInput } from './dto';

@Resolver(() => CountryType)
export class CountryResolver {
  constructor(private prisma: PrismaService) {}

  @Query(() => [CountryType])
  async countries() {
    return this.prisma.country.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  @Query(() => CountryType)
  async country(@Args('id', { type: () => ID }) id: string) {
    return this.prisma.country.findUnique({
      where: { id },
    });
  }

  @Mutation(() => CountryType)
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async createCountry(@Args('input') input: CreateCountryInput) {
    return this.prisma.country.create({
      data: input,
    });
  }

  @Mutation(() => CountryType)
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async updateCountry(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateCountryInput,
  ) {
    return this.prisma.country.update({
      where: { id },
      data: input,
    });
  }

  @Mutation(() => CountryType)
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async deleteCountry(@Args('id', { type: () => ID }) id: string) {
    return this.prisma.country.delete({
      where: { id },
    });
  }
}
