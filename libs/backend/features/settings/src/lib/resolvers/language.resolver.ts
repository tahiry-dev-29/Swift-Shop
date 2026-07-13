import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PermissionGuard, RequirePermission } from '@swift-shop/backend/auth';
import { LanguageService } from '../language.service';
import { LanguageType, CreateLanguageInput, UpdateLanguageInput } from '../dto';

@Resolver(() => LanguageType)
@UseGuards(PermissionGuard)
export class LanguageResolver {
  constructor(private readonly languageService: LanguageService) {}

  @Query(() => [LanguageType])
  @RequirePermission('manage_settings')
  async languages() {
    return this.languageService.findAll();
  }

  @Query(() => LanguageType, { nullable: true })
  @RequirePermission('manage_settings')
  async language(@Args('id', { type: () => ID }) id: string) {
    return this.languageService.findById(id);
  }

  @Mutation(() => LanguageType)
  @RequirePermission('manage_settings')
  async createLanguage(@Args('input') input: CreateLanguageInput) {
    return this.languageService.create(input);
  }

  @Mutation(() => LanguageType)
  @RequirePermission('manage_settings')
  async updateLanguage(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateLanguageInput,
  ) {
    return this.languageService.update(id, input);
  }

  @Mutation(() => LanguageType)
  @RequirePermission('manage_settings')
  async setDefaultLanguage(@Args('id', { type: () => ID }) id: string) {
    return this.languageService.setDefault(id);
  }
}
