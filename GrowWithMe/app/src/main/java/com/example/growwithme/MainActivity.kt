


package com.example.growwithme

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.auth.FirebaseAuth
import android.view.View
import android.widget.Button
import android.widget.Toast
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.JavascriptInterface
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.tasks.Task
import com.google.firebase.auth.GoogleAuthProvider


class MainActivity : AppCompatActivity() {
    // ...existing code...

    private fun signOutFromGoogle() {
        googleSignInClient.signOut().addOnCompleteListener(this) {
            googleSignInClient.revokeAccess().addOnCompleteListener(this) {
                lastGoogleIdToken = null
                runOnUiThread {
                    try {
                        if (isFinishing || isDestroyed) {
                            // Don't reload if activity is finishing or destroyed
                            return@runOnUiThread
                        }
                        val wv = webView
                        if (wv != null && wv.handler != null && wv.isAttachedToWindow) {
                            wv.loadUrl("https://namith-kp.github.io/Grow-With-Me-AI/")
                        } else {
                            Toast.makeText(this@MainActivity, "WebView is not ready to reload.", Toast.LENGTH_SHORT).show()
                        }
                    } catch (e: Exception) {
                        Toast.makeText(this@MainActivity, "Error reloading WebView: ${e.message}", Toast.LENGTH_LONG).show()
                    }
                }
            }
        }
    }

    private val RC_SIGN_IN = 9001
    private lateinit var googleSignInClient: GoogleSignInClient
    private var webView: WebView? = null
    private var lastGoogleIdToken: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(getString(R.string.default_web_client_id))
            .requestEmail()
            .build()
        googleSignInClient = GoogleSignIn.getClient(this, gso)

        // Always load the WebView and inject the bridge
        webView = WebView(this)
        webView?.settings?.javaScriptEnabled = true
        webView?.webViewClient = WebViewClient()
        webView?.addJavascriptInterface(WebAppInterface(this), "AndroidBridge")
        setContentView(webView)

        loadWebAppWithTokenIfSignedIn()
    }

    private fun loadWebAppWithTokenIfSignedIn() {
        if (lastGoogleIdToken != null) {
            val url = "https://namith-kp.github.io/Grow-With-Me-AI/?token=" + lastGoogleIdToken
            webView?.loadUrl(url)
        } else {
            // Not signed in, just load the web app (no token)
            webView?.loadUrl("https://namith-kp.github.io/Grow-With-Me-AI/")
        }
    }

    private fun signInWithGoogle() {
        val signInIntent = googleSignInClient.signInIntent
        startActivityForResult(signInIntent, RC_SIGN_IN)
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == RC_SIGN_IN) {
            val task: Task<GoogleSignInAccount> = GoogleSignIn.getSignedInAccountFromIntent(data)
            try {
                val account = task.getResult(ApiException::class.java)
                lastGoogleIdToken = account.idToken
                firebaseAuthWithGoogle(account.idToken!!)
            } catch (e: ApiException) {
                Toast.makeText(this, "Google sign in failed: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun firebaseAuthWithGoogle(idToken: String) {
        val credential = GoogleAuthProvider.getCredential(idToken, null)
        FirebaseAuth.getInstance().signInWithCredential(credential)
            .addOnCompleteListener(this) { task ->
                if (task.isSuccessful) {
                    // Sign in success, reload web app with token
                    loadWebAppWithTokenIfSignedIn()
                } else {
                    Toast.makeText(this, "Authentication Failed.", Toast.LENGTH_SHORT).show()
                }
            }
    }

    inner class WebAppInterface(private val activity: Activity) {
        @JavascriptInterface
        fun triggerGoogleSignIn() {
            activity.runOnUiThread {
                signInWithGoogle()
            }
        }

        @JavascriptInterface
        fun signOutFromGoogle() {
            if (activity is MainActivity) {
                activity.runOnUiThread {
                    activity.signOutFromGoogle()
                }
            }
        }
    }
}

