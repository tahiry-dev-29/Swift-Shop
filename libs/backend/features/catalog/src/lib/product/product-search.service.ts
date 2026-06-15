import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { SearchService } from '@dima-new/backend/search';

@Injectable()
export class ProductSearchService implements OnModuleInit {
  private readonly MEILI_INDEX = 'products';
  private readonly logger = new Logger(ProductSearchService.name);

  constructor(private readonly searchService: SearchService) {}

  async onModuleInit() {
    await this.searchService.setupIndex(this.MEILI_INDEX, {
      searchableAttributes: ['name', 'reference', 'descriptionShort'],
      filterableAttributes: ['categoryId', 'active', 'price'],
      sortableAttributes: ['price', 'dateAdd'],
    });
  }

  private toSearchDocument(product: Record<string, unknown>) {
    return {
      id: product['id'],
      name: product['name'],
      reference: product['reference'],
      descriptionShort: product['descriptionShort'],
      price: product['price'],
      categoryId: product['categoryId'],
      active: product['active'],
      dateAdd: product['dateAdd'],
    };
  }

  async syncProduct(product: Record<string, unknown>) {
    try {
      await this.searchService.addDocuments(
        this.MEILI_INDEX,
        [this.toSearchDocument(product)],
        'id',
      );
    } catch (error) {
      this.logger.error('MeiliSearch sync failed', error);
    }
  }

  async deleteProduct(id: string) {
    try {
      await this.searchService.deleteDocuments(this.MEILI_INDEX, [id]);
    } catch (error) {
      this.logger.error('MeiliSearch delete failed', error);
    }
  }

  async search(query: string, options?: Record<string, unknown>) {
    return this.searchService.search(this.MEILI_INDEX, query, options);
  }
}
