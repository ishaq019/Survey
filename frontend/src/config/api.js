
const trimTrailingSlash = (value) => String(value || '').replace(/\/+$/g, '');

export const API_URL = trimTrailingSlash(
  import.meta.env.VITE_API_URL || 'https://survey-application-tawny.vercel.app/api'
);

export const QUIZ_APP_URL = trimTrailingSlash(
  import.meta.env.VITE_QUIZ_APP_URL || 'https://syedishaq.me/exam'
);