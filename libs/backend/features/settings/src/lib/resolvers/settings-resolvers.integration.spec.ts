import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { LanguageResolver } from './language.resolver';
import { CurrencyResolver } from './currency.resolver';
import { StoreResolver } from './store.resolver';
import { PublicSettingsResolver } from './public-settings.resolver';
import { LanguageService } from '../language.service';
import { CurrencyService } from '../currency.service';
import { StoreService } from '../store.service';
import { SettingService } from '../setting.service';
import { RedisService } from '@swift-shop/backend/auth';

describe('Settings Resolvers Integration Tests', () => {
  let languageResolver: LanguageResolver;
  let currencyResolver: CurrencyResolver;
  let storeResolver: StoreResolver;
  let publicSettingsResolver: PublicSettingsResolver;

  let languageServiceMock: Mocked<LanguageService>;
  let currencyServiceMock: Mocked<CurrencyService>;
  let storeServiceMock: Mocked<StoreService>;
  let settingServiceMock: Mocked<SettingService>;
  let redisServiceMock: Mocked<RedisService>;

  beforeEach(() => {
    languageServiceMock = {
      findAll: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      setDefault: vi.fn(),
      findDefault: vi.fn(),
    } as unknown as Mocked<LanguageService>;

    currencyServiceMock = {
      findAll: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      setDefault: vi.fn(),
      findDefault: vi.fn(),
      syncExchangeRates: vi.fn(),
    } as unknown as Mocked<CurrencyService>;

    storeServiceMock = {
      findAll: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as Mocked<StoreService>;

    settingServiceMock = {
      getPublicSettings: vi.fn(),
    } as unknown as Mocked<SettingService>;

    redisServiceMock = {
      getJson: vi.fn(),
      setJson: vi.fn(),
    } as unknown as Mocked<RedisService>;

    languageResolver = new LanguageResolver(languageServiceMock);
    currencyResolver = new CurrencyResolver(currencyServiceMock);
    storeResolver = new StoreResolver(storeServiceMock);
    publicSettingsResolver = new PublicSettingsResolver(
      settingServiceMock,
      languageServiceMock,
      currencyServiceMock,
      redisServiceMock,
    );
  });

  describe('LanguageResolver', () => {
    it('should query all languages', async () => {
      languageServiceMock.findAll.mockResolvedValue([
        { id: 'en', name: 'English', code: 'en', locale: 'en-US' } as never,
      ]);
      const res = await languageResolver.languages();
      expect(res).toHaveLength(1);
      expect(languageServiceMock.findAll).toHaveBeenCalled();
    });

    it('should query language by id', async () => {
      languageServiceMock.findById.mockResolvedValue({
        id: 'en',
        name: 'English',
      } as never);
      const res = await languageResolver.language('en');
      expect(res?.name).toBe('English');
    });

    it('should execute createLanguage mutation', async () => {
      const input = { name: 'French', code: 'fr', locale: 'fr-FR' };
      languageServiceMock.create.mockResolvedValue({
        id: 'fr',
        ...input,
      } as never);
      const res = await languageResolver.createLanguage(input);
      expect(res.code).toBe('fr');
    });
  });

  describe('CurrencyResolver', () => {
    it('should query currencies', async () => {
      currencyServiceMock.findAll.mockResolvedValue([
        { id: 'usd', code: 'USD', symbol: '$' } as never,
      ]);
      const res = await currencyResolver.currencies();
      expect(res).toHaveLength(1);
    });

    it('should execute updateCurrency mutation', async () => {
      currencyServiceMock.update.mockResolvedValue({
        id: 'usd',
        code: 'USD',
        symbol: '$',
      } as never);
      const res = await currencyResolver.updateCurrency('usd', {
        symbol: '$',
      });
      expect(res.symbol).toBe('$');
    });
  });

  describe('StoreResolver', () => {
    it('should query stores', async () => {
      storeServiceMock.findAll.mockResolvedValue([
        { id: 's1', name: 'Main Store' } as never,
      ]);
      const res = await storeResolver.stores();
      expect(res).toHaveLength(1);
    });
  });

  describe('PublicSettingsResolver (Unauthenticated Access)', () => {
    it('should fetch public settings from cache if present', async () => {
      redisServiceMock.getJson.mockResolvedValue({ store_name: 'Cached Shop' });
      const settings = await publicSettingsResolver.publicSettings();
      expect(settings).toEqual({ store_name: 'Cached Shop' });
      expect(settingServiceMock.getPublicSettings).not.toHaveBeenCalled();
    });

    it('should fetch from settingService if cache miss and cache the result', async () => {
      redisServiceMock.getJson.mockResolvedValue(null);
      settingServiceMock.getPublicSettings.mockResolvedValue({
        store_name: 'Fresh Shop',
      });

      const settings = await publicSettingsResolver.publicSettings();

      expect(settings).toEqual({ store_name: 'Fresh Shop' });
      expect(redisServiceMock.setJson).toHaveBeenCalledWith(
        'cache:public_settings',
        { store_name: 'Fresh Shop' },
        300,
      );
    });

    it('should fetch active default language', async () => {
      redisServiceMock.getJson.mockResolvedValue(null);
      languageServiceMock.findDefault.mockResolvedValue({
        id: 'l1',
        name: 'English',
        code: 'en',
      } as never);

      const lang = await publicSettingsResolver.activeLanguage();

      expect(lang?.code).toBe('en');
    });
  });
});
