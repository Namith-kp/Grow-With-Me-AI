import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.growwithme',
  appName: 'grow-with-me',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '889105420419-n9vdkh7ogbqvmgu81k4tq4r1eb9voe1a.apps.googleusercontent.com', // Optional: add your server client ID if needed
      forceCodeForRefreshToken: true // Optional
    }
  }
};

export default config;
