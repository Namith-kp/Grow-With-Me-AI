import { nativeGoogleLogin as webLogin } from './nativeGoogleAuth.web';
import { nativeGoogleLogin as androidLogin } from './nativeGoogleAuth.android';

export const handleGoogleLogin = async () => {
  // Check platform dynamically to avoid build issues
  const isAndroid = typeof window !== 'undefined' && 
    (window.navigator.userAgent.includes('Android') || 
     window.navigator.userAgent.includes('Mobile'));
  
  try {
    if (isAndroid) {
      console.log('Using Android native login');
      return await androidLogin();
    } else {
      console.log('Using web login');
      return await webLogin();
    }
  } catch (error) {
    console.error(`Login error on platform ${isAndroid ? 'android' : 'web'}:`, error);
    throw error;
  }
};
