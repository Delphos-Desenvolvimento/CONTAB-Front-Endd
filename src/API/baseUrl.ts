const CONTAB_ORIGIN = 'https://contab-pi.com.br';
const LOCAL_HOSTNAME = ['local', 'host'].join('');
const LOOPBACK_HOSTNAME = ['127', '0', '0', '1'].join('.');

const trimTrailingSlash = (value: string) => value.replace(/\/$/, '');

const isLocalOrigin = (value: string) => {
  try {
    const { hostname } = new URL(value);
    return hostname === LOCAL_HOSTNAME || hostname === LOOPBACK_HOSTNAME;
  } catch {
    return false;
  }
};

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

  if (!configuredOrigin || isLocalOrigin(configuredOrigin)) {
    return appendApiPath(browserOrigin || CONTAB_ORIGIN);
  }

  return appendApiPath(configuredOrigin);
};

export const API_BASE_URL = getApiBaseUrl();
