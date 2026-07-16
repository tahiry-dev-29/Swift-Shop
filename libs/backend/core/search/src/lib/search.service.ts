import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Meilisearch, Index } from 'meilisearch';

@Injectable()
export class SearchService implements OnModuleInit {
  private client: Meilisearch | undefined;
  private available = false;
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
      this.available = true;
      this.logger.log(`MeiliSearch is healthy: ${health.status}`);
    } catch {
      this.logger.warn(
        'MeiliSearch not available — search features are disabled',
      );
    }
  }

  getIndex<T extends Record<string, unknown>>(uid: string): Index<T> {
    if (!this.client) throw new Error('Meilisearch client not initialized');
    return this.client.index<T>(uid);
  }

  async addDocuments<T extends Record<string, unknown>>(
    indexUid: string,
    documents: T[],
    primaryKey?: string,
  ) {
    if (!this.available) return;
    const index = this.getIndex<T>(indexUid);
    const task = await index.addDocuments(documents, { primaryKey });
    return task;
  }

  async deleteDocuments(indexUid: string, documentIds: string[] | number[]) {
    if (!this.available) return;
    const index = this.getIndex(indexUid);
    const task = await index.deleteDocuments(documentIds);
    return task;
  }

  async search<T extends Record<string, unknown>>(
    indexUid: string,
    query: string,
    searchParams?: Record<string, unknown>,
  ) {
    if (!this.available) return null;
    const index = this.getIndex<T>(indexUid);
    return index.search(query, searchParams);
  }

  async setupIndex(indexUid: string, settings: Record<string, unknown>) {
    if (!this.available) return;
    if (!this.client) throw new Error('Meilisearch client not initialized');
    try {
      await this.client.createIndex(indexUid);
    } catch {
      this.logger.debug(`Index may already exist: ${indexUid}`);
    }
    try {
      const index = this.getIndex(indexUid);
      await index.updateSettings(settings);
      this.logger.log(`Updated settings for index: ${indexUid}`);
    } catch (error) {
      this.logger.warn(
        `Failed to update settings for ${indexUid}: ${String(error)}`,
      );
    }
  }
}
