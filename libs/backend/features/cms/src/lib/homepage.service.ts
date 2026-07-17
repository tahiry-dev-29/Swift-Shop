import { Injectable, NotFoundException } from '@nestjs/common';
import { HomepageRepository } from './homepage.repository';
import { HomepageFormatter } from './homepage.formatter';
import {
  CreateHomepageBlockInput,
  UpdateHomepageBlockInput,
  ReorderHomepageBlocksInput,
  HomepageBlockType,
} from './dto';

@Injectable()
export class HomepageService {
  constructor(
    private readonly repository: HomepageRepository,
    private readonly formatter: HomepageFormatter,
  ) {}

  async createBlock(
    input: CreateHomepageBlockInput,
  ): Promise<HomepageBlockType> {
    const created = await this.repository.create({
      title: input.title,
      type: input.type,
      content: input.content ?? undefined,
      position: input.position ?? 0,
      active: input.active ?? true,
    });

    return this.formatter.toHomepageBlockType(created);
  }

  async getBlock(id: string): Promise<HomepageBlockType> {
    const block = await this.repository.findById(id);
    if (!block) {
      throw new NotFoundException(`Homepage Block with ID '${id}' not found`);
    }
    return this.formatter.toHomepageBlockType(block);
  }

  async listBlocks(options?: {
    activeOnly?: boolean;
  }): Promise<HomepageBlockType[]> {
    const blocks = await this.repository.findMany(options);
    return blocks.map((block) => this.formatter.toHomepageBlockType(block));
  }

  async updateBlock(
    id: string,
    input: UpdateHomepageBlockInput,
  ): Promise<HomepageBlockType> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Homepage Block with ID '${id}' not found`);
    }

    const updated = await this.repository.update(id, {
      title: input.title,
      type: input.type,
      content: input.content ?? undefined,
      position: input.position,
      active: input.active,
    });

    return this.formatter.toHomepageBlockType(updated);
  }

  async deleteBlock(id: string): Promise<boolean> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Homepage Block with ID '${id}' not found`);
    }
    await this.repository.delete(id);
    return true;
  }

  async reorderBlocks(
    inputs: ReorderHomepageBlocksInput[],
  ): Promise<HomepageBlockType[]> {
    for (const input of inputs) {
      const block = await this.repository.findById(input.id);
      if (!block) {
        throw new NotFoundException(
          `Homepage Block with ID '${input.id}' not found`,
        );
      }
    }

    await this.repository.updatePositions(inputs);
    return this.listBlocks();
  }
}
