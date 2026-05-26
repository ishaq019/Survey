const normalizeBasePath = (value) => {
  const raw = String(value || '/survey').trim();

  if (!raw || raw === '/') {
    return '/';
  }

  return `/${raw.replace(/^\/+|\/+$/g, '')}`;
};

export const APP_BASE_PATH = normalizeBasePath(import.meta.env.VITE_APP_BASE_PATH || '/survey');

export const buildAppPath = (path = '') => {
  const normalizedPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';

  if (APP_BASE_PATH === '/') {
    return normalizedPath || '/';
  }

  if (!normalizedPath) {
    return APP_BASE_PATH;
  }

  return `${APP_BASE_PATH}${normalizedPath}`;
};

export const buildAppUrl = (path = '') => {
  if (typeof window === 'undefined') {
    return buildAppPath(path);
  }

  return new URL(buildAppPath(path), window.location.origin).toString();
};