import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.growwithme',
  appName: 'grow-with-me',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '', // Optional: add your server client ID if needed
      forceCodeForRefreshToken: true // Optional
    }
  }
};

export default config;
