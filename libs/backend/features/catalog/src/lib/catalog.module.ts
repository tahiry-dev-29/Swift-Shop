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
import { ProductSearchService } from './product/product-search.service';
import { ProductBulkService } from './product/product-bulk.service';
import { StockAlertService } from './product/stock-alert.service';
import { ProductBulkController } from './product/product-bulk.controller';
import { FeatureService } from './feature/feature.service';
import { FeatureResolver } from './feature/feature.resolver';
import { CatalogDataLoader } from './catalog.dataloader';
import { SearchModule } from '@dima-new/backend/search';

@Module({
  imports: [DataAccessPrismaModule, SearchModule],
  controllers: [ProductBulkController],
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
    ProductSearchService,
    ProductBulkService,
    StockAlertService,
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
    ProductSearchService,
    ProductBulkService,
    FeatureService,
    FeatureResolver,
  ],
})
export class CatalogModule {}
