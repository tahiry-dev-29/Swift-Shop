import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@dima-new/data-access-prisma';
import {
  CreateProductInput,
  UpdateProductInput,
  ProductFilterInput,
} from './dto';
import { ProductSearchService } from './product-search.service';

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: ProductSearchService,
  ) {}

  async findAll(filter?: ProductFilterInput) {
    const where: Record<string, unknown> = {};

    if (filter?.categoryId) where['categoryId'] = filter.categoryId;
    if (filter?.active !== undefined) where['active'] = filter.active;
    if (filter?.search) {
      where['OR'] = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { reference: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: filter?.skip ?? 0,
        take: filter?.take ?? 20,
        include: this.productInclude(),
        orderBy: { dateAdd: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: this.productInclude(),
    });
    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }
    return product;
  }

  private generateSlug(name: string): string {
    return (
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') +
      '-' +
      Math.random().toString(36).substring(2, 6)
    );
  }

  async create({ categoryId, linkRewrite, ...input }: CreateProductInput) {
    const slug = linkRewrite || this.generateSlug(input.name);
    const data: Prisma.ProductUncheckedCreateInput = {
      ...input,
      slug,
      categoryId: categoryId ?? null,
    };
    const product = await this.prisma.product.create({
      data,
      include: { category: true },
    });

    await this.searchService.syncProduct(product);

    return product;
  }

  async update(
    id: string,
    { categoryId, linkRewrite, ...input }: UpdateProductInput,
  ) {
    await this.findById(id);
    const data: Prisma.ProductUpdateInput = {
      ...input,
      ...(linkRewrite ? { slug: linkRewrite } : {}),
      ...(categoryId !== undefined ? { categoryId: categoryId ?? null } : {}),
    };
    const product = await this.prisma.product.update({
      where: { id },
      data,
      include: this.productInclude(),
    });

    await this.searchService.syncProduct(product);

    return product;
  }

  async delete(id: string) {
    await this.findById(id);
    const result = await this.prisma.product.delete({ where: { id } });

    await this.searchService.deleteProduct(id);

    return result;
  }

  async duplicate(id: string) {
    const product = await this.findById(id);
    const {
      name,
      description,
      descriptionShort,
      price,
      wholesalePrice,
      availableForOrder,
      showPrice,
      metaTitle,
      metaDescription,
      canonicalUrl,
      isVirtual,
      downloadableFileUrl,
      weight,
      width,
      height,
      depth,
      categoryId,
    } = product;

    const newName = `${name} (Copy)`;
    const newSlug = this.generateSlug(newName);
    const newReference = `${product.reference}-COPY-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const duplicatedProduct = await this.prisma.product.create({
      data: {
        name: newName,
        slug: newSlug,
        reference: newReference,
        active: false,
        description,
        descriptionShort,
        price,
        wholesalePrice,
        availableForOrder,
        showPrice,
        metaTitle,
        metaDescription,
        canonicalUrl,
        isVirtual,
        downloadableFileUrl,
        weight,
        width,
        height,
        depth,
        categoryId,
      },
      include: this.productInclude(),
    });

    await this.searchService.syncProduct(duplicatedProduct);

    return duplicatedProduct;
  }

  private productInclude(): Prisma.ProductInclude {
    return {
      images: { orderBy: { position: 'asc' } },
      combinations: {
        include: {
          attributes: { include: { attributeValue: true } },
          stock: true,
        },
      },
      stock: true,
      category: true,
      reviews: true,
      labels: true,
      relatedTo: { include: { relatedProduct: true } },
      bundleItems: { include: { product: true } },
      priceHistories: { orderBy: { dateAdd: 'desc' } },
    };
  }
}
