import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // Import the React plugin

// https://vitejs.dev/config/
export default defineConfig({
  base: '/DesirabilityPlanner25/',
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 5173, // Default Vite port (you can change this if needed)
  },
});
