import { Module } from '@nestjs/common';
import { DataAccessPrismaModule } from '@dima-new/data-access-prisma';
import { CategoryService } from './category/category.service';
import { CategoryResolver } from './category/category.resolver';
import { AttributeService } from './attribute/attribute.service';
import { AttributeResolver } from './attribute/attribute.resolver';

@Module({
  imports: [DataAccessPrismaModule],
  providers: [
    CategoryService, 
    CategoryResolver,
    AttributeService,
    AttributeResolver
  ],
  exports: [
    CategoryService, 
    CategoryResolver,
    AttributeService,
    AttributeResolver
  ],
})
export class CatalogModule {}
