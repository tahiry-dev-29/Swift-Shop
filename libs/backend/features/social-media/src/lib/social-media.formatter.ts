import { Injectable } from '@nestjs/common';
import { SocialPost } from '@dima-new/prisma-client';
import { SocialPostType } from './dto/social-post.type';

@Injectable()
export class SocialMediaFormatter {
  formatPost(post: SocialPost): SocialPostType {
    return {
      id: post.id,
      content: post.content,
      platform: post.platform,
      status: post.status,
      scheduledFor: post.scheduledFor || undefined,
      publishedAt: post.publishedAt || undefined,
      mediaUrls: post.mediaUrls,
      externalId: post.externalId || undefined,
      errorMessage: post.errorMessage || undefined,
      employeeId: post.employeeId || undefined,
      dateAdd: post.dateAdd,
      dateUpd: post.dateUpd,
    };
  }

  formatPosts(posts: SocialPost[]): SocialPostType[] {
    return posts.map((post) => this.formatPost(post));
  }
}
