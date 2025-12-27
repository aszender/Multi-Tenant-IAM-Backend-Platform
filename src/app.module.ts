import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { RolesGuard } from './common/guards/roles.guard';
import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    AuthModule,
    OrganizationsModule,
    ProjectsModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [RolesGuard],
})
export class AppModule {}

