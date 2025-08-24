import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Globe from './Globe';
import FloatingShapes from './FloatingShapes';
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
    onGoogleLogin: () => void;
    onGuestLogin: () => void;
    error: string | null;
    authUser: any;
}

const isAndroidWebView = () => {
    return typeof navigator !== 'undefined' && (/wv/.test(navigator.userAgent) || (/Android/.test(navigator.userAgent) && /Version\//.test(navigator.userAgent)));
};

const AuthComponent = ({ onGoogleLogin, onGuestLogin, error, authUser }: AuthComponentProps) => {
    const handleGoogleSignIn = () => {
        if (isAndroidWebView() && typeof window !== 'undefined' && (window as any).AndroidBridge) {
            (window as any).AndroidBridge.triggerGoogleSignIn();
        } else {
            onGoogleLogin();
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
                            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Join the Network</h2>
                            <p className="text-slate-400 text-sm sm:text-base">
                                Sign in to save your profile and connect with others, or continue as a guest to explore the platform.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {error && (
                                <div className="bg-red-900/30 border border-red-700/30 text-red-300 p-3 sm:p-4 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}
                            
                            {!authUser && (
                                <button
                                    onClick={handleGoogleSignIn}
                                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-slate-800/50 to-slate-700/50 hover:from-slate-700/50 hover:to-slate-600/50 text-white font-medium py-3 sm:py-4 px-6 rounded-lg sm:rounded-xl transition-all duration-300 border border-slate-700/30 hover:border-slate-600/50 text-sm sm:text-base"
                                >
                                    <GoogleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                    Sign In with Google
                                </button>
                            )}
                            
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-700/30"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-gradient-to-br from-slate-900/90 to-black/90 px-2 text-slate-400">or</span>
                                </div>
                            </div>
                            
                            <button
                                onClick={onGuestLogin}
                                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-slate-800/50 to-slate-700/50 hover:from-slate-700/50 hover:to-slate-600/50 text-white font-medium py-3 sm:py-4 px-6 rounded-lg sm:rounded-xl transition-all duration-300 border border-slate-700/30 hover:border-slate-600/50 text-sm sm:text-base"
                            >
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Continue as Guest
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AuthComponent;
