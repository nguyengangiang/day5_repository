import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server proxies API calls to the Express server on :3000 so the React app
// and the API can run side by side during development.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/work-orders': 'http://localhost:3000',
    },
  },
});
