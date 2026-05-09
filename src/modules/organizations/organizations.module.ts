import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { RolesModule } from '../roles/roles.module';

import { OrganizationsController } from './organizations.controller';
import { OrganizationsRepository } from './organizations.repository';
import { OrganizationsService } from './organizations.service';

@Module({
  imports: [AuditModule, RolesModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, OrganizationsRepository],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
