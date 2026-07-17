import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CmsPageRepository } from './cms-page.repository';
import { CmsPageFormatter } from './cms-page.formatter';
import { CreateCmsPageInput, UpdateCmsPageInput, CmsPageType } from './dto';

@Injectable()
export class CmsPageService {
  constructor(
    private readonly repository: CmsPageRepository,
    private readonly formatter: CmsPageFormatter,
  ) {}

  async createPage(input: CreateCmsPageInput): Promise<CmsPageType> {
    const isSlugTaken = await this.repository.countBySlug(input.slug);
    if (isSlugTaken > 0) {
      throw new BadRequestException(`Slug '${input.slug}' is already in use`);
    }

    const created = await this.repository.create({
      title: input.title,
      slug: input.slug,
      content: input.content,
      active: input.active ?? true,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
    });

    return this.formatter.toCmsPageType(created);
  }

  async getPage(id: string): Promise<CmsPageType> {
    const page = await this.repository.findById(id);
    if (!page) {
      throw new NotFoundException(`CMS Page with ID '${id}' not found`);
    }
    return this.formatter.toCmsPageType(page);
  }

  async getPageBySlug(slug: string): Promise<CmsPageType> {
    const page = await this.repository.findBySlug(slug);
    if (!page) {
      throw new NotFoundException(`CMS Page with slug '${slug}' not found`);
    }
    return this.formatter.toCmsPageType(page);
  }

  async listPages(options?: { activeOnly?: boolean }): Promise<CmsPageType[]> {
    const pages = await this.repository.findMany(options);
    return pages.map((page) => this.formatter.toCmsPageType(page));
  }

  async updatePage(
    id: string,
    input: UpdateCmsPageInput,
  ): Promise<CmsPageType> {
    await this.getPage(id);

    if (input.slug) {
      const isSlugTaken = await this.repository.countBySlug(input.slug, id);
      if (isSlugTaken > 0) {
        throw new BadRequestException(`Slug '${input.slug}' is already in use`);
      }
    }

    const updated = await this.repository.update(id, {
      title: input.title,
      slug: input.slug,
      content: input.content,
      active: input.active,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
    });

    return this.formatter.toCmsPageType(updated);
  }

  async deletePage(id: string): Promise<boolean> {
    await this.getPage(id);
    await this.repository.delete(id);
    return true;
  }
}
