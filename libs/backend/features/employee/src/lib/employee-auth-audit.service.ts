import { Injectable } from '@nestjs/common';
import { AuthService } from '@swift-shop/backend/auth';

type RequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class EmployeeAuthAuditService {
  constructor(private readonly authService: AuthService) {}

  auditEmployeeAction(action: string, employeeId: string) {
    return this.authService.audit({
      action,
      actorType: 'employee',
      actorId: employeeId,
      employeeId,
    });
  }

  async auditSuccessfulLogin(employeeId: string, meta: RequestMeta) {
    const anomaly = await this.authService.detectSessionAnomaly({
      actorType: 'employee',
      actorId: employeeId,
      ...meta,
    });
    await this.authService.audit({
      action: 'employee.login_success',
      actorType: 'employee',
      actorId: employeeId,
      employeeId,
      metadata: {
        sessionAnomaly: anomaly.detected,
        ipAddressChanged: anomaly.ipAddressChanged,
        userAgentChanged: anomaly.userAgentChanged,
      },
      ...meta,
    });
    if (anomaly.detected) {
      await this.authService.audit({
        action: 'employee.session_anomaly',
        actorType: 'employee',
        actorId: employeeId,
        employeeId,
        metadata: anomaly,
        ...meta,
      });
    }
  }
}
