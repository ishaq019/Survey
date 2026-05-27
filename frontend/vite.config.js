import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const normalizeBase = (value) => {
  const raw = String(value || '/survey').trim();

  if (raw === './' || raw === '/') {
    return raw;
  }

  return `/${raw.replace(/^\/+|\/+$/g, '')}/`;
};

export default defineConfig({
  base: normalizeBase(process.env.VITE_APP_BASE_PATH),
  plugins: [react()],
});
