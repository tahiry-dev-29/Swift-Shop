import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { SocialPost } from '@swift-shop/prisma-client';
import { CreateSocialPostInput } from './dto/social-post.input';

@Injectable()
export class SocialMediaRepository {
  private readonly logger = new Logger(SocialMediaRepository.name);
  constructor(private readonly prisma: PrismaService) {}

  async createPost(
    data: CreateSocialPostInput,
    employeeId: string,
  ): Promise<SocialPost> {
    return this.prisma.socialPost.create({
      data: {
        content: data.content,
        platform: data.platform,
        status: data.scheduledFor ? 'SCHEDULED' : 'DRAFT',
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
        mediaUrls: data.mediaUrls || [],
        employeeId: employeeId,
      },
    });
  }

  async getPostById(id: string): Promise<SocialPost | null> {
    return this.prisma.socialPost.findUnique({
      where: { id },
    });
  }

  async updatePostStatus(
    id: string,
    status: string,
    externalId?: string,
    errorMessage?: string,
  ): Promise<SocialPost> {
    return this.prisma.socialPost.update({
      where: { id },
      data: {
        status,
        externalId,
        errorMessage:
          errorMessage ?? (status === 'PUBLISHED' ? null : undefined),
        ...(status === 'PUBLISHED' ? { publishedAt: new Date() } : {}),
      },
    });
  }

  async updatePostStatusIfScheduled(
    id: string,
    newStatus: string,
  ): Promise<SocialPost | null> {
    const result = await this.prisma.socialPost.updateMany({
      where: {
        id,
        status: 'SCHEDULED',
      },
      data: {
        status: newStatus,
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.prisma.socialPost.findUnique({
      where: { id },
    });
  }

  async getPendingPosts(): Promise<SocialPost[]> {
    this.logger.log('Fetching pending posts...');
    return this.prisma.socialPost.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledFor: {
          lte: new Date(),
        },
      },
    });
  }
}
