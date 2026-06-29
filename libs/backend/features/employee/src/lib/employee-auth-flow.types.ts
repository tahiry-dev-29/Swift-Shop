export interface EmployeeGraphQLContext {
  req: {
    headers: Record<string, string | string[] | undefined>;
    ip?: string;
  };
  res?: {
    cookie: (name: string, value: string, options: TrustedDeviceCookie) => void;
  };
}

export type TrustedDeviceCookie = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict';
  maxAge: number;
  path: string;
};

export type LoginInput = {
  context: EmployeeGraphQLContext;
  email: string;
  password: string;
  totp?: string;
  trustedDeviceToken?: string;
  rememberDevice?: boolean;
};

export type LoginEmployee = {
  id: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string | null;
};
