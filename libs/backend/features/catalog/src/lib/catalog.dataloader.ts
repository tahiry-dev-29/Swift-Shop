import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { CategoryType } from './category/dto';
import { ProductCombinationAttributeType } from './product/dto';

@Injectable({ scope: Scope.REQUEST })
export class CatalogDataLoader {
  constructor(private readonly prisma: PrismaService) {}

  public readonly categoryChildrenLoader = new DataLoader<
    string,
    CategoryType[]
  >(async (parentIds) => {
    const categories = await this.prisma.category.findMany({
      where: { parentId: { in: parentIds as string[] }, deletedAt: null },
      orderBy: { position: 'asc' },
    });

    const grouped = new Map<string, CategoryType[]>();
    parentIds.forEach((id) => grouped.set(id, []));

    categories.forEach((cat) => {
      if (cat.parentId) {
        grouped.get(cat.parentId)?.push(cat as unknown as CategoryType);
      }
    });

    return parentIds.map((id) => grouped.get(id) || []);
  });

  public readonly combinationAttributesLoader = new DataLoader<
    string,
    ProductCombinationAttributeType[]
  >(async (combinationIds) => {
    const attributes = await this.prisma.productCombinationAttribute.findMany({
      where: { combinationId: { in: combinationIds as string[] } },
    });

    const grouped = new Map<string, ProductCombinationAttributeType[]>();
    combinationIds.forEach((id) => grouped.set(id, []));

    attributes.forEach((attr) => {
      grouped
        .get(attr.combinationId)
        ?.push(attr as unknown as ProductCombinationAttributeType);
    });

    return combinationIds.map((id) => grouped.get(id) || []);
  });
}
