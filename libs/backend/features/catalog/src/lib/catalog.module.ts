import { Module } from '@nestjs/common';
import { DataAccessPrismaModule } from '@dima-new/data-access-prisma';
import { CategoryService } from './category/category.service';
import { CategoryResolver } from './category/category.resolver';
import { AttributeService } from './attribute/attribute.service';
import { AttributeResolver } from './attribute/attribute.resolver';
import { ProductService } from './product/product.service';
import { ProductResolver } from './product/product.resolver';
import { FeatureService } from './feature/feature.service';
import { FeatureResolver } from './feature/feature.resolver';

@Module({
  imports: [DataAccessPrismaModule],
  providers: [
    CategoryService, 
    CategoryResolver,
    AttributeService,
    AttributeResolver,
    ProductService,
    ProductResolver,
    FeatureService,
    FeatureResolver,
  ],
  exports: [
    CategoryService, 
    CategoryResolver,
    AttributeService,
    AttributeResolver,
    ProductService,
    ProductResolver,
    FeatureService,
    FeatureResolver,
  ],
})
export class CatalogModule {}

