import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { CatalogDataLoader } from '../catalog.dataloader';
import { ProductCombinationType, ProductCombinationAttributeType } from './dto';

@Resolver(() => ProductCombinationType)
export class ProductCombinationResolver {
  constructor(private readonly dataloader: CatalogDataLoader) {}

  @ResolveField(() => [ProductCombinationAttributeType])
  async attributes(@Parent() combination: ProductCombinationType) {
    return this.dataloader.combinationAttributesLoader.load(combination.id);
  }
}
