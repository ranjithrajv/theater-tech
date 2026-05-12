import { defineConfig } from 'vite-plus';
import wasm from 'vite-plugin-wasm'; // Assuming vite-plugin-wasm is available or can be configured

export default defineConfig({
  root: '.', // Project root directory
  publicDir: 'public', // Directory for static assets
  build: {
    outDir: 'dist', // Output directory for build
    rollupOptions: {
      input: {
        main: './index.html' // Entry point for the application
      },
      // Handle WASM files
      plugins: [
        wasm() // Vite plugin for WASM
      ]
    }
  },
  server: {
    port: 3000,
    open: true
  },
  // Configure Vite to copy the SQLite DB file to the public directory
  // Vite's default behavior with publicDir might handle this, but explicit copy is safer.
  // If `vite-plugin-wasm` isn't directly usable, we might need to rely on Vite's static asset handling.
});
