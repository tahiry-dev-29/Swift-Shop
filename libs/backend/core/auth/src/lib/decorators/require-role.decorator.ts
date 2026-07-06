import { SetMetadata } from '@nestjs/common';

export const REQUIRED_ROLE_KEY = 'requiredRole';

/** Restrict resolver/controller to one or more role slugs */
export function RequireRole(...slugs: string[]) {
  return SetMetadata(REQUIRED_ROLE_KEY, slugs);
}
