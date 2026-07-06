import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { CreateProductImageInput } from './dto';

@Injectable()
export class ProductImageService {
  constructor(private readonly prisma: PrismaService) {}

  async addImage(productId: string, input: CreateProductImageInput) {
    await this.assertProductExists(productId);

    if (input.cover) {
      await this.prisma.productImage.updateMany({
        where: { productId },
        data: { cover: false },
      });
    }

    return this.prisma.productImage.create({
      data: {
        ...input,
        productId,
      },
    });
  }

  async removeImage(imageId: string) {
    const image = await this.prisma.productImage.findUnique({
      where: { id: imageId },
    });
    if (!image) {
      throw new NotFoundException(`ProductImage #${imageId} not found`);
    }
    return this.prisma.productImage.delete({
      where: { id: imageId },
    });
  }

  async setCoverImage(imageId: string) {
    const image = await this.prisma.productImage.findUnique({
      where: { id: imageId },
    });
    if (!image) {
      throw new NotFoundException(`ProductImage #${imageId} not found`);
    }

    await this.prisma.productImage.updateMany({
      where: { productId: image.productId },
      data: { cover: false },
    });
    return this.prisma.productImage.update({
      where: { id: imageId },
      data: { cover: true },
    });
  }

  private async assertProductExists(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product #${productId} not found`);
    }
  }
}
