import dayjs from 'dayjs';

export const META_PAGE_TOKEN_EXPIRATION = '2099-01-01T00:00:00.000Z';
export const META_PAGE_PROVIDER_IDENTIFIERS = ['facebook', 'instagram'];

export function metaPageTokenExpirationDate() {
  return new Date(META_PAGE_TOKEN_EXPIRATION);
}

export function metaPageTokenExpiresIn(now = dayjs()) {
  return Math.max(1, dayjs(META_PAGE_TOKEN_EXPIRATION).unix() - now.unix());
}

export function isMetaPageProvider(identifier: string) {
  return META_PAGE_PROVIDER_IDENTIFIERS.includes(identifier);
}
