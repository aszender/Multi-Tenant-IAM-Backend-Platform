import { Module } from '@nestjs/common';

import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';

import { AppController } from './app.controller';

@Module({
  imports: [AppConfigModule, DatabaseModule, AuthModule],
  controllers: [AppController],
})
export class AppModule {}

