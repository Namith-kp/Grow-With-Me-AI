

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
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.tasks.Task
import com.google.firebase.auth.GoogleAuthProvider


class MainActivity : AppCompatActivity() {

    private val RC_SIGN_IN = 9001
    private lateinit var googleSignInClient: GoogleSignInClient

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialize GoogleSignInClient before any usage
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(getString(R.string.default_web_client_id))
            .requestEmail()
            .build()
        googleSignInClient = GoogleSignIn.getClient(this, gso)

        // Show a simple sign-in button if not signed in
        if (FirebaseAuth.getInstance().currentUser == null) {
            val button = Button(this)
            button.text = "Sign in with Google"
            button.setOnClickListener { signInWithGoogle() }
            setContentView(button)
        } else {
            // Already signed in, load web app
            loadWebAppWithToken()
        }

    // ...existing code...

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
                    // Sign in success, load web app with token
                    loadWebAppWithToken()
                } else {
                    Toast.makeText(this, "Authentication Failed.", Toast.LENGTH_SHORT).show()
                }
            }
    }

    private fun loadWebAppWithToken() {
        val user = FirebaseAuth.getInstance().currentUser
        user?.getIdToken(false)?.addOnSuccessListener { result ->
            val idToken = result.token
            val webView = WebView(this)
            webView.settings.javaScriptEnabled = true
            webView.webViewClient = WebViewClient()
            // Pass the token as a URL parameter (your web app must handle it)
            val url = "https://namith-kp.github.io/Grow-With-Me-AI/?token=" + idToken
            webView.loadUrl(url)
            setContentView(webView)
        }
    }
}

