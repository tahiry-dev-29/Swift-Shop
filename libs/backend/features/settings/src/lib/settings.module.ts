import { Module } from '@nestjs/common';
import { DataAccessPrismaModule } from '@dima-new/data-access-prisma';
import { SettingService } from './setting.service';
import { LanguageService } from './language.service';
import { CurrencyService } from './currency.service';
import { StoreService } from './store.service';

@Module({
  imports: [DataAccessPrismaModule],
  controllers: [],
  providers: [SettingService, LanguageService, CurrencyService, StoreService],
  exports: [SettingService, LanguageService, CurrencyService, StoreService],
})
export class SettingsModule {}
