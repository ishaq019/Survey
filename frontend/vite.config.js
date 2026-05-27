import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const normalizeBase = (value) => {
  const raw = String(value || '/Survey').trim();

  if (raw === './' || raw === '/') {
    return raw;
  }

  return `/${raw.replace(/^\/+|\/+$/g, '')}/`;
};

export default defineConfig({
  base: "/Survey/",
  plugins: [react()],
});
