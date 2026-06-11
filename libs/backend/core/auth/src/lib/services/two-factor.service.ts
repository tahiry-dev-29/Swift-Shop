import { Injectable } from '@nestjs/common';
import { generateSecret, generateURI, verifySync } from 'otplib';
import { toDataURL } from 'qrcode';

@Injectable()
export class TwoFactorService {
  generateSecret(email: string) {
    const secret = generateSecret();
    const otpauthUrl = generateURI({
      issuer: 'Store Admin',
      label: email,
      secret,
    });
    return { secret, otpauthUrl };
  }

  async generateQrCodeDataURL(otpauthUrl: string) {
    return toDataURL(otpauthUrl);
  }

  verifyToken(secret: string, token: string) {
    return verifySync({ token, secret }).valid;
  }
}
