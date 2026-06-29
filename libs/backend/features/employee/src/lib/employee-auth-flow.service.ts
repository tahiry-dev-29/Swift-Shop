import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '@dima-new/backend/auth';
import { EmployeeAuthAuditService } from './employee-auth-audit.service';
import { EmployeeService } from './employee.service';
import { EmployeeTwoFactorFlowService } from './employee-two-factor-flow.service';
import { EmployeeAuthResponse } from './dto';
import { LoginEmployee, LoginInput } from './employee-auth-flow.types';
import {
  TRUSTED_DEVICE_COOKIE_NAME,
  cookieValue,
  headerValue,
  requestMeta,
  trustedDeviceCookieOptions,
} from './employee-auth-flow.utils';

@Injectable()
export class EmployeeAuthFlowService {
  constructor(
    private readonly employeeService: EmployeeService,
    private readonly authService: AuthService,
    private readonly auditService: EmployeeAuthAuditService,
    private readonly twoFactorFlow: EmployeeTwoFactorFlowService,
  ) {}

  async login(input: LoginInput): Promise<EmployeeAuthResponse> {
    const meta = requestMeta(input.context);
    const employee = await this.authService.validateEmployee(
      input.email,
      input.password,
    );
    if (!employee) {
      await this.authService.audit({
        action: 'employee.login_failed',
        actorType: 'employee',
        metadata: { email: input.email },
        ...meta,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (employee.forcePasswordReset) {
      await this.auditService.auditEmployeeAction(
        'employee.password_reset_required',
        employee.id,
      );
      return { employee, requiresPasswordReset: true };
    }
    const twoFactor = await this.handleTwoFactor(input, employee);
    if (twoFactor) return { requires2FA: twoFactor.requires2FA };

    const token = await this.authService.generateEmployeeToken(employee);
    await this.auditService.auditSuccessfulLogin(employee.id, meta);
    return { ...token, employee };
  }

  async generateTwoFactor(employeeId: string) {
    return this.twoFactorFlow.generate(employeeId);
  }

  async enableTwoFactor(employeeId: string, totp: string) {
    return this.twoFactorFlow.enable(employeeId, totp);
  }

  async disableTwoFactor(employeeId: string, totp: string) {
    return this.twoFactorFlow.disable(employeeId, totp);
  }

  async completeForcedPasswordReset(token: string, password: string) {
    const employee = await this.authService.completeForcedPasswordReset(
      token,
      password,
    );
    if (!employee) throw new UnauthorizedException('Invalid reset token');
    const authToken = await this.authService.generateEmployeeToken(employee);
    await this.auditService.auditEmployeeAction(
      'employee.password_reset_completed',
      employee.id,
    );
    return { ...authToken, employee };
  }

  refreshToken(token: string) {
    return this.authService.refreshToken(token);
  }

  async logout(user: { id: string; jti?: string; exp?: number }) {
    await this.authService.logout(user.id, user.jti, user.exp);
    await this.auditService.auditEmployeeAction('employee.logout', user.id);
    return true;
  }

  private async handleTwoFactor(input: LoginInput, employee: LoginEmployee) {
    if (!employee.twoFactorEnabled) return null;
    const trustedDevice = await this.hasTrustedDevice(input, employee.id);
    if (!trustedDevice && !input.totp) return { employee, requires2FA: true };
    if (
      !trustedDevice &&
      (!employee.twoFactorSecret ||
        !this.authService.verifyTwoFactorToken(
          employee.twoFactorSecret,
          input.totp ?? '',
        ))
    ) {
      await this.auditService.auditEmployeeAction(
        'employee.2fa_failed',
        employee.id,
      );
      throw new UnauthorizedException('Invalid two-factor token');
    }
    await this.rememberDeviceIfRequested(input, employee.id);
    return null;
  }

  private async hasTrustedDevice(input: LoginInput, employeeId: string) {
    const cookieToken = cookieValue(
      headerValue(input.context.req.headers.cookie),
      TRUSTED_DEVICE_COOKIE_NAME,
    );
    return (
      (await this.authService.verifyTrustedEmployeeDevice(
        employeeId,
        input.trustedDeviceToken,
      )) ||
      (await this.authService.verifyTrustedEmployeeDevice(
        employeeId,
        cookieToken,
      ))
    );
  }

  private async rememberDeviceIfRequested(
    input: LoginInput,
    employeeId: string,
  ) {
    if (!input.rememberDevice || !input.context.res) return;
    const deviceToken = await this.authService.trustEmployeeDevice(
      employeeId,
      headerValue(input.context.req.headers['user-agent']),
    );
    input.context.res.cookie(
      TRUSTED_DEVICE_COOKIE_NAME,
      deviceToken,
      trustedDeviceCookieOptions(),
    );
  }
}
