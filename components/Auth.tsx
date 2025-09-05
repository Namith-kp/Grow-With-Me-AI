import React, { useState, useRef } from 'react';
import firebase from 'firebase/compat/app';
import { auth, googleProvider, githubProvider } from '../firebase';
import { LogoIcon } from './icons';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 48 48" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.02,35.625,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

interface AuthComponentProps {
    error?: string | null;
    onAuthSuccess?: (user: any) => void;
}

const isAndroidWebView = () => {
    return typeof navigator !== 'undefined' && (/wv/.test(navigator.userAgent) || (/Android/.test(navigator.userAgent) && /Version\//.test(navigator.userAgent)));
};

const AuthComponent = ({ error, onAuthSuccess }: AuthComponentProps) => {
    const [verificationError, setVerificationError] = useState(error || '');
    const [loading, setLoading] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const turnstileSiteKey = (import.meta as any).env?.VITE_TURNSTILE_SITE_KEY as string | undefined;

    // Load Cloudflare Turnstile script if site key is present
    React.useEffect(() => {
        if (!turnstileSiteKey) return;
        const id = 'cf-turnstile-script';
        if (document.getElementById(id)) return;
        const s = document.createElement('script');
        s.id = id;
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
        s.async = true;
        s.defer = true;
        document.head.appendChild(s);
        return () => { try { document.head.removeChild(s); } catch {} };
    }, [turnstileSiteKey]);

    const handleGoogleSignIn = async () => {
        setVerificationError('');
        if (turnstileSiteKey && !captchaToken) {
            setVerificationError('Please complete the CAPTCHA first.');
            return;
        }
        try {
            setLoading(true);
            const result = await auth.signInWithPopup(googleProvider as any);
            if (onAuthSuccess) {
                onAuthSuccess(result.user);
            }
        } catch (err: any) {
            setVerificationError(err?.message || 'Google sign-in failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGithubSignIn = async () => {
        setVerificationError('');
        if (turnstileSiteKey && !captchaToken) {
            setVerificationError('Please complete the CAPTCHA first.');
            return;
        }
        try {
            setLoading(true);
            const result = await auth.signInWithPopup(githubProvider as any);
            if (onAuthSuccess) {
                onAuthSuccess(result.user);
            }
        } catch (err: any) {
            setVerificationError(err?.message || 'GitHub sign-in failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-950 to-black">
            {/* Background with subtle grid pattern */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-black to-slate-950" />
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-slate-500/5 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-slate-400/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.02)_1px,transparent_1px)] bg-[size:100px_100px]" />
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8">
                {/* Logo and Branding */}
                <div className="text-center mb-8 sm:mb-12">
                    <div className="relative flex items-center justify-center mb-6">
                        <div className="absolute -inset-2 sm:-inset-3 rounded-full bg-gradient-to-br from-purple-500/20 via-fuchsia-400/15 to-blue-400/20 blur-xl animate-pulse-slow" />
                        <LogoIcon className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-emerald-400 drop-shadow-2xl z-10" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                        Welcome to
                        <span className="text-emerald-400 font-bold"> Grow With Me</span>
                    </h1>
                    <p className="text-slate-400 text-sm sm:text-base lg:text-lg">
                        Connect, collaborate, and grow your network
                    </p>
                </div>

                {/* Single Auth Card */}
                <div className="w-full max-w-md">
                    <div className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-sm border border-slate-800/50 rounded-xl sm:rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:border-slate-600/70 hover:shadow-2xl hover:shadow-slate-500/10">
                        <div className="text-center mb-8">
                            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Sign In</h2>
                            <p className="text-slate-400 text-sm sm:text-base">
                                Choose your preferred sign-in method to continue.
                            </p>
                        </div>
                        <div className="space-y-4">
                            {turnstileSiteKey && (
                                <div
                                    className="cf-turnstile"
                                    data-sitekey={turnstileSiteKey}
                                    data-callback={(token: string) => setCaptchaToken(token)}
                                />
                            )}
                            {verificationError && (
                                <div className="bg-red-900/30 border border-red-700/30 text-red-300 p-3 sm:p-4 rounded-lg text-sm">
                                    {verificationError}
                                </div>
                            )}
                            
                            <div className="flex flex-col gap-3">
                                <button
                                    type="button"
                                    onClick={handleGoogleSignIn}
                                    disabled={loading}
                                    className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-medium flex items-center justify-center gap-3"
                                >
                                    <GoogleIcon className="w-5 h-5" />
                                    Continue with Google
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={handleGithubSignIn}
                                    disabled={loading}
                                    className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-medium flex items-center justify-center gap-3"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                    </svg>
                                    Continue with GitHub
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AuthComponent;
