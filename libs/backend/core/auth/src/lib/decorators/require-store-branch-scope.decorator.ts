import { SetMetadata } from '@nestjs/common';

export const STORE_BRANCH_SCOPE_KEY = 'storeBranchScope';

export type StoreBranchScopeOptions = {
  branchIdArg?: string;
};

export function RequireStoreBranchScope(options: StoreBranchScopeOptions = {}) {
  return SetMetadata(STORE_BRANCH_SCOPE_KEY, options);
}
