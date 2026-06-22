import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Meilisearch, Index } from 'meilisearch';

@Injectable()
export class SearchService implements OnModuleInit {
  private client: Meilisearch;
  private readonly logger = new Logger(SearchService.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get<string>(
      'MEILISEARCH_HOST',
      'http://localhost:7700',
    );
    const apiKey = this.configService.get<string>(
      'MEILISEARCH_API_KEY',
      'masterKey',
    );

    this.client = new Meilisearch({
      host,
      apiKey,
    });

    try {
      const health = await this.client.health();
      this.logger.log(`MeiliSearch is healthy: ${health.status}`);
    } catch (error) {
      this.logger.error('MeiliSearch connection failed', error);
    }
  }

  /**
   * Get an index by name.
   */
  getIndex<T extends Record<string, unknown>>(uid: string): Index<T> {
    return this.client.index<T>(uid);
  }

  /**
   * Add or update documents in an index.
   */
  async addDocuments<T extends Record<string, unknown>>(
    indexUid: string,
    documents: T[],
    primaryKey?: string,
  ) {
    const index = this.getIndex<T>(indexUid);
    const task = await index.addDocuments(documents, { primaryKey });
    return task;
  }

  /**
   * Delete documents from an index.
   */
  async deleteDocuments(indexUid: string, documentIds: string[] | number[]) {
    const index = this.getIndex(indexUid);
    const task = await index.deleteDocuments(documentIds);
    return task;
  }

  /**
   * Search in an index.
   */
  async search<T extends Record<string, unknown>>(
    indexUid: string,
    query: string,
    searchParams?: Record<string, unknown>,
  ) {
    const index = this.getIndex<T>(indexUid);
    return index.search(query, searchParams);
  }

  /**
   * Create index if it does not exist and update settings.
   */
  async setupIndex(indexUid: string, settings: Record<string, unknown>) {
    try {
      await this.client.createIndex(indexUid);
    } catch (e) {
      this.logger.debug(`Index may already exist: ${String(e)}`);
    }
    const index = this.getIndex(indexUid);
    await index.updateSettings(settings);
    this.logger.log(`Updated settings for index: ${indexUid}`);
  }
}
