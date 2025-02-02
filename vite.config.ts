import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // Import the React plugin

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), // Add the React plugin here
  ],
});
