/**
 * Domain-specific exception classes
 * These provide proper error context and typing instead of generic Error throws
 */

import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base class for all domain exceptions
 */
export abstract class DomainException extends HttpException {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    status: HttpStatus,
    details?: Record<string, unknown>
  ) {
    super(
      {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
      },
      status
    );
    this.code = code;
    this.details = details;
  }
}

/**
 * Thrown when an entity is not found
 */
export class EntityNotFoundException extends DomainException {
  constructor(
    entityType: string,
    identifier: string | Record<string, unknown>,
    details?: Record<string, unknown>
  ) {
    const id = typeof identifier === 'string' ? identifier : JSON.stringify(identifier);
    super(
      `${entityType} with identifier '${id}' was not found`,
      'ENTITY_NOT_FOUND',
      HttpStatus.NOT_FOUND,
      { entityType, identifier, ...details }
    );
  }
}

/**
 * Thrown when an integration is not found
 */
export class IntegrationNotFoundException extends EntityNotFoundException {
  constructor(integrationId: string, organizationId?: string) {
    super('Integration', integrationId, { organizationId });
  }
}

/**
 * Thrown when a post is not found
 */
export class PostNotFoundException extends EntityNotFoundException {
  constructor(postId: string, organizationId?: string) {
    super('Post', postId, { organizationId });
  }
}

/**
 * Thrown when an organization is not found
 */
export class OrganizationNotFoundException extends EntityNotFoundException {
  constructor(organizationId: string) {
    super('Organization', organizationId);
  }
}

/**
 * Thrown when a user is not found
 */
export class UserNotFoundException extends EntityNotFoundException {
  constructor(userId: string) {
    super('User', userId);
  }
}

/**
 * Thrown when user doesn't have permission for an action
 */
export class UnauthorizedAccessException extends DomainException {
  constructor(
    resource: string,
    action: string,
    details?: Record<string, unknown>
  ) {
    super(
      `You do not have permission to ${action} this ${resource}`,
      'UNAUTHORIZED_ACCESS',
      HttpStatus.FORBIDDEN,
      { resource, action, ...details }
    );
  }
}

/**
 * Thrown when user is not part of an organization
 */
export class NotOrganizationMemberException extends DomainException {
  constructor(userId: string, organizationId: string) {
    super(
      'User is not a member of this organization',
      'NOT_ORGANIZATION_MEMBER',
      HttpStatus.FORBIDDEN,
      { userId, organizationId }
    );
  }
}

/**
 * Thrown when a social media API call fails
 */
export class SocialMediaApiException extends DomainException {
  public readonly provider: string;
  public readonly apiResponse?: unknown;

  constructor(
    provider: string,
    message: string,
    apiResponse?: unknown,
    details?: Record<string, unknown>
  ) {
    super(
      `${provider} API error: ${message}`,
      'SOCIAL_MEDIA_API_ERROR',
      HttpStatus.BAD_GATEWAY,
      { provider, apiResponse, ...details }
    );
    this.provider = provider;
    this.apiResponse = apiResponse;
  }
}

/**
 * Thrown when token refresh is needed
 */
export class TokenRefreshRequiredException extends DomainException {
  public readonly provider: string;
  public readonly integrationId: string;

  constructor(
    provider: string,
    integrationId: string,
    message = 'Token refresh required'
  ) {
    super(
      message,
      'TOKEN_REFRESH_REQUIRED',
      HttpStatus.UNAUTHORIZED,
      { provider, integrationId }
    );
    this.provider = provider;
    this.integrationId = integrationId;
  }
}

/**
 * Thrown when token refresh fails
 */
export class TokenRefreshFailedException extends DomainException {
  constructor(
    provider: string,
    integrationId: string,
    originalError?: string
  ) {
    super(
      `Failed to refresh token for ${provider}`,
      'TOKEN_REFRESH_FAILED',
      HttpStatus.UNAUTHORIZED,
      { provider, integrationId, originalError }
    );
  }
}

/**
 * Thrown when posting to social media fails
 */
export class PostingFailedException extends DomainException {
  constructor(
    provider: string,
    reason: string,
    postId?: string,
    apiResponse?: unknown
  ) {
    super(
      `Failed to post to ${provider}: ${reason}`,
      'POSTING_FAILED',
      HttpStatus.BAD_REQUEST,
      { provider, reason, postId, apiResponse }
    );
  }
}

/**
 * Thrown when media processing fails
 */
