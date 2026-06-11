import { Module } from '@nestjs/common';
import { DataAccessPrismaModule } from '@dima-new/data-access-prisma';
import { CategoryService } from './category/category.service';
import { CategoryResolver } from './category/category.resolver';
import { AttributeService } from './attribute/attribute.service';
import { AttributeResolver } from './attribute/attribute.resolver';
import { ProductService } from './product/product.service';
import { ProductCombinationService } from './product/product-combination.service';
import { ProductImageService } from './product/product-image.service';
import { ProductResolver } from './product/product.resolver';
import { ProductCombinationResolver } from './product/product-combination.resolver';
import { ProductStockService } from './product/product-stock.service';
import { FeatureService } from './feature/feature.service';
import { FeatureResolver } from './feature/feature.resolver';
import { CatalogDataLoader } from './catalog.dataloader';

@Module({
  imports: [DataAccessPrismaModule],
  providers: [
    CatalogDataLoader,
    CategoryService,
    CategoryResolver,
    AttributeService,
    AttributeResolver,
    ProductService,
    ProductCombinationService,
    ProductImageService,
    ProductResolver,
    ProductCombinationResolver,
    ProductStockService,
    FeatureService,
    FeatureResolver,
  ],
  exports: [
    CatalogDataLoader,
    CategoryService,
    CategoryResolver,
    AttributeService,
    AttributeResolver,
    ProductService,
    ProductCombinationService,
    ProductImageService,
    ProductResolver,
    ProductCombinationResolver,
    ProductStockService,
    FeatureService,
    FeatureResolver,
  ],
})
export class CatalogModule {}
