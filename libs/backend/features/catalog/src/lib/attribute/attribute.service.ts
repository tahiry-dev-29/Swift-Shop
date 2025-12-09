import { Injectable } from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';
import { 
  CreateAttributeGroupInput, 
  UpdateAttributeGroupInput,
  CreateAttributeValueInput,
  UpdateAttributeValueInput 
} from './dto';

@Injectable()
export class AttributeService {
  constructor(private readonly prisma: PrismaService) {}

  // --- GROUPS ---

  async findAllGroups() {
    return this.prisma.attributeGroup.findMany({
      orderBy: { position: 'asc' },
      include: { 
        values: {
          orderBy: { position: 'asc' }
        }
      },
    });
  }

  async findGroupById(id: number) {
    return this.prisma.attributeGroup.findUnique({
      where: { id },
      include: { 
        values: {
          orderBy: { position: 'asc' }
        }
      },
    });
  }

  async createGroup(input: CreateAttributeGroupInput) {
    return this.prisma.attributeGroup.create({
      data: input,
    });
  }

  async updateGroup(id: number, input: UpdateAttributeGroupInput) {
    return this.prisma.attributeGroup.update({
      where: { id },
      data: input,
      include: { values: true },
    });
  }

  async deleteGroup(id: number) {
    return this.prisma.attributeGroup.delete({
      where: { id },
    });
  }

  // --- VALUES ---

  async findValueById(id: number) {
    return this.prisma.attributeValue.findUnique({
      where: { id },
    });
  }

  async createValue(groupId: number, input: CreateAttributeValueInput) {
    return this.prisma.attributeValue.create({
      data: {
        ...input,
        attributeGroupId: groupId,
      },
    });
  }

  async updateValue(id: number, input: UpdateAttributeValueInput) {
    return this.prisma.attributeValue.update({
      where: { id },
      data: input,
    });
  }

  async deleteValue(id: number) {
    return this.prisma.attributeValue.delete({
      where: { id },
    });
  }
}
