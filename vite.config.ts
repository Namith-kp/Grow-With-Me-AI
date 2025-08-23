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
          }
        }
      },
      resolve: {
        alias: {
          '@capacitor/core': false,
          '@capacitor/android': false,
          '@codetrix-studio/capacitor-google-auth': false,
          'react-native': false,
          '@react-native-firebase/app': false,
          '@react-native-firebase/auth': false,
          'react-native-chart-kit': false,
          'react-native-svg': false,
          'cordova-plugin-firebasex': false,
          'expo-auth-session': false
        }
      }
    };
});
