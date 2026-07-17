import { Injectable } from '@nestjs/common';
import { CmsPageType } from './dto';

interface CmsPageRecord {
  id: string;
  title: string;
  slug: string;
  content: string;
  active: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  dateAdd: Date;
  dateUpd: Date;
}

@Injectable()
export class CmsPageFormatter {
  toCmsPageType(record: CmsPageRecord): CmsPageType {
    return {
      id: record.id,
      title: record.title,
      slug: record.slug,
      content: record.content,
      active: record.active,
      metaTitle: record.metaTitle ?? undefined,
      metaDescription: record.metaDescription ?? undefined,
      dateAdd: record.dateAdd,
      dateUpd: record.dateUpd,
    };
  }
}
