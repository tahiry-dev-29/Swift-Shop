import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DataAccessPrismaModule } from '@dima-new/data-access-prisma';
import { AuthService } from './auth-service';
import { JwtStrategy } from './jwt-strategy';

@Module({
  imports: [
    DataAccessPrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env['JWT_SECRET'] || 'dev-secret-change-in-prod',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
