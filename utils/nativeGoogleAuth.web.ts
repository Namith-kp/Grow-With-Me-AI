import { auth, googleProvider } from '../firebase';

export async function nativeGoogleLogin() {
  try {
    console.log('[nativeGoogleLogin.web] Attempting to sign in with popup...');
    const result = await auth.signInWithPopup(googleProvider);
    console.log('[nativeGoogleLogin.web] signInWithPopup result:', result);
    // result.user contains the signed-in user info
    // To get the ID token, call getIdToken() on the user object
    const idToken = result.user ? await result.user.getIdToken() : null;
    return {
      user: result.user,
      idToken,
    };
  } catch (error) {
    console.error('[nativeGoogleLogin.web] signInWithPopup error:', error);
    throw error;
  }
}
