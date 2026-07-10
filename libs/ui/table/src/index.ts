import { HlmCaption } from './lib/hlm-caption';
import { HlmTBody } from './lib/hlm-t-body';
import { HlmTFoot } from './lib/hlm-t-foot';
import { HlmTHead } from './lib/hlm-t-head';
import { HlmTable } from './lib/hlm-table';
import { HlmTableContainer } from './lib/hlm-table-container';
import { HlmTd } from './lib/hlm-td';
import { HlmTh } from './lib/hlm-th';
import { HlmTr } from './lib/hlm-tr';

export * from './lib/hlm-caption';
export * from './lib/hlm-t-body';
export * from './lib/hlm-t-foot';
export * from './lib/hlm-t-head';
export * from './lib/hlm-table';
export * from './lib/hlm-table-container';
export * from './lib/hlm-td';
export * from './lib/hlm-th';
export * from './lib/hlm-tr';

export const HlmTableImports = [
  HlmCaption,
  HlmTableContainer,
  HlmTable,
  HlmTBody,
  HlmTd,
  HlmTFoot,
  HlmTh,
  HlmTHead,
  HlmTr,
] as const;
