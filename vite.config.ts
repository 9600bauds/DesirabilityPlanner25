import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react'; // Import the React plugin

// https://vitejs.dev/config/
export default defineConfig({
  base: '/DesirabilityPlanner25/',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 5173, // Default Vite port
  },
});
