import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { DataAccessPrismaModule } from '@dima-new/data-access-prisma';
import { AuthMailService } from './auth-mail.service';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { RedisService } from './redis.service';

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
  providers: [AuthService, JwtStrategy, RedisService],
  exports: [AuthService, JwtModule, RedisService],
})
export class AuthModule {}
