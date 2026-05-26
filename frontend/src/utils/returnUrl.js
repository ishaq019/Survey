const QUIZ_APP_URL = 'https://ishaq019.github.io/quiz-application';

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

  return new URL(fallbackPath, QUIZ_APP_URL).toString();
};

export const redirectToReturnUrl = (fallbackPath = '/') => {
  window.location.href = getReturnUrl(fallbackPath);
};
