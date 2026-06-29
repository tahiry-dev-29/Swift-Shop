import {
  EmployeeGraphQLContext,
  TrustedDeviceCookie,
} from './employee-auth-flow.types';

export const TRUSTED_DEVICE_COOKIE_NAME = 'dima_trusted_employee_device';

const TRUSTED_DEVICE_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

export function headerValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function requestMeta(context: EmployeeGraphQLContext) {
  return {
    ipAddress:
      headerValue(context.req.headers['x-forwarded-for']) ?? context.req.ip,
    userAgent: headerValue(context.req.headers['user-agent']),
  };
}

export function cookieValue(cookieHeader: string | undefined, name: string) {
  return cookieHeader
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function trustedDeviceCookieOptions(): TrustedDeviceCookie {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: TRUSTED_DEVICE_COOKIE_MAX_AGE,
    path: '/',
  };
}
