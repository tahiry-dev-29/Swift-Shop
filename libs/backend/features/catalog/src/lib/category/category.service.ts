import { Injectable } from '@nestjs/common';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { Prisma } from '@swift-shop/prisma-client';
import {
  CreateCategoryInput,
  UpdateCategoryInput,
  UpdateCategoryPositionInput,
  CategoryConnectionArgs,
} from './dto';
import { CategoryCacheService } from './category-cache.service';
import { generateCategorySlug } from './category.utils';

@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CategoryCacheService,
  ) {}

  async findAll() {
    const cached = await this.cache.get('categories:all');
    if (cached) return cached;

    const categories = await this.prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { position: 'asc' },
      include: { parent: true },
    });

    await this.cache.set('categories:all', categories);
    return categories;
  }

  async findTree() {
    const cached = await this.cache.get('categories:tree');
    if (cached) return cached;

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

    await this.cache.set('categories:tree', categories);
    return categories;
  }

  async getConnection(args: CategoryConnectionArgs) {
    const take = args.first || 20;
    const where: Prisma.CategoryWhereInput = {
      deletedAt: null,
    };
    if (args.parentId) where.parentId = args.parentId;

    const query: Prisma.CategoryFindManyArgs = {
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
    const slug = input.slug || generateCategorySlug(input.name);

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

    await this.cache.invalidate();
    return result;
  }

  async update(id: string, input: UpdateCategoryInput) {
    const data: Prisma.CategoryUpdateInput = {
      ...input,
    };
    if (input.name && !input.slug) {
      data.slug = generateCategorySlug(input.name);
    }
    const result = await this.prisma.category.update({
      where: { id },
      data,
      include: { parent: true },
    });
    await this.cache.invalidate();
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
    await this.cache.invalidate();
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
    await this.cache.invalidate();
    return result;
  }
}
