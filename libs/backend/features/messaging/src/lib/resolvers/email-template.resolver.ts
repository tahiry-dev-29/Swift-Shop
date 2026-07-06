import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { EmailTemplateService } from '../services/email-template.service';
import {
  EmailTemplateType,
  CreateEmailTemplateInput,
  UpdateEmailTemplateInput,
} from '../dto';
import { EmployeeGuard } from '@swift-shop/backend/auth';

@Resolver()
@UseGuards(EmployeeGuard)
export class EmailTemplateResolver {
  constructor(private readonly emailTemplateService: EmailTemplateService) {}

  @Query(() => [EmailTemplateType])
  async emailTemplates() {
    return this.emailTemplateService.findAll();
  }

  @Query(() => EmailTemplateType)
  async emailTemplate(@Args('id', { type: () => ID }) id: string) {
    return this.emailTemplateService.findById(id);
  }

  @Mutation(() => EmailTemplateType)
  async createEmailTemplate(@Args('input') input: CreateEmailTemplateInput) {
    return this.emailTemplateService.create(input);
  }

  @Mutation(() => EmailTemplateType)
  async updateEmailTemplate(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateEmailTemplateInput,
  ) {
    return this.emailTemplateService.update(id, input);
  }

  @Mutation(() => EmailTemplateType)
  async deleteEmailTemplate(@Args('id', { type: () => ID }) id: string) {
    return this.emailTemplateService.delete(id);
  }
}
