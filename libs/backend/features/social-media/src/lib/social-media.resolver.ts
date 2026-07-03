import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { EmployeeGuard, CurrentUser, AuthUser } from '@dima-new/backend/auth';
import { SocialMediaService } from './social-media.service';
import { SocialPostType } from './dto/social-post.type';
import { CreateSocialPostInput } from './dto/social-post.input';

@Resolver(() => SocialPostType)
export class SocialMediaResolver {
  constructor(private readonly socialMediaService: SocialMediaService) {}

  @Mutation(() => SocialPostType)
  @UseGuards(EmployeeGuard)
  async createSocialPost(
    @CurrentUser() user: AuthUser,
    @Args('input') input: CreateSocialPostInput,
  ): Promise<SocialPostType> {
    return this.socialMediaService.createPost(input, user.id);
  }

  @Query(() => SocialPostType)
  @UseGuards(EmployeeGuard)
  async socialPost(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<SocialPostType> {
    return this.socialMediaService.getPost(id);
  }

  @Mutation(() => Boolean)
  @UseGuards(EmployeeGuard)
  async syncSocialCatalog(): Promise<boolean> {
    await this.socialMediaService.triggerCatalogSync();
    return true;
  }
}
