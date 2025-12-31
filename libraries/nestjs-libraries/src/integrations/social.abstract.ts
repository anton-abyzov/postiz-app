/**
 * Social Media Integration Abstract Base Class
 *
 * Provides common functionality for all social media integrations including:
 * - HTTP request handling with retry logic
 * - Rate limiting and concurrency control
 * - Token refresh detection
 * - Error handling and classification
 * - Scope validation
 */

import { timer } from '@gitroom/helpers/utils/timer';
import { concurrency } from '@gitroom/helpers/utils/concurrency.service';
import { Integration } from '@prisma/client';
import { Logger } from '@nestjs/common';

/**
 * Error classification types for API responses
 */
export type ErrorHandleType = 'refresh-token' | 'bad-body' | 'retry';

/**
 * Result of error classification
 */
export interface ErrorHandleResult {
  type: ErrorHandleType;
  value: string;
}

/**
 * Mention search result
 */
export interface MentionSearchResult {
  id: string;
  label: string;
  image: string;
  doNotCache?: boolean;
}

/**
 * Mention search response - either results or indicator that mentions aren't supported
 */
export type MentionResponse = MentionSearchResult[] | { none: true };

/**
 * Concurrent operation result with optional error info
 */
interface ConcurrentResult<T> {
  err?: boolean;
  type?: ErrorHandleType;
  value?: string;
  data?: T;
}

/**
 * Thrown when a token refresh is required
 */
export class RefreshToken extends Error {
  public readonly identifier: string;
  public readonly json: string;
  public readonly body: BodyInit | undefined;

  constructor(
    identifier: string,
    json: string,
    body: BodyInit | undefined,
    message = 'Token refresh required'
  ) {
    super(message);
    this.name = 'RefreshToken';
    this.identifier = identifier;
    this.json = json;
    this.body = body;
  }
}

/**
 * Thrown when the request body or response is invalid
 */
export class BadBody extends Error {
  public readonly identifier: string;
  public readonly json: string;
  public readonly body: BodyInit | undefined;

  constructor(
    identifier: string,
    json: string,
    body: BodyInit | undefined,
    message = 'Bad request body'
  ) {
    super(message);
    this.name = 'BadBody';
    this.identifier = identifier;
    this.json = json;
    this.body = body;
  }
}

/**
 * Thrown when OAuth scopes are insufficient
 */
export class NotEnoughScopes extends Error {
  constructor(message = 'Not enough scopes') {
    super(message);
    this.name = 'NotEnoughScopes';
  }
}

/**
 * Abstract base class for social media integrations
 *
 * All social provider implementations should extend this class
 * to get consistent HTTP handling, error management, and rate limiting.
 */
export abstract class SocialAbstract {
  /**
   * Unique identifier for this social provider (e.g., 'linkedin', 'twitter')
   */
  abstract identifier: string;

  /**
   * Maximum concurrent API requests for this provider
   * Override in subclass if provider has specific rate limits
   */
  protected maxConcurrentJob = 1;

  /**
   * Logger instance for this provider
   */
  protected readonly logger = new Logger(this.constructor.name);

  /**
   * Default timeout for API requests in milliseconds
   */
  protected readonly defaultTimeout = 30000;

  /**
   * Maximum retry attempts for failed requests
   */
  protected readonly maxRetries = 3;

  /**
   * Delay between retries in milliseconds
   */
  protected readonly retryDelay = 5000;

  /**
   * Classify an error response from the API
   *
   * Override in subclass to handle provider-specific error responses.
   *
   * @param body - The response body as a string
   * @returns Error classification or undefined if unhandled
   */
  public handleErrors(body: string): ErrorHandleResult | undefined {
    return undefined;
  }

  /**
   * Search for mentionable users/accounts
   *
   * Override in subclass if provider supports mentions.
   *
   * @param token - Access token for API calls
   * @param data - Query parameters including search query
   * @param id - Internal ID of the integration
   * @param integration - Full integration entity
   * @returns Array of mention results or { none: true } if not supported
   */
  public async mention(
    token: string,
    data: { query: string },
    id: string,
    integration: Integration
  ): Promise<MentionResponse> {
    return { none: true };
  }

  /**
   * Execute a function with concurrency control
   *
   * Wraps the function execution with rate limiting based on maxConcurrentJob.
   *
   * @param func - Async function to execute
   * @param ignoreConcurrency - Skip concurrency control if true
   * @returns Result of the function
   * @throws BadBody if the function fails with a classifiable error
   */
  async runInConcurrent<T>(
    func: () => Promise<T>,
    ignoreConcurrency?: boolean
  ): Promise<T> {
    const result = await concurrency<ConcurrentResult<T> | T>(
      this.identifier,
      this.maxConcurrentJob,
      async () => {
        try {
          return await func();
        } catch (err) {
          this.logger.debug(`Concurrent operation failed: ${String(err)}`);
          const handle = this.handleErrors(JSON.stringify(err));
          return { err: true, ...(handle || {}) } as ConcurrentResult<T>;
        }
      },
      ignoreConcurrency
    );

    // Check if result is an error wrapper
    if (
      result &&
      typeof result === 'object' &&
      'err' in result &&
      result.err &&
      'value' in result
    ) {
      const errorResult = result as ConcurrentResult<T>;
      throw new BadBody('', '{}', undefined, errorResult.value || '');
    }

    return result as T;
  }

