// Empty module to replace mobile-specific dependencies in web builds
export default {};
export const GoogleAuth = {
  signIn: async () => {
    throw new Error('GoogleAuth not available in web builds');
  }
};
export const Plugins = {};
export const Capacitor = {};
