import { Module } from '@nestjs/common';

import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { RolesGuard } from './common/guards/roles.guard';

import { AppController } from './app.controller';

@Module({
  imports: [AppConfigModule, DatabaseModule, AuthModule, OrganizationsModule, ProjectsModule],
  controllers: [AppController],
  providers: [RolesGuard],
})
export class AppModule {}

