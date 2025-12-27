import { Module } from '@nestjs/common';

import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';

import { AppController } from './app.controller';

@Module({
  imports: [AppConfigModule, DatabaseModule, AuthModule, OrganizationsModule],
  controllers: [AppController],
})
export class AppModule {}

