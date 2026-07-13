import { Module } from '@nestjs/common';
import { DataAccessPrismaModule } from '@swift-shop/data-access-prisma';
import { SettingService } from './setting.service';
import { LanguageService } from './language.service';
import { CurrencyService } from './currency.service';
import { StoreService } from './store.service';

import {
  LanguageResolver,
  CurrencyResolver,
  StoreResolver,
  PublicSettingsResolver,
} from './resolvers';
import { AuthModule } from '@swift-shop/backend/auth'; // Auth module for RedisService & Guards

@Module({
  imports: [DataAccessPrismaModule, AuthModule],
  controllers: [],
  providers: [
    SettingService,
    LanguageService,
    CurrencyService,
    StoreService,
    LanguageResolver,
    CurrencyResolver,
    StoreResolver,
    PublicSettingsResolver,
  ],
  exports: [SettingService, LanguageService, CurrencyService, StoreService],
})
export class SettingsModule {}
