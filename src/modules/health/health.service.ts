import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  live() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async ready() {
    await this.prisma.$queryRaw`SELECT 1`;
    return {
      status: 'ready',
      dependencies: {
        database: 'ok',
      },
      timestamp: new Date().toISOString(),
    };
  }

  metrics() {
    const uptimeSeconds = Math.round(process.uptime());
    return [
      '# HELP iam_process_uptime_seconds Process uptime in seconds.',
      '# TYPE iam_process_uptime_seconds gauge',
      `iam_process_uptime_seconds ${uptimeSeconds}`,
    ].join('\n');
  }
}
