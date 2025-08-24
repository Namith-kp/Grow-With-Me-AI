// Empty module to replace mobile-specific dependencies in web builds
export default {};

// Handle GoogleAuth
export const GoogleAuth = {
  signIn: async () => {
    throw new Error('GoogleAuth not available in web builds');
  }
};

// Handle Capacitor plugins
export const Plugins = {};

// Handle Capacitor core
export const Capacitor = {
  isNative: false,
  getPlatform: () => 'web'
};

// Handle React Native
export const Platform = {
  OS: 'web',
  select: (obj) => obj.web || obj.default || {}
};

// Handle any other mobile-specific exports
export const * = {};

// Handle dynamic imports
if (typeof window !== 'undefined') {
  // Prevent any mobile-specific code from running
  window.__MOBILE_FEATURES_AVAILABLE__ = false;
}
