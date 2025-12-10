import { Injectable } from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';
import { CreateCategoryInput, UpdateCategoryInput } from './dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { position: 'asc' },
      include: { parent: true },
    });
  }

  async findTree() {
    const categories = await this.prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            children: true,
          },
        },
      },
      orderBy: { position: 'asc' },
    });
    return categories;
  }

  async findById(id: string) {
    return this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
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
    return this.prisma.category.create({
      data: input,
      include: { parent: true },
    });
  }

  async update(id: string, input: UpdateCategoryInput) {
    return this.prisma.category.update({
      where: { id },
      data: input,
      include: { parent: true },
    });
  }

  async delete(id: string) {
    const hasChildren = await this.prisma.category.count({
      where: { parentId: id },
    });
    
    if (hasChildren > 0) {
      throw new Error('Cannot delete category with children');
    }
    
    return this.prisma.category.delete({
      where: { id },
    });
  }
}

