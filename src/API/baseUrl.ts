const CONTAB_ORIGIN = 'https://contab-pi.com.br';

const trimTrailingSlash = (value: string) => value.replace(/\/$/, '');

const isLocalhostOrigin = (value: string) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(value);

const appendApiPath = (origin: string) => {
  const normalized = trimTrailingSlash(origin).replace(/\/api$/, '');
  return `${normalized}/api`;
};

export const getApiBaseUrl = () => {
  if (import.meta.env.DEV) {
    return '/api';
  }

  const configuredOrigin = trimTrailingSlash(
    (import.meta.env.VITE_API_URL || '').trim(),
  );
  const browserOrigin =
    typeof window !== 'undefined' ? window.location.origin : CONTAB_ORIGIN;

  if (!configuredOrigin || isLocalhostOrigin(configuredOrigin)) {
    return appendApiPath(browserOrigin || CONTAB_ORIGIN);
  }

  return appendApiPath(configuredOrigin);
};

export const API_BASE_URL = getApiBaseUrl();
