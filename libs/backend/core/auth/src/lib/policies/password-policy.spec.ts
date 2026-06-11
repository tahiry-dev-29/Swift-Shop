import { describe, expect, it } from 'vitest';
import {
  pwnedPasswordRangeIncludesSuffix,
  sha1PasswordParts,
  validateLocalPasswordPolicy,
} from './password-policy';

describe('password policy', () => {
  it('accepts a password that satisfies local complexity rules', () => {
    expect(() => validateLocalPasswordPolicy('Str0ng-Passw0rd')).not.toThrow();
  });

  it('rejects short passwords before external breach checks', () => {
    expect(() => validateLocalPasswordPolicy('Short1!')).toThrow(
      'Password must contain at least 12 characters',
    );
  });

  it('rejects passwords without a symbol', () => {
    expect(() => validateLocalPasswordPolicy('StrongPassw0rd')).toThrow(
      'Password must contain at least one symbol',
    );
  });

  it('builds HaveIBeenPwned k-anonymity hash parts', () => {
    expect(sha1PasswordParts('password')).toEqual({
      prefix: '5BAA6',
      suffix: '1E4C9B93F3F0682250B6CF8331B7EE68FD8',
    });
  });

  it('detects a matching suffix in a HaveIBeenPwned range response', () => {
    expect(
      pwnedPasswordRangeIncludesSuffix(
        '003D68EB55068C33ACE09247EE4C639306B:2\n1E4C9B93F3F0682250B6CF8331B7EE68FD8:46658894',
        '1E4C9B93F3F0682250B6CF8331B7EE68FD8',
      ),
    ).toBe(true);
  });
});
