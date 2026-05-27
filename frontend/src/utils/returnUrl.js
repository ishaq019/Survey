import { QUIZ_APP_URL } from '../config/api';

const safeAbsoluteUrl = (url) => {
  try {
    return new URL(url).toString();
  } catch (_error) {
    return null;
  }
};

export const getReturnUrl = (fallbackPath = '/') => {
  const params = new URLSearchParams(window.location.search);
  const returnUrl = params.get('returnUrl');
  const safeReturnUrl = returnUrl ? safeAbsoluteUrl(returnUrl) : null;

  if (safeReturnUrl) {
    return safeReturnUrl;
  }

  return new URL(fallbackPath, QUIZ_APP_URL).toString();
};

export const redirectToReturnUrl = (fallbackPath = '/') => {
  window.location.href = getReturnUrl(fallbackPath);
};