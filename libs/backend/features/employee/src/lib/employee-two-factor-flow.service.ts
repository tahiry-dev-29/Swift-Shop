import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '@swift-shop/backend/auth';
import { EmployeeAuthAuditService } from './employee-auth-audit.service';
import { EmployeeService } from './employee.service';

@Injectable()
export class EmployeeTwoFactorFlowService {
  constructor(
    private readonly employeeService: EmployeeService,
    private readonly authService: AuthService,
    private readonly auditService: EmployeeAuthAuditService,
  ) {}

  async generate(employeeId: string) {
    const employee = await this.employeeOrThrow(employeeId);
    const { secret, otpauthUrl } = this.authService.generateTwoFactorSecret(
      employee.email,
    );
    const qrCodeUrl = await this.authService.generateQrCodeDataURL(otpauthUrl);
    await this.employeeService.update(employee.id, {
      twoFactorSecret: secret,
      twoFactorEnabled: false,
    });
    await this.auditService.auditEmployeeAction(
      'employee.2fa_setup_started',
      employee.id,
    );
    return { secret, qrCodeUrl };
  }

  async enable(employeeId: string, totp: string) {
    const employee = await this.employeeOrThrow(employeeId);
    if (!employee.twoFactorSecret) {
      throw new UnauthorizedException('Two-factor setup required');
    }
    this.assertValidTotp(employee.twoFactorSecret, totp);
    const updated = await this.employeeService.update(employee.id, {
      twoFactorEnabled: true,
    });
    await this.auditService.auditEmployeeAction(
      'employee.2fa_enabled',
      employee.id,
    );
    return updated;
  }

  async disable(employeeId: string, totp: string) {
    const employee = await this.employeeOrThrow(employeeId);
    if (!employee.twoFactorSecret) {
      throw new UnauthorizedException('Two-factor is not enabled');
    }
    this.assertValidTotp(employee.twoFactorSecret, totp);
    const updated = await this.employeeService.update(employee.id, {
      twoFactorSecret: null,
      twoFactorEnabled: false,
    });
    await this.auditService.auditEmployeeAction(
      'employee.2fa_disabled',
      employee.id,
    );
    return updated;
  }

  private async employeeOrThrow(id: string) {
    const employee = await this.employeeService.findById(id);
    if (!employee) throw new UnauthorizedException('Employee not found');
    return employee;
  }

  private assertValidTotp(secret: string, totp: string) {
    if (!this.authService.verifyTwoFactorToken(secret, totp)) {
      throw new UnauthorizedException('Invalid two-factor token');
    }
  }
}
