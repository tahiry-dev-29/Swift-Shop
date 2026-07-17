import { Injectable } from '@nestjs/common';
import { HomepageBlockType } from './dto';

interface HomepageBlockRecord {
  id: string;
  title: string;
  type: string;
  content: unknown;
  position: number;
  active: boolean;
  dateAdd: Date;
  dateUpd: Date;
}

@Injectable()
export class HomepageFormatter {
  toHomepageBlockType(record: HomepageBlockRecord): HomepageBlockType {
    return {
      id: record.id,
      title: record.title,
      type: record.type,
      content: record.content ?? undefined,
      position: record.position,
      active: record.active,
      dateAdd: record.dateAdd,
      dateUpd: record.dateUpd,
    };
  }
}