export class MediaProcessingException extends DomainException {
  constructor(
    reason: string,
    mediaId?: string,
    mediaType?: string
  ) {
    super(
      `Media processing failed: ${reason}`,
      'MEDIA_PROCESSING_FAILED',
      HttpStatus.BAD_REQUEST,
      { mediaId, mediaType, reason }
    );
  }
}

/**
 * Thrown when payment/subscription fails
 */
export class PaymentException extends DomainException {
  constructor(
    reason: string,
    details?: Record<string, unknown>
  ) {
    super(
      `Payment error: ${reason}`,
      'PAYMENT_ERROR',
      HttpStatus.PAYMENT_REQUIRED,
      details
    );
  }
}

/**
 * Thrown when subscription limit is reached
 */
export class SubscriptionLimitException extends DomainException {
  constructor(
    limitType: string,
    currentValue: number,
    maxValue: number
  ) {
    super(
      `Subscription limit reached for ${limitType}: ${currentValue}/${maxValue}`,
      'SUBSCRIPTION_LIMIT_EXCEEDED',
      HttpStatus.PAYMENT_REQUIRED,
      { limitType, currentValue, maxValue }
    );
  }
}

/**
 * Thrown when validation fails
 */
export class ValidationException extends DomainException {
  constructor(
    field: string,
    reason: string,
    value?: unknown
  ) {
    super(
      `Validation failed for ${field}: ${reason}`,
      'VALIDATION_ERROR',
      HttpStatus.BAD_REQUEST,
      { field, reason, value }
    );
  }
}

/**
 * Thrown when a required configuration is missing
 */
export class ConfigurationException extends DomainException {
  constructor(
    configKey: string,
    message = 'Required configuration is missing'
  ) {
    super(
      `${message}: ${configKey}`,
      'CONFIGURATION_ERROR',
      HttpStatus.INTERNAL_SERVER_ERROR,
      { configKey }
    );
  }
}

/**
 * Thrown when rate limit is exceeded
 */
export class RateLimitException extends DomainException {
  constructor(
    resource: string,
    retryAfter?: number
  ) {
    super(
      `Rate limit exceeded for ${resource}`,
      'RATE_LIMIT_EXCEEDED',
      HttpStatus.TOO_MANY_REQUESTS,
      { resource, retryAfter }
    );
  }
}

/**
 * Thrown when a duplicate entity is detected
 */
export class DuplicateEntityException extends DomainException {
  constructor(
    entityType: string,
    field: string,
    value: string
  ) {
    super(
      `${entityType} with ${field} '${value}' already exists`,
      'DUPLICATE_ENTITY',
      HttpStatus.CONFLICT,
      { entityType, field, value }
    );
  }
}

/**
 * Thrown when OAuth scopes are insufficient
 */
export class InsufficientScopesException extends DomainException {
  constructor(
    provider: string,
    requiredScopes: string[],
    grantedScopes?: string[]
  ) {
    super(
      `Insufficient OAuth scopes for ${provider}. Required: ${requiredScopes.join(', ')}`,
      'INSUFFICIENT_SCOPES',
      HttpStatus.FORBIDDEN,
      { provider, requiredScopes, grantedScopes }
    );
  }
}

/**
 * Thrown when an integration is disabled
 */
export class IntegrationDisabledException extends DomainException {
  constructor(
    provider: string,
    integrationId: string,
    reason?: string
  ) {
    super(
      `Integration ${provider} is disabled${reason ? `: ${reason}` : ''}`,
      'INTEGRATION_DISABLED',
      HttpStatus.BAD_REQUEST,
      { provider, integrationId, reason }
    );
  }
}

/**
 * Thrown when webhook delivery fails
 */
export class WebhookDeliveryException extends DomainException {
  constructor(
    webhookUrl: string,
    statusCode?: number,
    responseBody?: string
  ) {
    super(
      `Failed to deliver webhook to ${webhookUrl}`,
      'WEBHOOK_DELIVERY_FAILED',
      HttpStatus.BAD_GATEWAY,
      { webhookUrl, statusCode, responseBody }
    );
  }
}

/**
 * Thrown when external service is unavailable
 */
export class ExternalServiceException extends DomainException {
  constructor(
    serviceName: string,
    statusCode?: number,
    message = 'External service unavailable'
  ) {
    super(
      `${serviceName}: ${message}`,
      'EXTERNAL_SERVICE_ERROR',
      HttpStatus.SERVICE_UNAVAILABLE,
      { serviceName, statusCode }
    );
  }
}
