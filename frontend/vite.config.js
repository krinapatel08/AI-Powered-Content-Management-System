// vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'; // Import the Tailwind plugin

export default defineConfig({
  plugins: [
    react(),          // Keep the React plugin
    tailwindcss(),    // Add the Tailwind CSS plugin
  ],
  server: {
    // CRITICAL line for Codespaces/Gitpod host access
    host: '0.0.0.0', 
    
    port: 3000,
  },
});