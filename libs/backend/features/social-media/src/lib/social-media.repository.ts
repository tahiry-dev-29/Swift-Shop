import { Injectable } from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';
import { SocialPost } from '@dima-new/prisma-client';
import { CreateSocialPostInput } from './dto/social-post.input';

@Injectable()
export class SocialMediaRepository {
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
        errorMessage,
        ...(status === 'PUBLISHED' ? { publishedAt: new Date() } : {}),
      },
    });
  }

  async getPendingPosts(): Promise<SocialPost[]> {
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
