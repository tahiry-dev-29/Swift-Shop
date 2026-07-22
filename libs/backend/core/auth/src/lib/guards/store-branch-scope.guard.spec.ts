import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { StoreBranchScopeGuard } from './store-branch-scope.guard';
import { EmployeeGuard } from './employee-guard';

describe('StoreBranchScopeGuard', () => {
  let guard: StoreBranchScopeGuard;
  let reflectorMock: Mocked<Reflector>;
  let prismaMock: {
    employeeStoreBranch: { count: ReturnType<typeof vi.fn> };
  };
  let mockExecContext: ExecutionContext;

  beforeEach(() => {
    reflectorMock = {
      getAllAndOverride: vi.fn().mockReturnValue({}),
    } as unknown as Mocked<Reflector>;

    prismaMock = {
      employeeStoreBranch: { count: vi.fn() },
    };

    mockExecContext = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
    } as unknown as ExecutionContext;

    guard = new StoreBranchScopeGuard(
      reflectorMock,
      prismaMock as unknown as PrismaService,
    );
  });

  it('should allow SuperAdmin without branch check', async () => {
    vi.spyOn(EmployeeGuard.prototype, 'canActivate').mockResolvedValue(true);
    vi.spyOn(guard as never, 'getRequestAndArgs').mockReturnValue({
      request: {
        user: { id: 'emp-super', type: 'employee', role: 'SuperAdmin' },
      },
      args: { branchId: 'b1' },
    });

    const canActivate = await guard.canActivate(mockExecContext);
    expect(canActivate).toBe(true);
  });

  it('should throw ForbiddenException if user is not employee', async () => {
    vi.spyOn(EmployeeGuard.prototype, 'canActivate').mockResolvedValue(true);
    vi.spyOn(guard as never, 'getRequestAndArgs').mockReturnValue({
      request: { user: { id: 'cust-1', type: 'customer' } },
      args: {},
    });

    await expect(guard.canActivate(mockExecContext)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should throw ForbiddenException if branchId is missing in request', async () => {
    vi.spyOn(EmployeeGuard.prototype, 'canActivate').mockResolvedValue(true);
    vi.spyOn(guard as never, 'getRequestAndArgs').mockReturnValue({
      request: { user: { id: 'emp-1', type: 'employee' } },
      args: {},
    });

    await expect(guard.canActivate(mockExecContext)).rejects.toThrow(
      'Store branch scope is missing',
    );
  });

  it('should allow employee assigned to the specified branch', async () => {
    vi.spyOn(EmployeeGuard.prototype, 'canActivate').mockResolvedValue(true);
    vi.spyOn(guard as never, 'getRequestAndArgs').mockReturnValue({
      request: { user: { id: 'emp-1', type: 'employee' } },
      args: { branchId: 'branch-100' },
    });
    prismaMock.employeeStoreBranch.count.mockResolvedValue(1);

    const canActivate = await guard.canActivate(mockExecContext);
    expect(canActivate).toBe(true);
  });

  it('should deny employee not assigned to the specified branch', async () => {
    vi.spyOn(EmployeeGuard.prototype, 'canActivate').mockResolvedValue(true);
    vi.spyOn(guard as never, 'getRequestAndArgs').mockReturnValue({
      request: { user: { id: 'emp-1', type: 'employee' } },
      args: { branchId: 'branch-forbidden' },
    });
    prismaMock.employeeStoreBranch.count.mockResolvedValue(0);

    await expect(guard.canActivate(mockExecContext)).rejects.toThrow(
      'Store branch access denied',
    );
  });
});
