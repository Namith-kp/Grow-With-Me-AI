import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';
    
    return {
      base: isProduction ? '/Grow-With-Me-AI/' : '/',
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          // Exclude mobile-specific files from web builds
          './nativeGoogleAuth.android': './nativeGoogleAuth.web',
          './nativeGoogleAuth.android.ts': './nativeGoogleAuth.web.ts',
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
      },
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        rollupOptions: {
          external: (id) => {
            return id.includes('@capacitor') || 
                   id.includes('react-native') || 
                   id.includes('cordova') ||
                   id.includes('expo');
          }
        }
      },
      optimizeDeps: {
        exclude: [
          '@capacitor/core',
          '@capacitor/android',
          '@codetrix-studio/capacitor-google-auth',
          'react-native',
          '@react-native-firebase/app',
          '@react-native-firebase/auth',
          'react-native-chart-kit',
          'react-native-svg',
          'cordova-plugin-firebasex',
          'expo-auth-session'
        ]
      }
    };
});