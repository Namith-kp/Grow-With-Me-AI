
function isAndroidWebView() {
  // Detect Android WebView by user agent
  return /wv/.test(navigator.userAgent) || (/Android/.test(navigator.userAgent) && /Version\//.test(navigator.userAgent));
}

function hasTokenInUrl() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return !!params.get('token');
}

export async function nativeGoogleLogin() {
  if (isAndroidWebView() || hasTokenInUrl()) {
    throw new Error('[nativeGoogleLogin.web] signInWithPopup should not be called in Android WebView or when token is present in URL.');
  }
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
import { auth, googleProvider } from '../firebase';
