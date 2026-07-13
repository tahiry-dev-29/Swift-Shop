import { Resolver, Query } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import { SettingService } from '../setting.service';
import { LanguageService } from '../language.service';
import { CurrencyService } from '../currency.service';
import { LanguageType, CurrencyType } from '../dto';
import { RedisService } from '@swift-shop/backend/auth';

@Resolver()
export class PublicSettingsResolver {
  constructor(
    private readonly settingService: SettingService,
    private readonly languageService: LanguageService,
    private readonly currencyService: CurrencyService,
    private readonly redisService: RedisService,
  ) {}

  @Query(() => GraphQLJSON, { description: 'Get all public settings' })
  async publicSettings() {
    const cacheKey = 'cache:public_settings';
    const cached = await this.redisService.getJson(cacheKey);
    if (cached) return cached;

    const settings = await this.settingService.getPublicSettings();
    await this.redisService.setJson(cacheKey, settings, 300); // 5 minutes
    return settings;
  }

  @Query(() => LanguageType, {
    nullable: true,
    description: 'Get active default language',
  })
  async activeLanguage() {
    const cacheKey = 'cache:active_language';
    const cached = await this.redisService.getJson(cacheKey);
    if (cached) return cached;

    const lang = await this.languageService.findDefault();
    if (lang) {
      await this.redisService.setJson(cacheKey, lang, 300);
    }
    return lang;
  }

  @Query(() => CurrencyType, {
    nullable: true,
    description: 'Get active default currency',
  })
  async activeCurrency() {
    const cacheKey = 'cache:active_currency';
    const cached = await this.redisService.getJson(cacheKey);
    if (cached) return cached;

    const currency = await this.currencyService.findDefault();
    if (currency) {
      await this.redisService.setJson(cacheKey, currency, 300);
    }
    return currency;
  }
}
