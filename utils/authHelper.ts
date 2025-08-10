import { Capacitor } from '@capacitor/core';
import { nativeGoogleLogin as webLogin } from './nativeGoogleAuth.web';
import { nativeGoogleLogin as androidLogin } from './nativeGoogleAuth.android';

export const handleGoogleLogin = async () => {
  const platform = Capacitor.getPlatform();
  
  try {
    if (platform === 'android') {
      console.log('Using Android native login');
      return await androidLogin();
    } else {
      console.log('Using web login');
      return await webLogin();
    }
  } catch (error) {
    console.error(`Login error on platform ${platform}:`, error);
    throw error;
  }
};
