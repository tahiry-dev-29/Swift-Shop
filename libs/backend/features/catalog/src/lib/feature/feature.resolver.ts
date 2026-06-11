import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard, EmployeeGuard } from '@dima-new/backend/auth';
import { FeatureService } from './feature.service';
import {
  FeatureType,
  FeatureValueType,
  CreateFeatureInput,
  UpdateFeatureInput,
  CreateFeatureValueInput,
  UpdateFeatureValueInput,
} from './dto';

@Resolver(() => FeatureType)
export class FeatureResolver {
  constructor(private readonly featureService: FeatureService) {}

  @Query(() => [FeatureType])
  async features() {
    return this.featureService.findAllFeatures();
  }

  @Query(() => FeatureType, { nullable: true })
  async feature(@Args('id', { type: () => ID }) id: string) {
    return this.featureService.findFeatureById(id);
  }

  @Mutation(() => FeatureType)
  @UseGuards(JwtAuthGuard, EmployeeGuard)
  async createFeature(@Args('input') input: CreateFeatureInput) {
    return this.featureService.createFeature(input);
  }

  @Mutation(() => FeatureType)
  @UseGuards(JwtAuthGuard, EmployeeGuard)
  async updateFeature(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateFeatureInput,
  ) {
    return this.featureService.updateFeature(id, input);
  }

  @Mutation(() => FeatureType)
  @UseGuards(JwtAuthGuard, EmployeeGuard)
  async deleteFeature(@Args('id', { type: () => ID }) id: string) {
    return this.featureService.deleteFeature(id);
  }

  // Values

  @Query(() => FeatureValueType, { nullable: true })
  async featureValue(@Args('id', { type: () => ID }) id: string) {
    return this.featureService.findValueById(id);
  }

  @Mutation(() => FeatureValueType)
  @UseGuards(JwtAuthGuard, EmployeeGuard)
  async createFeatureValue(
    @Args('featureId', { type: () => ID }) featureId: string,
    @Args('input') input: CreateFeatureValueInput,
  ) {
    return this.featureService.createValue(featureId, input);
  }

  @Mutation(() => FeatureValueType)
  @UseGuards(JwtAuthGuard, EmployeeGuard)
  async updateFeatureValue(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateFeatureValueInput,
  ) {
    return this.featureService.updateValue(id, input);
  }

  @Mutation(() => FeatureValueType)
  @UseGuards(JwtAuthGuard, EmployeeGuard)
  async deleteFeatureValue(@Args('id', { type: () => ID }) id: string) {
    return this.featureService.deleteValue(id);
  }
}
