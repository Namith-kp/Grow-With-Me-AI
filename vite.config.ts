import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/Grow-With-Me-AI/',
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        rollupOptions: {
          output: {
            manualChunks: undefined
          },
          external: (id) => {
            // Externalize mobile-specific packages for web builds
            return id.includes('@codetrix-studio/capacitor-google-auth') ||
                   id.includes('@capacitor/android') ||
                   id.includes('@capacitor/core') ||
                   id.includes('react-native');
          }
        }
      }
    };
});
