import { Controller, Get, Header } from '@nestjs/common';

import { HealthService } from './health.service';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  health() {
    return this.healthService.live();
  }

  @Get('health/live')
  live() {
    return this.healthService.live();
  }

  @Get('health/ready')
  ready() {
    return this.healthService.ready();
  }

  @Get('metrics')
  @Header('content-type', 'text/plain; version=0.0.4')
  metrics() {
    return this.healthService.metrics();
  }
}
