import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { HealthController } from './health.controller';
import {
  HealthCheckService,
  MemoryHealthIndicator,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '@swift-shop/data-access-prisma';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckServiceMock: Mocked<HealthCheckService>;
  let memoryHealthIndicatorMock: Mocked<MemoryHealthIndicator>;
  let prismaHealthIndicatorMock: Mocked<PrismaHealthIndicator>;
  let prismaMock: PrismaService;

  beforeEach(() => {
    healthCheckServiceMock = {
      check: vi.fn(),
    } as unknown as Mocked<HealthCheckService>;

    memoryHealthIndicatorMock = {
      checkHeap: vi.fn(),
    } as unknown as Mocked<MemoryHealthIndicator>;

    prismaHealthIndicatorMock = {
      pingCheck: vi.fn(),
    } as unknown as Mocked<PrismaHealthIndicator>;

    prismaMock = {} as PrismaService;

    controller = new HealthController(
      healthCheckServiceMock,
      memoryHealthIndicatorMock,
      prismaHealthIndicatorMock,
      prismaMock,
    );
  });

  it('GET /api/health — returns UP status when DB and Memory checks pass', async () => {
    const expectedResponse = {
      status: 'ok',
      info: {
        memory_heap: { status: 'up' },
        database: { status: 'up' },
      },
      error: {},
      details: {
        memory_heap: { status: 'up' },
        database: { status: 'up' },
      },
    };

    healthCheckServiceMock.check.mockImplementation(async (indicators) => {
      for (const indicator of indicators) {
        await indicator();
      }
      return expectedResponse as never;
    });

    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(healthCheckServiceMock.check).toHaveBeenCalled();
  });

  it('GET /api/health — returns DOWN status when DB check fails', async () => {
    healthCheckServiceMock.check.mockRejectedValue({
      status: 'error',
      error: { database: { status: 'down', message: 'Connection timeout' } },
    });

    await expect(controller.check()).rejects.toEqual(
      expect.objectContaining({
        status: 'error',
      }),
    );
  });
});
