import { createHash } from 'crypto';

const COMMON_PASSWORDS = new Set([
  '123456',
  '123456789',
  'password',
  'qwerty',
  'admin123',
  'customer123',
  'employee123',
  'dima1234',
]);

export function validateLocalPasswordPolicy(password: string): void {
  if (password.length < 12) {
    throw new Error('Password must contain at least 12 characters');
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    throw new Error('Password must contain lowercase and uppercase letters');
  }
  if (!/\d/.test(password)) {
    throw new Error('Password must contain at least one number');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    throw new Error('Password must contain at least one symbol');
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    throw new Error('Password is too common');
  }
}

export function sha1PasswordParts(password: string): {
  prefix: string;
  suffix: string;
} {
  const sha1 = createHash('sha1').update(password).digest('hex').toUpperCase();

  return {
    prefix: sha1.slice(0, 5),
    suffix: sha1.slice(5),
  };
}

export function pwnedPasswordRangeIncludesSuffix(
  rangeBody: string,
  suffix: string,
): boolean {
  return rangeBody
    .split('\n')
    .some((line) => line.split(':')[0]?.trim() === suffix);
}
