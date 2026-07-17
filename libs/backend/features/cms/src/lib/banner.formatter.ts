import { Injectable } from '@nestjs/common';
import { BannerType } from './dto';

interface BannerRecord {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  active: boolean;
  dateFrom: Date | null;
  dateTo: Date | null;
  position: number;
  dateAdd: Date;
  dateUpd: Date;
}

@Injectable()
export class BannerFormatter {
  toBannerType(record: BannerRecord): BannerType {
    return {
      id: record.id,
      title: record.title,
      imageUrl: record.imageUrl,
      linkUrl: record.linkUrl ?? undefined,
      active: record.active,
      dateFrom: record.dateFrom ?? undefined,
      dateTo: record.dateTo ?? undefined,
      position: record.position,
      dateAdd: record.dateAdd,
      dateUpd: record.dateUpd,
    };
  }
}
