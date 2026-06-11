import { Injectable } from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';
import {
  CreateCategoryInput,
  UpdateCategoryInput,
  UpdateCategoryPositionInput,
  CategoryConnectionArgs,
} from './dto';
import Redis from 'ioredis';

function generateSlug(name: string): string {
  return (
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-') +
    '-' +
    Math.random().toString(36).substring(2, 6)
  );
}

@Injectable()
export class CategoryService {
  private redis = new Redis(
    process.env['REDIS_URL'] || 'redis://localhost:6379',
  );

  constructor(private readonly prisma: PrismaService) {}

  private async invalidateCache() {
    await this.redis.del('categories:all', 'categories:tree');
  }

  async findAll() {
    const cached = await this.redis.get('categories:all');
    if (cached) return JSON.parse(cached);

    const categories = await this.prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { position: 'asc' },
      include: { parent: true },
    });

    await this.redis.set(
      'categories:all',
      JSON.stringify(categories),
      'EX',
      3600,
    );
    return categories;
  }

  async findTree() {
    const cached = await this.redis.get('categories:tree');
    if (cached) return JSON.parse(cached);

    const categories = await this.prisma.category.findMany({
      where: { parentId: null, deletedAt: null },
      include: {
        children: {
          where: { deletedAt: null },
          include: {
            children: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: { position: 'asc' },
    });

    await this.redis.set(
      'categories:tree',
      JSON.stringify(categories),
      'EX',
      3600,
    );
    return categories;
  }

  async getConnection(args: CategoryConnectionArgs) {
    const take = args.first || 20;
    const where: import('@prisma/client').Prisma.CategoryWhereInput = {
      deletedAt: null,
    };
    if (args.parentId) where.parentId = args.parentId;

    const query: import('@prisma/client').Prisma.CategoryFindManyArgs = {
      where,
      take: take + 1,
      orderBy: { position: 'asc' },
    };

    if (args.after) {
      query.cursor = { id: args.after };
      query.skip = 1;
    }

    const categories = await this.prisma.category.findMany(query);
    const hasNextPage = categories.length > take;
    const nodes = hasNextPage ? categories.slice(0, take) : categories;

    const totalCount = await this.prisma.category.count({ where });

    return {
      edges: nodes.map((node) => ({ node, cursor: node.id })),
      pageInfo: {
        hasNextPage,
        hasPreviousPage: !!args.after,
        startCursor: nodes.length > 0 ? nodes[0].id : null,
        endCursor: nodes.length > 0 ? nodes[nodes.length - 1].id : null,
      },
      totalCount,
    };
  }

  async findById(id: string) {
    return this.prisma.category.findUnique({
      where: { id, deletedAt: null },
      include: {
        parent: true,
        children: { where: { deletedAt: null } },
      },
    });
  }

  async getPath(id: string): Promise<string[]> {
    const category = await this.findById(id);
    if (!category) return [];

    const path = [category.name];
    let current = category;

    while (current.parentId) {
      const parent = await this.findById(current.parentId);
      if (!parent) break;
      path.unshift(parent.name);
      current = parent;
    }

    return path;
  }

  async create(input: CreateCategoryInput) {
    let parentPath = '';
    if (input.parentId) {
      const parent = await this.findById(input.parentId);
      if (parent) parentPath = parent.path;
    }
    const slug = input.slug || generateSlug(input.name);

    const result = await this.prisma.$transaction(async (tx) => {
      const category = await tx.category.create({
        data: { ...input, slug },
      });
      const path = parentPath + category.id + '/';
      return tx.category.update({
        where: { id: category.id },
        data: { path },
        include: { parent: true },
      });
    });

    await this.invalidateCache();
    return result;
  }

  async update(id: string, input: UpdateCategoryInput) {
    const data: import('@prisma/client').Prisma.CategoryUpdateInput = {
      ...input,
    };
    if (input.name && !input.slug) {
      data.slug = generateSlug(input.name);
    }
    const result = await this.prisma.category.update({
      where: { id },
      data,
      include: { parent: true },
    });
    await this.invalidateCache();
    return result;
  }

  async reorderCategories(updates: UpdateCategoryPositionInput[]) {
    const result = await this.prisma.$transaction(
      updates.map((update) =>
        this.prisma.category.update({
          where: { id: update.id },
          data: { position: update.position },
        }),
      ),
    );
    await this.invalidateCache();
    return result;
  }

  async delete(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    const result = await this.prisma.category.updateMany({
      where: {
        OR: [{ id }, { path: { startsWith: category.path } }],
      },
      data: { deletedAt: new Date() },
    });
    await this.invalidateCache();
    return result;
  }
}
