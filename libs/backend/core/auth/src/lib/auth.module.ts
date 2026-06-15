import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { DataAccessPrismaModule } from '@dima-new/data-access-prisma';
import { AuthMailService } from './services/auth-mail.service';
import { AuthService } from './services/auth.service';
import { AuthAuditService } from './services/auth-audit.service';
import { AuthCredentialsService } from './services/auth-credentials.service';
import { AuthOAuthService } from './services/auth-oauth.service';
import { AuthRecoveryService } from './services/auth-recovery.service';
import { AuthTokenService } from './services/auth-token.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PasswordSecurityService } from './services/password-security.service';
import { RedisService } from './infrastructure/storage/redis.service';
import { TrustedDeviceService } from './services/trusted-device.service';
import { TwoFactorService } from './services/two-factor.service';
import { SmtpService } from './infrastructure/smtp/smtp.service';
import {
  AUTH_RATE_LIMIT_IP_ATTEMPTS,
  AUTH_RATE_LIMIT_TTL_MS,
} from './infrastructure/rate-limiting/rate-limit.constants';
import { RedisThrottlerStorage } from './infrastructure/rate-limiting/redis-throttler-storage';
import { PermissionGuard } from './guards/permission-guard';
import { StoreBranchScopeGuard } from './guards/store-branch-scope.guard';

@Module({
  imports: [
    DataAccessPrismaModule,
    ConfigModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'auth',
            ttl: AUTH_RATE_LIMIT_TTL_MS,
            limit: AUTH_RATE_LIMIT_IP_ATTEMPTS,
          },
        ],
        storage: new RedisThrottlerStorage(configService),
      }),
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' }, // Short lived access token
      }),
    }),
  ],
  providers: [
    AuthService,
    AuthAuditService,
    AuthCredentialsService,
    AuthMailService,
    AuthOAuthService,
    AuthRecoveryService,
    AuthTokenService,
    JwtStrategy,
    PasswordSecurityService,
    RedisService,
    TrustedDeviceService,
    TwoFactorService,
    PermissionGuard,
    StoreBranchScopeGuard,
    SmtpService,
  ],
  exports: [
    AuthService,
    JwtModule,
    RedisService,
    PermissionGuard,
    StoreBranchScopeGuard,
    SmtpService,
  ],
})
export class AuthModule {}
