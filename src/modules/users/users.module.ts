import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { PasswordService } from '../auth/password.service';
import { RolesModule } from '../roles/roles.module';

import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  imports: [AuditModule, RolesModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, PasswordService],
  exports: [UsersService],
})
export class UsersModule {}
