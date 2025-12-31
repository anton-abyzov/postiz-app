/**
 * Centralized Application Configuration
 *
 * This module provides typed, validated access to all environment variables.
 * It replaces scattered process.env access throughout the codebase.
 */

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigurationException } from '../shared/exceptions/domain.exceptions';

/**
 * Application environment type
 */
export type Environment = 'development' | 'production' | 'test' | 'staging';

/**
 * Storage provider types
 */
export type StorageProvider = 'local' | 's3' | 'cloudflare' | 'gcp';

/**
 * Database configuration
 */
export interface DatabaseConfig {
  url: string;
  poolSize?: number;
}

/**
 * Redis/BullMQ configuration
 */
export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
}

/**
 * Frontend/Backend URL configuration
 */
export interface UrlConfig {
  frontend: string;
  backend: string;
  main?: string;
}

/**
 * Storage configuration
 */
export interface StorageConfig {
  provider: StorageProvider;
  directory: string;
  publicDirectory: string;
  bucket?: string;
  region?: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

/**
 * OAuth provider configuration
 */
export interface OAuthProviderConfig {
  clientId?: string;
  clientSecret?: string;
  enabled: boolean;
}

/**
 * Social media integrations configuration
 */
export interface SocialIntegrationsConfig {
  linkedin: OAuthProviderConfig;
  instagram: OAuthProviderConfig;
  x: OAuthProviderConfig;
  facebook: OAuthProviderConfig;
  youtube: OAuthProviderConfig;
  tiktok: OAuthProviderConfig;
  pinterest: OAuthProviderConfig;
  reddit: OAuthProviderConfig;
  threads: OAuthProviderConfig;
  discord: OAuthProviderConfig;
  slack: OAuthProviderConfig;
  mastodon: OAuthProviderConfig & { url?: string };
  bluesky: OAuthProviderConfig;
  dribbble: OAuthProviderConfig;
}

/**
 * Stripe payment configuration
 */
export interface StripeConfig {
  secretKey?: string;
  publishableKey?: string;
  webhookSecret?: string;
  enabled: boolean;
}

/**
 * Email configuration
 */
export interface EmailConfig {
  provider?: 'resend' | 'sendgrid' | 'smtp';
  apiKey?: string;
  fromAddress?: string;
  fromName?: string;
}

/**
 * OpenAI configuration
 */
export interface OpenAIConfig {
  apiKey?: string;
  model?: string;
  enabled: boolean;
}

/**
 * Sentry configuration
 */
export interface SentryConfig {
  dsn?: string;
  enabled: boolean;
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  jwtSecret: string;
  encryptionKey?: string;
  cookieSecure: boolean;
  corsOrigins: string[];
}

/**
 * Feature flags
 */
export interface FeatureFlags {
  marketplace: boolean;
  analytics: boolean;
  aiGeneration: boolean;
  webhooks: boolean;
  publicApi: boolean;
  xAnalytics: boolean;
}

/**
 * Complete application configuration
 */
export interface AppConfiguration {
  environment: Environment;
  port: number;
  isProduction: boolean;
  isDevelopment: boolean;
  urls: UrlConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  storage: StorageConfig;
  social: SocialIntegrationsConfig;
  stripe: StripeConfig;
  email: EmailConfig;
  openai: OpenAIConfig;
  sentry: SentryConfig;
  security: SecurityConfig;
  features: FeatureFlags;
}

/**
 * Helper to get environment variable with optional default
 */
function getEnv(key: string, defaultValue?: string): string | undefined {
  return process.env[key] ?? defaultValue;
}

/**
 * Helper to get required environment variable
 */
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new ConfigurationException(key, 'Required environment variable is not set');
  }
  return value;
}

/**
 * Helper to get environment variable as number
 */
function getEnvAsNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Helper to get environment variable as boolean
 */
function getEnvAsBoolean(key: string, defaultValue = false): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Check if OAuth provider is configured
 */
function isOAuthConfigured(clientId?: string, clientSecret?: string): boolean {
  return Boolean(clientId && clientSecret);
}

/**
 * Build OAuth provider config
 */
function buildOAuthConfig(clientIdKey: string, clientSecretKey: string): OAuthProviderConfig {
  const clientId = getEnv(clientIdKey);
  const clientSecret = getEnv(clientSecretKey);
  return {
    clientId,
    clientSecret,
    enabled: isOAuthConfigured(clientId, clientSecret),
  };
}

@Injectable()
export class AppConfigService implements OnModuleInit {
  private readonly logger = new Logger(AppConfigService.name);
  private _config: AppConfiguration | null = null;
  private readonly _validationErrors: string[] = [];

