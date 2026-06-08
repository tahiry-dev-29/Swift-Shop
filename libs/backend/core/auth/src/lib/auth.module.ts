import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DataAccessPrismaModule } from '@dima-new/data-access-prisma';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { RedisService } from './redis.service';

@Module({
  imports: [
    DataAccessPrismaModule,
    ConfigModule,
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
