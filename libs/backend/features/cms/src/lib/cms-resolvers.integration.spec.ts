import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { CmsPageResolver } from './cms-page.resolver';
import { BannerResolver } from './banner.resolver';
import { HomepageResolver } from './homepage.resolver';
import { CmsPageService } from './cms-page.service';
import { BannerService } from './banner.service';
import { HomepageService } from './homepage.service';

describe('CMS Resolvers — Integration tests', () => {
  let cmsPageResolver: CmsPageResolver;
  let bannerResolver: BannerResolver;
  let homepageResolver: HomepageResolver;

  let cmsPageService: Mocked<CmsPageService>;
  let bannerService: Mocked<BannerService>;
  let homepageService: Mocked<HomepageService>;

  beforeEach(() => {
    cmsPageService = {
      createPage: vi.fn(),
      getPage: vi.fn(),
      getPageBySlug: vi.fn(),
      listPages: vi.fn(),
      updatePage: vi.fn(),
      deletePage: vi.fn(),
    } as unknown as Mocked<CmsPageService>;

    bannerService = {
      createBanner: vi.fn(),
      getBanner: vi.fn(),
      listBanners: vi.fn(),
      updateBanner: vi.fn(),
      deleteBanner: vi.fn(),
    } as unknown as Mocked<BannerService>;

    homepageService = {
      createBlock: vi.fn(),
      getBlock: vi.fn(),
      listBlocks: vi.fn(),
      updateBlock: vi.fn(),
      deleteBlock: vi.fn(),
      reorderBlocks: vi.fn(),
    } as unknown as Mocked<HomepageService>;

    cmsPageResolver = new CmsPageResolver(cmsPageService);
    bannerResolver = new BannerResolver(bannerService);
    homepageResolver = new HomepageResolver(homepageService);
  });

  describe('CmsPageResolver', () => {
    it('should query pages', async () => {
      cmsPageService.listPages.mockResolvedValue([]);
      const result = await cmsPageResolver.cmsPages(true);
      expect(result).toEqual([]);
      expect(cmsPageService.listPages).toHaveBeenCalledWith({
        activeOnly: true,
      });
    });

    it('should mutate create page', async () => {
      const mockResult = {
        id: '1',
        title: 'P1',
        slug: 'p1',
        content: 'content',
        active: true,
        metaTitle: undefined,
        metaDescription: undefined,
        dateAdd: new Date(),
        dateUpd: new Date(),
      };
      cmsPageService.createPage.mockResolvedValue(mockResult);
      const result = await cmsPageResolver.createCmsPage({
        title: 'P1',
        slug: 'p1',
        content: 'content',
      });
      expect(result).toBe(mockResult);
    });
  });

  describe('BannerResolver', () => {
    it('should query banners', async () => {
      bannerService.listBanners.mockResolvedValue([]);
      const result = await bannerResolver.banners(true);
      expect(result).toEqual([]);
      expect(bannerService.listBanners).toHaveBeenCalledWith({
        activeOnly: true,
      });
    });
  });

  describe('HomepageResolver', () => {
    it('should query blocks', async () => {
      homepageService.listBlocks.mockResolvedValue([]);
      const result = await homepageResolver.homepageBlocks(true);
      expect(result).toEqual([]);
      expect(homepageService.listBlocks).toHaveBeenCalledWith({
        activeOnly: true,
      });
    });

    it('should mutate reorder blocks', async () => {
      homepageService.reorderBlocks.mockResolvedValue([]);
      const result = await homepageResolver.reorderHomepageBlocks([
        { id: '1', position: 0 },
      ]);
      expect(result).toEqual([]);
      expect(homepageService.reorderBlocks).toHaveBeenCalledWith([
        { id: '1', position: 0 },
      ]);
    });
  });
});
