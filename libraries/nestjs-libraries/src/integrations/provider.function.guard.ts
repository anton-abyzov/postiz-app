import type { Integration } from '@prisma/client';

// These UI selectors predate @Tool. Only their read-only provider methods are
// available to the composer; connection callbacks keep their controlled routes.
const COMPOSER_FUNCTIONS: Record<string, readonly string[]> = {
  facebook: ['pages'],
  instagram: ['pages'],
  gmb: ['pages'],
  youtube: ['pages'],
  'linkedin-page': ['companies'],
  linkedin: ['company'],
  hashnode: ['tags'],
};

const FORBIDDEN_FUNCTIONS = new Set([
  ...Object.getOwnPropertyNames(Object.prototype),
  'prototype',
  'fetchPageInformation',
  'authenticate',
  'generateAuthUrl',
  'refreshToken',
  'reConnect',
  'post',
  'comment',
  'analytics',
  'postAnalytics',
  'fetch',
  'checkScopes',
  'runInConcurrent',
  'externalUrl',
  'changeNickname',
  'changeProfilePicture',
]);

export type ProviderFunction = (
  token: string,
  data: unknown,
  internalId: string,
  integration: Integration
) => unknown | Promise<unknown>;

export function getProviderFunction(
  provider: { identifier: string },
  name: unknown,
  tools: readonly { methodName: string }[] | undefined,
  allowComposerSelectors = false
): ProviderFunction | undefined {
  if (
    typeof name !== 'string' ||
    !/^[A-Za-z][A-Za-z0-9]*$/.test(name) ||
    FORBIDDEN_FUNCTIONS.has(name)
  )
    return undefined;

  const composerMethods = Object.prototype.hasOwnProperty.call(
    COMPOSER_FUNCTIONS,
    provider.identifier
  )
    ? COMPOSER_FUNCTIONS[provider.identifier]
    : [];
  if (
    !tools?.some((tool) => tool.methodName === name) &&
    !(allowComposerSelectors && composerMethods.includes(name))
  )
    return undefined;

  // Inspect value descriptors without evaluating getters or Object.prototype.
  for (
    let current: object | null = provider;
    current && current !== Object.prototype;
    current = Object.getPrototypeOf(current)
  ) {
    const descriptor = Object.getOwnPropertyDescriptor(current, name);
    if (descriptor)
      return typeof descriptor.value === 'function'
        ? (descriptor.value.bind(provider) as ProviderFunction)
        : undefined;
  }
  return undefined;
}

const CREDENTIAL_FIELDS = new Set([
  'token',
  'accesstoken',
  'refreshtoken',
  'idtoken',
  'usertoken',
  'pagetoken',
  'authorization',
  'apikey',
  'clientsecret',
  'password',
  'secret',
  'credentials',
]);

export function stripProviderCredentials(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripProviderCredentials);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([key]) =>
            !CREDENTIAL_FIELDS.has(key.replace(/[-_]/g, '').toLowerCase())
        )
        .map(([key, child]) => [key, stripProviderCredentials(child)])
    );
  }
  return value;
}
