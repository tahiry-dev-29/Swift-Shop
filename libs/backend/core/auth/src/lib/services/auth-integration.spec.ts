import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerException } from '@nestjs/throttler';
import {
  CustomerAuthResolver,
  CustomerMagicLinkResolver,
  CustomerOAuthResolver,
  CustomerService,
} from '@swift-shop/backend/customer';
import {
  EmployeeAuthFlowService,
  EmployeeAuthResolver,
} from '@swift-shop/backend/employee';
import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { AuthRateLimitGuard } from '../guards/auth-rate-limit.guard';
import { AuthService } from './auth.service';

describe('Auth — Integration Tests', () => {
  let customerAuthResolver: CustomerAuthResolver;
  let customerMagicLinkResolver: CustomerMagicLinkResolver;
  let customerOAuthResolver: CustomerOAuthResolver;
  let employeeAuthResolver: EmployeeAuthResolver;
  let rateLimitGuard: AuthRateLimitGuard;

  let authServiceMock: Mocked<AuthService>;
  let customerServiceMock: Mocked<CustomerService>;
  let employeeAuthFlowMock: Mocked<EmployeeAuthFlowService>;
  let throttlerStorageMock: {
    increment: ReturnType<typeof vi.fn>;
  };

  const mockGqlContext = {
    req: {
      headers: { 'user-agent': 'Vitest-Agent', host: 'localhost:3000' },
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
    },
  };

  beforeEach(() => {
    authServiceMock = {
      validateCustomer: vi.fn(),
      generateCustomerToken: vi.fn(),
      audit: vi.fn().mockResolvedValue(undefined),
      detectSessionAnomaly: vi.fn().mockResolvedValue({
        detected: false,
        ipAddressChanged: false,
        userAgentChanged: false,
      }),
      generateCustomerMagicLinkToken: vi
        .fn()
        .mockReturnValue('magic-token-123'),
      sendCustomerMagicLink: vi.fn().mockResolvedValue(undefined),
      verifyCustomerMagicLink: vi.fn(),
      createOAuthAuthorizationUrl: vi
        .fn()
        .mockResolvedValue('https://oauth.url'),
      loginCustomerWithOAuth2: vi.fn(),
    } as unknown as Mocked<AuthService>;

    customerServiceMock = {
      findByEmail: vi.fn(),
      register: vi.fn(),
    } as unknown as Mocked<CustomerService>;

    employeeAuthFlowMock = {
      login: vi.fn(),
      completeForcedPasswordReset: vi.fn(),
      refreshToken: vi.fn(),
      logout: vi.fn(),
      generateTwoFactor: vi.fn(),
      enableTwoFactor: vi.fn(),
      disableTwoFactor: vi.fn(),
    } as unknown as Mocked<EmployeeAuthFlowService>;

    throttlerStorageMock = {
      increment: vi.fn().mockResolvedValue({
        totalHits: 1,
        timeToBlockExpire: 0,
        isBlocked: false,
        timeToLive: 60,
      }),
    };

    customerAuthResolver = new CustomerAuthResolver(
      customerServiceMock,
      authServiceMock,
      { mergeGuestCart: vi.fn().mockResolvedValue(undefined) } as never,
    );

    customerMagicLinkResolver = new CustomerMagicLinkResolver(
      customerServiceMock,
      authServiceMock,
    );

    customerOAuthResolver = new CustomerOAuthResolver(authServiceMock);

    employeeAuthResolver = new EmployeeAuthResolver(employeeAuthFlowMock);

    rateLimitGuard = new AuthRateLimitGuard(throttlerStorageMock as never);
  });

  describe('1. auth/employee/login', () => {
    it('should return tokens on employee login success', async () => {
      const mockResponse = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        employee: { id: 'emp1', email: 'emp@shop.com' },
      };
      employeeAuthFlowMock.login.mockResolvedValue(mockResponse as never);

      const res = await employeeAuthResolver.employeeLogin(
        mockGqlContext as never,
        'emp@shop.com',
        'CorrectP@ss1',
      );

      expect(res).toEqual(mockResponse);
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      employeeAuthFlowMock.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(
        employeeAuthResolver.employeeLogin(
          mockGqlContext as never,
          'emp@shop.com',
          'WrongP@ss',
        ),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException on locked account', async () => {
      employeeAuthFlowMock.login.mockRejectedValue(
        new UnauthorizedException('Account locked'),
      );

      await expect(
        employeeAuthResolver.employeeLogin(
          mockGqlContext as never,
          'locked@shop.com',
          'P@ss1234',
        ),
      ).rejects.toThrow('Account locked');
    });

    it('should return twoFactorRequired flag if TOTP is needed', async () => {
      const mock2FAResponse = {
        twoFactorRequired: true,
        twoFactorPendingToken: 'pending-2fa-token',
      };
      employeeAuthFlowMock.login.mockResolvedValue(mock2FAResponse as never);

      const res = await employeeAuthResolver.employeeLogin(
        mockGqlContext as never,
        'totp@shop.com',
        'CorrectP@ss1',
      );

      expect(res).toEqual(mock2FAResponse);
    });
  });

  describe('2. auth/customer/register', () => {
    it('should register new customer and return auth token pair', async () => {
      customerServiceMock.findByEmail.mockResolvedValue(null);
      const mockCustomer = {
        id: 'cust1',
        email: 'new@shop.com',
        firstname: 'Jane',
        lastname: 'Doe',
      };
      customerServiceMock.register.mockResolvedValue(mockCustomer as never);
      authServiceMock.generateCustomerToken.mockResolvedValue({
        accessToken: 'at',
        refreshToken: 'rt',
        jti: 'jti1',
      });

      const res = await customerAuthResolver.customerRegister(
        mockGqlContext as never,
        {
          email: 'new@shop.com',
          password: 'StrongP@ssw0rd!2026',
          firstname: 'Jane',
          lastname: 'Doe',
        },
      );

      expect(res).toHaveProperty('accessToken', 'at');
      expect(res).toHaveProperty('customer', mockCustomer);
      expect(authServiceMock.audit).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'customer.register_success' }),
      );
    });

    it('should reject registration if email is already in use', async () => {
      customerServiceMock.findByEmail.mockResolvedValue({
        id: 'existing1',
      } as never);

      await expect(
        customerAuthResolver.customerRegister(mockGqlContext as never, {
          email: 'existing@shop.com',
          password: 'StrongP@ssw0rd!2026',
          firstname: 'Jane',
          lastname: 'Doe',
        }),
      ).rejects.toThrow('Email already in use');
    });
  });

  describe('3. auth/customer/login (Password, Magic Link, OAuth2)', () => {
    it('should login customer with valid email and password', async () => {
      const mockCust = { id: 'cust1', email: 'cust@shop.com' };
      authServiceMock.validateCustomer.mockResolvedValue(mockCust as never);
      authServiceMock.generateCustomerToken.mockResolvedValue({
        accessToken: 'at',
        refreshToken: 'rt',
        jti: 'j1',
      });

      const res = await customerAuthResolver.customerLogin(
        mockGqlContext as never,
        'cust@shop.com',
        'CorrectP@ss',
      );

      expect(res).toHaveProperty('customer', mockCust);
      expect(authServiceMock.audit).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'customer.login_success' }),
      );
    });

    it('should request magic link and allow passwordless login', async () => {
      const mockCust = {
        id: 'cust1',
        email: 'magic@shop.com',
        active: true,
      };
      customerServiceMock.findByEmail.mockResolvedValue(mockCust as never);

      const requestRes =
        await customerMagicLinkResolver.requestCustomerMagicLink(
          mockGqlContext as never,
          'magic@shop.com',
        );
      expect(requestRes).toEqual({ sent: true });
      expect(authServiceMock.sendCustomerMagicLink).toHaveBeenCalled();

      authServiceMock.verifyCustomerMagicLink.mockResolvedValue(
        mockCust as never,
      );
      authServiceMock.generateCustomerToken.mockResolvedValue({
        accessToken: 'at_magic',
        refreshToken: 'rt_magic',
        jti: 'j_magic',
      });

      const loginRes =
        await customerMagicLinkResolver.customerLoginWithMagicLink(
          mockGqlContext as never,
          'magic-token-123',
        );

      expect(loginRes).toHaveProperty('accessToken', 'at_magic');
    });

    it('should execute OAuth2 login flow successfully', async () => {
      const mockCust = { id: 'cust1', email: 'oauth@shop.com' };
      authServiceMock.loginCustomerWithOAuth2.mockResolvedValue(
        mockCust as never,
      );
      authServiceMock.generateCustomerToken.mockResolvedValue({
        accessToken: 'at_oauth',
        refreshToken: 'rt_oauth',
        jti: 'j_oauth',
      });

      const res = await customerOAuthResolver.customerOAuth2Login(
        mockGqlContext as never,
        'google',
        'code123',
        'verifier123',
        'https://app.com/callback',
      );

      expect(res).toHaveProperty('accessToken', 'at_oauth');
      expect(authServiceMock.audit).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'customer.oauth2_login_success' }),
      );
    });
  });

  describe('4. Rate Limiting Guard', () => {
    it('should allow request when rate limit is not exceeded', async () => {
      throttlerStorageMock.increment.mockResolvedValue({
        isBlocked: false,
        totalHits: 2,
        timeToBlockExpire: 0,
        timeToLive: 60,
      });

      const mockExecutionContext = {
        getHandler: () => ({ name: 'customerLogin' }),
      } as unknown as ExecutionContext;

      vi.spyOn(GqlExecutionContext, 'create').mockReturnValue({
        getContext: () => ({
          req: { ip: '127.0.0.1', socket: { remoteAddress: '127.0.0.1' } },
        }),
        getArgs: () => ({ email: 'test@shop.com' }),
      } as never);

      await expect(
        rateLimitGuard.canActivate(mockExecutionContext),
      ).resolves.toBe(true);
    });

    it('should block request and throw ThrottlerException when rate limit is exceeded', async () => {
      throttlerStorageMock.increment.mockResolvedValue({
        isBlocked: true,
        totalHits: 10,
        timeToBlockExpire: 300,
        timeToLive: 300,
      });

      const mockExecutionContext = {
        getHandler: () => ({ name: 'customerLogin' }),
      } as unknown as ExecutionContext;

      vi.spyOn(GqlExecutionContext, 'create').mockReturnValue({
        getContext: () => ({
          req: { ip: '127.0.0.1', socket: { remoteAddress: '127.0.0.1' } },
        }),
        getArgs: () => ({ email: 'test@shop.com' }),
      } as never);

      await expect(
        rateLimitGuard.canActivate(mockExecutionContext),
      ).rejects.toThrow(ThrottlerException);
    });
  });
});
