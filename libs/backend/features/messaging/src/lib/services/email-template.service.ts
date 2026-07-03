import { Injectable, NotFoundException } from '@nestjs/common';
import { EmailTemplateRepository } from '../repositories/email-template.repository';

@Injectable()
export class EmailTemplateService {
  constructor(private readonly templateRepo: EmailTemplateRepository) {}

  async findAll() {
    return this.templateRepo.findAll();
  }

  async findById(id: string) {
    const template = await this.templateRepo.findById(id);
    if (!template) {
      throw new NotFoundException(`Template #${id} not found`);
    }
    return template;
  }

  async create(data: { name: string; subject: string; bodyHtml: string }) {
    return this.templateRepo.create(data);
  }

  async update(
    id: string,
    data: { name?: string; subject?: string; bodyHtml?: string },
  ) {
    await this.findById(id);
    return this.templateRepo.update(id, data);
  }

  async delete(id: string) {
    await this.findById(id);
    return this.templateRepo.delete(id);
  }
}
