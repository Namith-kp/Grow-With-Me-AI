import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';
    
    return {
      base: '/', // Set to root for Vercel
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          // Exclude mobile-specific files from web builds
          './nativeGoogleAuth.android': './nativeGoogleAuth.web',
          './nativeGoogleAuth.android.ts': './nativeGoogleAuth.web.ts',
          '@capacitor/core': path.resolve(__dirname, 'utils/empty-module.js'),
          '@capacitor/android': path.resolve(__dirname, 'utils/empty-module.js'),
          '@codetrix-studio/capacitor-google-auth': path.resolve(__dirname, 'utils/empty-module.js'),
          'react-native': path.resolve(__dirname, 'utils/empty-module.js'),
          '@react-native-firebase/app': path.resolve(__dirname, 'utils/empty-module.js'),
          '@react-native-firebase/auth': path.resolve(__dirname, 'utils/empty-module.js'),
          'react-native-chart-kit': path.resolve(__dirname, 'utils/empty-module.js'),
          'react-native-svg': path.resolve(__dirname, 'utils/empty-module.js'),
          'cordova-plugin-firebasex': path.resolve(__dirname, 'utils/empty-module.js'),
          'expo-auth-session': path.resolve(__dirname, 'utils/empty-module.js'),
          'motion/react': 'framer-motion'
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
                   id.includes('expo') ||
                   id.includes('@codetrix-studio') ||
                   id.includes('d3-format/src/exponent.js');
          }
        },
        // Ensure assets are built with proper paths
        assetsInlineLimit: 0,
        // Fix for Vercel deployment
        target: 'es2015',
        // Bundle all dependencies
        ssr: false
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
      },
      plugins: [
        {
          name: 'fix-d3-format-exponent',
          transform(code, id) {
            // Remove the problematic import completely
            if (code.includes('from"../node_modules/d3-format/src/exponent.js"')) {
              return code.replace(
                'from"../node_modules/d3-format/src/exponent.js"',
                'from"./utils/empty-module.js"'
              );
            }
            // Also handle other variations
            if (code.includes('require("../node_modules/d3-format/src/exponent.js")')) {
              return code.replace(
                'require("../node_modules/d3-format/src/exponent.js")',
                'require("./utils/empty-module.js")'
              );
            }
            // Handle any other exponent.js references
            if (code.includes('exponent.js')) {
              return code.replace(/exponent\.js/g, 'empty-module.js');
            }
            return code;
          }
        }
      ]
    };
});