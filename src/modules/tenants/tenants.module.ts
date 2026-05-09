import { Module } from '@nestjs/common';

import { OrganizationsModule } from '../organizations/organizations.module';

import { TenantsController } from './tenants.controller';

@Module({
  imports: [OrganizationsModule],
  controllers: [TenantsController],
})
export class TenantsModule {}
