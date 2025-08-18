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
        <div className="relative min-h-screen w-full overflow-hidden bg-black">
            {/* Gradient background, blurred circles, grid pattern */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-black to-slate-950" />
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px]" />
            </div>
            {/* Logo and heading */}
            <div className="flex flex-col items-center z-30 pt-10 mb-5 relative">
                <div className="relative flex items-center justify-center mb-2">
                    <div className="absolute -inset-2 sm:-inset-3 rounded-full bg-gradient-to-br from-purple-500/40 via-fuchsia-400/30 to-blue-400/30 blur-xl animate-pulse-slow" />
                    <LogoIcon className="w-20 h-20 sm:w-28 sm:h-28 text-emerald-400 drop-shadow-2xl z-10" />
                </div>
                <span className="text-3xl md:text-4xl font-light mb-4">
                    Sign in to
                    <span className="text-emerald-400 font-light"> Grow With Me</span>
                    
                </span>
                
            </div>
            {/* Auth Card - glassmorphism, rounded, shadow, border */}
            <div className="relative max-w-md w-full mx-auto bg-gradient-to-br from-neutral-900/90 via-neutral-900/80 to-neutral-800/90 border border-emerald-400/20 rounded-2xl p-8 space-y-6 shadow-2xl shadow-emerald-900/20 z-30 backdrop-blur-xl">
                <h2 className="text-3xl font-light text-white mb-2">Join the Network</h2>
                <p className="text-neutral-300 text-lg font-light">
                    Sign in to save your profile and connect with others, or continue as a guest to explore the platform.
                </p>
                <div className="flex flex-col space-y-4 pt-4">
                    {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-lg text-sm mb-4 text-left">{error}</div>}
                    {!authUser && (
                        <button
                            onClick={handleGoogleSignIn}
                            className="flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg shadow-emerald-600/20 text-lg tracking-wide border-2 border-white/10 focus:outline-none focus:ring-4 focus:ring-emerald-400/30"
                        >
                            <GoogleIcon className="w-6 h-6" />
                            Sign In with Google
                        </button>
                    )}
                    <button
                        onClick={onGuestLogin}
                        className="flex items-center justify-center gap-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 w-full border border-neutral-700/40 text-lg"
                    >
                        Continue as Guest
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AuthComponent;
