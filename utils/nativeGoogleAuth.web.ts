// Web-only version of native Google auth
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

export async function nativeGoogleLogin() {
  try {
    // Use Firebase web auth for web builds
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await firebase.auth().signInWithPopup(provider);
    
    if (result.user) {
      const idToken = await result.user.getIdToken();
      return {
        user: result.user,
        idToken,
      };
    } else {
      throw new Error('No user returned from Google sign-in');
    }
  } catch (error) {
    console.error('[nativeGoogleLogin.web] signIn error:', error);
    throw error;
  }
}
