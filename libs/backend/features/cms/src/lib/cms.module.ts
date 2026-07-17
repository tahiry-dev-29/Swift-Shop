import { Module } from '@nestjs/common';
import { DataAccessPrismaModule } from '@swift-shop/data-access-prisma';
import { CmsPageService } from './cms-page.service';
import { CmsPageRepository } from './cms-page.repository';
import { CmsPageFormatter } from './cms-page.formatter';
import { CmsPageResolver } from './cms-page.resolver';
import { BannerService } from './banner.service';
import { BannerRepository } from './banner.repository';
import { BannerFormatter } from './banner.formatter';
import { BannerResolver } from './banner.resolver';
import { HomepageService } from './homepage.service';
import { HomepageRepository } from './homepage.repository';
import { HomepageFormatter } from './homepage.formatter';
import { HomepageResolver } from './homepage.resolver';

@Module({
  imports: [DataAccessPrismaModule],
  providers: [
    CmsPageService,
    CmsPageRepository,
    CmsPageFormatter,
    CmsPageResolver,
    BannerService,
    BannerRepository,
    BannerFormatter,
    BannerResolver,
    HomepageService,
    HomepageRepository,
    HomepageFormatter,
    HomepageResolver,
  ],
  exports: [CmsPageService, BannerService, HomepageService],
})
export class CmsModule {}
