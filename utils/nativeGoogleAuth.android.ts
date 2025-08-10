// No need to import Plugins from '@capacitor/core'
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

export async function nativeGoogleLogin() {
  try {
    // Initiate native Google login
    const googleUser = await GoogleAuth.signIn();
    // The GoogleAuth plugin returns an object with idToken and accessToken
    const idToken = googleUser.authentication?.idToken || googleUser.idToken;
    if (!idToken) throw new Error('No idToken returned from GoogleAuth');
    // Use the ID token to sign in to Firebase
    const credential = firebase.auth.GoogleAuthProvider.credential(idToken);
    const result = await firebase.auth().signInWithCredential(credential);
    return {
      user: result.user,
      idToken,
    };
  } catch (error) {
    console.error('[nativeGoogleLogin.android] signIn error:', error);
    throw error;
  }
}
