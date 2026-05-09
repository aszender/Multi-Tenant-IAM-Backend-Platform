import { Module } from '@nestjs/common';

import { UsersModule } from '../users/users.module';

import { MembershipsController } from './memberships.controller';

@Module({
  imports: [UsersModule],
  controllers: [MembershipsController],
})
export class MembershipsModule {}
