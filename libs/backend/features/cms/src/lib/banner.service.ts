import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { BannerRepository } from './banner.repository';
import { BannerFormatter } from './banner.formatter';
import { CreateBannerInput, UpdateBannerInput, BannerType } from './dto';

@Injectable()
export class BannerService {
  constructor(
    private readonly repository: BannerRepository,
    private readonly formatter: BannerFormatter,
  ) {}

  async createBanner(input: CreateBannerInput): Promise<BannerType> {
    if (input.dateFrom && input.dateTo && input.dateFrom > input.dateTo) {
      throw new BadRequestException(
        'dateFrom must be before or equal to dateTo',
      );
    }

    const created = await this.repository.create({
      title: input.title,
      imageUrl: input.imageUrl,
      linkUrl: input.linkUrl,
      active: input.active ?? true,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      position: input.position ?? 0,
    });

    return this.formatter.toBannerType(created);
  }

  async getBanner(id: string): Promise<BannerType> {
    const banner = await this.repository.findById(id);
    if (!banner) {
      throw new NotFoundException(`Banner with ID '${id}' not found`);
    }
    return this.formatter.toBannerType(banner);
  }

  async listBanners(options?: { activeOnly?: boolean }): Promise<BannerType[]> {
    const banners = await this.repository.findMany({
      activeOnly: options?.activeOnly,
      currentDate: options?.activeOnly ? new Date() : undefined,
    });
    return banners.map((banner) => this.formatter.toBannerType(banner));
  }

  async updateBanner(
    id: string,
    input: UpdateBannerInput,
  ): Promise<BannerType> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Banner with ID '${id}' not found`);
    }

    const finalDateFrom =
      input.dateFrom !== undefined ? input.dateFrom : existing.dateFrom;
    const finalDateTo =
      input.dateTo !== undefined ? input.dateTo : existing.dateTo;

    if (finalDateFrom && finalDateTo && finalDateFrom > finalDateTo) {
      throw new BadRequestException(
        'dateFrom must be before or equal to dateTo',
      );
    }

    const updated = await this.repository.update(id, {
      title: input.title,
      imageUrl: input.imageUrl,
      linkUrl: input.linkUrl,
      active: input.active,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      position: input.position,
    });

    return this.formatter.toBannerType(updated);
  }

  async deleteBanner(id: string): Promise<boolean> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Banner with ID '${id}' not found`);
    }
    await this.repository.delete(id);
    return true;
  }
}
