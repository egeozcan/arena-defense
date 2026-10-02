import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  build: {
    // The deterministic compatibility package embeds its WASM runtime.
    chunkSizeWarningLimit: 5000,
    rolldownOptions: {
      input: {
        landing: new URL('./index.html', import.meta.url).pathname,
        play: new URL('./play/index.html', import.meta.url).pathname,
      },
      output: {
        codeSplitting: {
          groups: [
            { name: 'physics', test: /node_modules[\\/]@dimforge[\\/]/, priority: 30 },
            {
              name: 'react',
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 20,
            },
            {
              name: 'scene',
              test: /node_modules[\\/](three|three-stdlib|@react-three)[\\/]/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
});