  /**
   * Initialize configuration on module load
   */
  onModuleInit(): void {
    this.loadConfiguration();
    this.validateConfiguration();

    if (this._validationErrors.length > 0) {
      this._validationErrors.forEach(error => {
        this.logger.warn(`Configuration warning: ${error}`);
      });
    }
  }

  /**
   * Get the full application configuration
   */
  get config(): AppConfiguration {
    if (!this._config) {
      this.loadConfiguration();
    }
    return this._config!;
  }

  /**
   * Quick accessors for common configs
   */
  get environment(): Environment {
    return this.config.environment;
  }

  get isProduction(): boolean {
    return this.config.isProduction;
  }

  get isDevelopment(): boolean {
    return this.config.isDevelopment;
  }

  get frontendUrl(): string {
    return this.config.urls.frontend;
  }

  get backendUrl(): string {
    return this.config.urls.backend;
  }

  get databaseUrl(): string {
    return this.config.database.url;
  }

  /**
   * Check if a specific social provider is enabled
   */
  isSocialProviderEnabled(provider: keyof SocialIntegrationsConfig): boolean {
    return this.config.social[provider]?.enabled ?? false;
  }

  /**
   * Get OAuth credentials for a provider
   */
  getOAuthCredentials(provider: keyof SocialIntegrationsConfig): OAuthProviderConfig {
    return this.config.social[provider];
  }

  /**
   * Check if Stripe payments are enabled
   */
  isStripeEnabled(): boolean {
    return this.config.stripe.enabled;
  }

  /**
   * Check if AI features are enabled
   */
  isAIEnabled(): boolean {
    return this.config.openai.enabled;
  }

  /**
   * Get validation warnings
   */
  getValidationWarnings(): string[] {
    return [...this._validationErrors];
  }