  /**
   * Make an HTTP request with retry logic and error handling
   *
   * Handles:
   * - Rate limiting (429) with automatic retry
   * - Server errors (500) with automatic retry
   * - Token expiration (401) throwing RefreshToken
   * - Other errors classified via handleErrors()
   *
   * @param url - Request URL
   * @param options - Fetch options
   * @param identifier - Optional identifier for error context
   * @param totalRetries - Current retry count (internal)
   * @param ignoreConcurrency - Skip concurrency control
   * @returns Response object if successful
   * @throws RefreshToken if token needs refresh
   * @throws BadBody for other API errors
   */
  async fetch(
    url: string,
    options: RequestInit = {},
    identifier = '',
    totalRetries = 0,
    ignoreConcurrency = false
  ): Promise<Response> {
    const request = await concurrency(
      this.identifier,
      this.maxConcurrentJob,
      () => fetch(url, options),
      ignoreConcurrency
    );

    // Success responses
    if (request.status === 200 || request.status === 201) {
      return request;
    }

    // Max retries exceeded
    if (totalRetries >= this.maxRetries) {
      this.logger.warn(
        `Max retries (${this.maxRetries}) exceeded for ${url}`
      );
      throw new BadBody(identifier, '{}', options.body);
    }

    // Try to get response body for error classification
    let responseText = '{}';
    try {
      responseText = await request.text();
    } catch {
      // Keep default empty JSON if body read fails
    }

    // Rate limiting - retry with backoff
    if (
      request.status === 429 ||
      request.status === 500 ||
      responseText.includes('rate_limit_exceeded') ||
      responseText.includes('Rate limit')
    ) {
      this.logger.debug(
        `Rate limit hit, retrying in ${this.retryDelay}ms (attempt ${totalRetries + 1})`
      );
      await timer(this.retryDelay);
      return this.fetch(
        url,
        options,
        identifier,
        totalRetries + 1,
        ignoreConcurrency
      );
    }

    // Check for provider-specific error handling
    const handleError = this.handleErrors(responseText);

    // Retry if handler says so
    if (handleError?.type === 'retry') {
      this.logger.debug(
        `Retrying request per handleErrors (attempt ${totalRetries + 1})`
      );
      await timer(this.retryDelay);
      return this.fetch(
        url,
        options,
        identifier,
        totalRetries + 1,
        ignoreConcurrency
      );
    }

    // Token refresh needed
    if (
      request.status === 401 &&
      (handleError?.type === 'refresh-token' || !handleError)
    ) {
      throw new RefreshToken(
        identifier,
        responseText,
        options.body,
        handleError?.value
      );
    }

    // Other errors
    throw new BadBody(
      identifier,
      responseText,
      options.body,
      handleError?.value || ''
    );
  }

  /**
   * Validate OAuth scopes
   *
   * Checks that all required scopes are present in the granted scopes.
   *
   * @param required - Array of required scope strings
   * @param got - Granted scopes as array or comma/space-separated string
   * @returns true if all required scopes are present
   * @throws NotEnoughScopes if any required scope is missing
   */
  checkScopes(required: string[], got: string | string[]): boolean {
    const grantedScopes = this.normalizeScopes(got);

    const missingScopes = required.filter(
      (scope) => !grantedScopes.includes(scope)
    );

    if (missingScopes.length > 0) {
      this.logger.debug(
        `Missing scopes: ${missingScopes.join(', ')}. Got: ${grantedScopes.join(', ')}`
      );
      throw new NotEnoughScopes(
        `Missing required scopes: ${missingScopes.join(', ')}`
      );
    }

    return true;
  }

  /**
   * Normalize scopes to an array
   *
   * @param scopes - Scopes as array or string
   * @returns Array of scope strings
   */
  protected normalizeScopes(scopes: string | string[]): string[] {
    if (Array.isArray(scopes)) {
      return scopes;
    }

    const decoded = decodeURIComponent(scopes);
    const delimiter = decoded.includes(',') ? ',' : ' ';
    return decoded.split(delimiter).map((s) => s.trim()).filter(Boolean);
  }

  /**
   * Make a JSON API request
   *
   * Convenience wrapper around fetch() for JSON APIs.
   *
   * @param url - Request URL
   * @param method - HTTP method
   * @param body - Request body (will be JSON stringified)
   * @param headers - Additional headers
   * @param identifier - Optional identifier for error context
   * @returns Parsed JSON response
   */
  async fetchJson<T = unknown>(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
    body?: Record<string, unknown>,
    headers: Record<string, string> = {},
    identifier = ''
  ): Promise<T> {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await this.fetch(url, options, identifier);
    return response.json() as Promise<T>;
  }

  /**
   * Build URL with query parameters
   *
   * @param baseUrl - Base URL
   * @param params - Query parameters
   * @returns URL with query string
   */
  protected buildUrl(
    baseUrl: string,
    params: Record<string, string | number | boolean | undefined>
  ): string {
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
    return url.toString();
  }

  /**
   * Format Bearer token header
   *
   * @param token - Access token
   * @returns Authorization header value
   */
  protected bearerAuth(token: string): string {
    return `Bearer ${token}`;
  }

  /**
   * Create common headers with Bearer auth
   *
   * @param token - Access token
   * @param additional - Additional headers
   * @returns Headers object
   */
  protected createAuthHeaders(
    token: string,
    additional: Record<string, string> = {}
  ): Record<string, string> {
    return {
      Authorization: this.bearerAuth(token),
      'Content-Type': 'application/json',
      ...additional,
    };
  }
}
