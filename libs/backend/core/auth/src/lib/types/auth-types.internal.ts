export const MAGIC_LINK_TTL = '15m';
export const PASSWORD_RESET_TTL = '15m';
export const DEVICE_TRUST_DAYS = 30;
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
export const LOCKOUT_THRESHOLD = 5;
export const LOCKOUT_MINUTES = 15;

export type RequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

export type AuditInput = RequestMeta & {
  action: string;
  actorType?: 'customer' | 'employee' | 'system';
  actorId?: string;
  customerId?: string;
  employeeId?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type OAuthProvider = 'google' | 'facebook';

export type OAuthProfile = {
  provider: OAuthProvider;
  providerAccountId: string;
  email: string;
  firstname: string;
  lastname: string;
};

export type SessionAnomalyInput = RequestMeta & {
  actorType: 'customer' | 'employee';
  actorId: string;
};

export type SessionAnomalyResult = {
  detected: boolean;
  ipAddressChanged: boolean;
  userAgentChanged: boolean;
  previousIpAddress?: string;
  previousUserAgent?: string;
};
