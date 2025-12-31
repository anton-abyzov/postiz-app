/**
 * Configuration Module
 *
 * Provides centralized configuration management across the application.
 */

import { Global, Module } from '@nestjs/common';
import { AppConfigService } from './app.config';

@Global()
@Module({
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
