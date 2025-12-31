/**
 * Common shared types used across the application
 * These types replace scattered 'any' usages with proper type definitions
 */

import { Integration, Organization, Post, User, Media } from '@prisma/client';

/**
 * HTTP Request context for middleware/controllers
 */
export interface TypedRequest<TBody = unknown, TQuery = unknown, TParams = unknown> {
  body: TBody;
  query: TQuery;
  params: TParams;
  user?: UserContext;
  organization?: OrganizationContext;
}

/**
 * User context attached to authenticated requests
 */
export interface UserContext {
  id: string;
  email: string;
  isSuperAdmin?: boolean;
  allowedOrganizations?: string[];
}

/**
 * Organization context attached to requests
 */
export interface OrganizationContext {
  id: string;
  name: string;
  allowTrial?: boolean;
  tier?: string;
  totalChannels?: number;
}

/**
 * Post with optional relations
 */
export interface PostWithRelations extends Post {
  integration?: Integration;
  childrenPost?: Post[];
  media?: Media[];
  submittedForOrder?: OrderWithItems;
}

/**
 * Order with nested items
 */
export interface OrderWithItems {
  id: string;
  messageGroupId: string;
  captureId?: string | null;
  ordersItems: OrderItem[];
  posts: Post[];
  seller: {
    id: string;
    account?: string | null;
  };
}

/**
 * Order item structure
 */
export interface OrderItem {
  id: string;
  integrationId: string;
  quantity: number;
  price: number;
}

/**
 * Plug settings parsed from post settings
 */
export interface ParsedPlugSettings {
  name: string;
  integrations?: { id: string }[];
  delay?: string;
  active?: boolean;
  [key: string]: unknown;
}

/**
 * Plug trigger configuration
 */
export interface PlugTrigger {
  name: string;
  integrations: { id: string }[];
  delay: string;
  active: boolean;
}

/**
 * Media item for posts
 */
export interface MediaItem {
  id?: string;
  path: string;
  url?: string;
  name?: string;
  type: 'image' | 'video';
}

/**
 * Image list item from post data
 */
export interface ImageListItem {
  id?: string;
  path?: string;
  url?: string;
  name?: string;
}

/**
 * Social post settings base interface
 */
export interface BasePostSettings {
  __type: string;
  title?: string;
  tags?: string[];
  [key: string]: unknown;
}

/**
 * Platform-specific post settings
 */
export interface RedditPostSettings extends BasePostSettings {
  __type: 'reddit';
  subreddit: string[];
}

export interface LinkedInPostSettings extends BasePostSettings {
  __type: 'linkedin' | 'linkedin-page';
  visibility?: 'PUBLIC' | 'CONNECTIONS';
}

export interface XPostSettings extends BasePostSettings {
  __type: 'x';
  replySettings?: 'everyone' | 'followers' | 'mentions';
}

/**
 * Union type for all post settings
 */
export type PostSettings =
  | RedditPostSettings
  | LinkedInPostSettings
  | XPostSettings
  | BasePostSettings;

/**
 * Worker job payload types
 */
export interface PostJobPayload {
  id: string;
  delay?: number;
}

export interface PlugJobPayload {
  plugId: string;
  postId: string;
  delay: number;
  totalRuns: number;
  currentRun: number;
}

export interface InternalPlugJobPayload {
  post: string;
  originalIntegration: string;
  integration: string;
  plugName: string;
  orgId: string;
  delay: number;
  information: PlugTrigger;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

/**
 * API Error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Response metadata for pagination
 */
export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Date range filter
 */
export interface DateRangeFilter {
  start: Date | string;
  end: Date | string;
}

/**
 * Sort parameters
 */
export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

/**
 * Generic filter parameters
 */
export interface FilterParams {
  pagination?: PaginationParams;
  dateRange?: DateRangeFilter;
  sort?: SortParams;
  search?: string;
}

/**
 * Webhook payload structure
 */
export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
  organizationId: string;
}

/**
 * Notification types
 */
export type NotificationType = 'success' | 'fail' | 'info' | 'warning';

/**
 * Notification payload
 */
export interface NotificationPayload {
  title: string;
  content: string;
  type: NotificationType;
  showInApp?: boolean;
  sendEmail?: boolean;
}

/**
 * Token refresh result
 */
export interface TokenRefreshResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

/**
 * Type guard for checking if value is defined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard for checking if object has property
 */
export function hasProperty<T extends object, K extends string>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj;
}
