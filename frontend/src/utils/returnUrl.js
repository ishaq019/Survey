export const getReturnUrl = (fallbackPath = '/') => {
  const params = new URLSearchParams(window.location.search);
  const returnUrl = params.get('returnUrl');

  if (returnUrl) {
    try {
      return new URL(returnUrl).toString();
    } catch (_error) {
      // ignore invalid returnUrl and use fallback
    }
  }

  return new URL(fallbackPath, window.location.origin).toString();
};

export const redirectToReturnUrl = (fallbackPath = '/') => {
  window.location.href = getReturnUrl(fallbackPath);
};
