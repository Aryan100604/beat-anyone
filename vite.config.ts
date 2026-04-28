import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    exclude: ['face-api.js'],
  },
});
