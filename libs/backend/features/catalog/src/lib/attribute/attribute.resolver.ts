import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards, NotFoundException } from '@nestjs/common';
import { AttributeService } from './attribute.service';
import { SuperAdminGuard } from '@swift-shop/backend/auth';
import {
  AttributeGroupType,
  AttributeValueType,
  CreateAttributeGroupInput,
  UpdateAttributeGroupInput,
  CreateAttributeValueInput,
  UpdateAttributeValueInput,
} from './dto';

@Resolver(() => AttributeGroupType)
export class AttributeResolver {
  constructor(private readonly attributeService: AttributeService) {}

  @Query(() => [AttributeGroupType])
  async attributeGroups() {
    return this.attributeService.findAllGroups();
  }

  @Query(() => AttributeGroupType)
  async attributeGroup(@Args('id', { type: () => ID }) id: string) {
    const group = await this.attributeService.findGroupById(id);
    if (!group) {
      throw new NotFoundException(`AttributeGroup #${id} not found`);
    }
    return group;
  }

  @Mutation(() => AttributeGroupType)
  @UseGuards(SuperAdminGuard)
  async createAttributeGroup(@Args('input') input: CreateAttributeGroupInput) {
    return this.attributeService.createGroup(input);
  }

  @Mutation(() => AttributeGroupType)
  @UseGuards(SuperAdminGuard)
  async updateAttributeGroup(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateAttributeGroupInput,
  ) {
    const group = await this.attributeService.findGroupById(id);
    if (!group) {
      throw new NotFoundException(`AttributeGroup #${id} not found`);
    }
    return this.attributeService.updateGroup(id, input);
  }

  @Mutation(() => AttributeGroupType)
  @UseGuards(SuperAdminGuard)
  async deleteAttributeGroup(@Args('id', { type: () => ID }) id: string) {
    const group = await this.attributeService.findGroupById(id);
    if (!group) {
      throw new NotFoundException(`AttributeGroup #${id} not found`);
    }
    return this.attributeService.deleteGroup(id);
  }

  @Mutation(() => AttributeValueType)
  @UseGuards(SuperAdminGuard)
  async createAttributeValue(
    @Args('groupId', { type: () => ID }) groupId: string,
    @Args('input') input: CreateAttributeValueInput,
  ) {
    const group = await this.attributeService.findGroupById(groupId);
    if (!group) {
      throw new NotFoundException(`AttributeGroup #${groupId} not found`);
    }
    return this.attributeService.createValue(groupId, input);
  }

  @Mutation(() => AttributeValueType)
  @UseGuards(SuperAdminGuard)
  async updateAttributeValue(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateAttributeValueInput,
  ) {
    const value = await this.attributeService.findValueById(id);
    if (!value) {
      throw new NotFoundException(`AttributeValue #${id} not found`);
    }
    return this.attributeService.updateValue(id, input);
  }

  @Mutation(() => AttributeValueType)
  @UseGuards(SuperAdminGuard)
  async deleteAttributeValue(@Args('id', { type: () => ID }) id: string) {
    const value = await this.attributeService.findValueById(id);
    if (!value) {
      throw new NotFoundException(`AttributeValue #${id} not found`);
    }
    return this.attributeService.deleteValue(id);
  }
}