  /**
   * Load all configuration from environment
   */
  private loadConfiguration(): void {
    const environment = (getEnv('NODE_ENV', 'development') as Environment);
    const isProduction = environment === 'production';
    const notSecured = getEnvAsBoolean('NOT_SECURED');

    this._config = {
      environment,
      port: getEnvAsNumber('PORT', 3000),
      isProduction,
      isDevelopment: environment === 'development',

      urls: {
        frontend: getEnv('FRONTEND_URL', 'http://localhost:4200')!,
        backend: getEnv('BACKEND_URL', 'http://localhost:3000')!,
        main: getEnv('MAIN_URL'),
      },

      database: {
        url: getEnv('DATABASE_URL', '')!,
        poolSize: getEnvAsNumber('DATABASE_POOL_SIZE', 10),
      },

      redis: {
        host: getEnv('REDIS_HOST', 'localhost')!,
        port: getEnvAsNumber('REDIS_PORT', 6379),
        password: getEnv('REDIS_PASSWORD'),
      },

      storage: {
        provider: (getEnv('STORAGE_PROVIDER', 'local') as StorageProvider),
        directory: getEnv('UPLOAD_DIRECTORY', 'uploads')!,
        publicDirectory: getEnv('NEXT_PUBLIC_UPLOAD_STATIC_DIRECTORY', 'uploads')!,
        bucket: getEnv('CLOUDFLARE_BUCKET_NAME') || getEnv('S3_BUCKET'),
        region: getEnv('CLOUDFLARE_REGION') || getEnv('S3_REGION'),
        endpoint: getEnv('CLOUDFLARE_BUCKET_URL') || getEnv('S3_ENDPOINT'),
        accessKeyId: getEnv('CLOUDFLARE_ACCESS_KEY') || getEnv('S3_ACCESS_KEY_ID'),
        secretAccessKey: getEnv('CLOUDFLARE_SECRET_ACCESS_KEY') || getEnv('S3_SECRET_ACCESS_KEY'),
      },

      social: {
        linkedin: buildOAuthConfig('LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'),
        instagram: buildOAuthConfig('INSTAGRAM_APP_ID', 'INSTAGRAM_APP_SECRET'),
        x: buildOAuthConfig('X_CLIENT_ID', 'X_CLIENT_SECRET'),
        facebook: buildOAuthConfig('FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET'),
        youtube: buildOAuthConfig('YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET'),
        tiktok: buildOAuthConfig('TIKTOK_CLIENT_ID', 'TIKTOK_CLIENT_SECRET'),
        pinterest: buildOAuthConfig('PINTEREST_CLIENT_ID', 'PINTEREST_CLIENT_SECRET'),
        reddit: buildOAuthConfig('REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET'),
        threads: buildOAuthConfig('THREADS_APP_ID', 'THREADS_APP_SECRET'),
        discord: buildOAuthConfig('DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET'),
        slack: buildOAuthConfig('SLACK_CLIENT_ID', 'SLACK_CLIENT_SECRET'),
        mastodon: {
          ...buildOAuthConfig('MASTODON_CLIENT_ID', 'MASTODON_CLIENT_SECRET'),
          url: getEnv('MASTODON_URL'),
        },
        bluesky: buildOAuthConfig('BLUESKY_CLIENT_ID', 'BLUESKY_CLIENT_SECRET'),
        dribbble: buildOAuthConfig('DRIBBBLE_CLIENT_ID', 'DRIBBBLE_CLIENT_SECRET'),
      },

      stripe: {
        secretKey: getEnv('STRIPE_SECRET_KEY'),
        publishableKey: getEnv('STRIPE_PUBLISHABLE_KEY'),
        webhookSecret: getEnv('STRIPE_WEBHOOK_SECRET'),
        enabled: Boolean(getEnv('STRIPE_SECRET_KEY')),
      },

      email: {
        provider: getEnv('EMAIL_PROVIDER') as 'resend' | 'sendgrid' | 'smtp' | undefined,
        apiKey: getEnv('RESEND_API_KEY') || getEnv('SENDGRID_API_KEY'),
        fromAddress: getEnv('EMAIL_FROM_ADDRESS'),
        fromName: getEnv('EMAIL_FROM_NAME', 'Postiz'),
      },

      openai: {
        apiKey: getEnv('OPENAI_API_KEY'),
        model: getEnv('OPENAI_MODEL', 'gpt-4o-mini'),
        enabled: Boolean(getEnv('OPENAI_API_KEY')),
      },

      sentry: {
        dsn: getEnv('SENTRY_DSN'),
        enabled: Boolean(getEnv('SENTRY_DSN')),
      },

      security: {
        jwtSecret: getEnv('JWT_SECRET', 'change-me-in-production')!,
        encryptionKey: getEnv('ENCRYPTION_KEY'),
        cookieSecure: isProduction && !notSecured,
        corsOrigins: [
          getEnv('FRONTEND_URL', 'http://localhost:4200')!,
          'http://localhost:6274',
          ...(getEnv('MAIN_URL') ? [getEnv('MAIN_URL')!] : []),
        ],
      },

      features: {
        marketplace: getEnvAsBoolean('ENABLE_MARKETPLACE', true),
        analytics: getEnvAsBoolean('ENABLE_ANALYTICS', true),
        aiGeneration: Boolean(getEnv('OPENAI_API_KEY')),
        webhooks: getEnvAsBoolean('ENABLE_WEBHOOKS', true),
        publicApi: getEnvAsBoolean('ENABLE_PUBLIC_API', true),
        xAnalytics: !getEnvAsBoolean('DISABLE_X_ANALYTICS'),
      },
    };
  }

  /**
   * Validate configuration and collect warnings
   */
  private validateConfiguration(): void {
    this._validationErrors.length = 0;

    // Required in production
    if (this._config?.isProduction) {
      if (!this._config.database.url) {
        this._validationErrors.push('DATABASE_URL is required in production');
      }
      if (this._config.security.jwtSecret === 'change-me-in-production') {
        this._validationErrors.push('JWT_SECRET must be changed in production');
      }
      if (!this._config.security.encryptionKey) {
        this._validationErrors.push('ENCRYPTION_KEY is recommended in production');
      }
    }

    // Warnings for missing optional configs
    if (!this._config?.openai.enabled) {
      this._validationErrors.push('OpenAI not configured - AI features disabled');
    }

    if (!this._config?.stripe.enabled) {
      this._validationErrors.push('Stripe not configured - payments disabled');
    }

    if (!this._config?.email.apiKey) {
      this._validationErrors.push('Email provider not configured - email notifications disabled');
    }

    // Count enabled social providers
    const enabledProviders = Object.values(this._config?.social || {})
      .filter(p => p.enabled).length;

    if (enabledProviders === 0) {
      this._validationErrors.push('No social media providers configured');
    }
  }
}

/**
 * Module-level singleton for use outside DI context
 * Note: Prefer using the injected AppConfigService when possible
 */
let globalConfig: AppConfigService | null = null;

export function getGlobalConfig(): AppConfigService {
  if (!globalConfig) {
    globalConfig = new AppConfigService();
    globalConfig.onModuleInit();
  }
  return globalConfig;
}

/**
 * Quick accessor for configuration (use sparingly, prefer DI)
 */
export function getConfig(): AppConfiguration {
  return getGlobalConfig().config;
}
