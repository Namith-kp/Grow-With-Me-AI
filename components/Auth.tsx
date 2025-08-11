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

const AuthComponent = ({ onGoogleLogin, onGuestLogin, error, authUser }: AuthComponentProps) => {
    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen w-full px-2 sm:px-4 pt-8 pb-8 text-center overflow-hidden z-10">
        {/* 3D Globe and FloatingShapes Background */}
        <div className="absolute top-0 left-0 w-full h-full z-10">
            <Canvas>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.4} />
                <Globe />
                <FloatingShapes />
            </Canvas>
        </div>
        <div className="absolute pointer-events-none inset-0 flex items-center justify-center bg-black/60 [mask-image:radial-gradient(ellipse_at_center,transparent_30%,black)] z-20"></div>
        {/* Animated Gradient Background Overlay - covers entire screen */}
        <div className="fixed inset-0 z-0 pointer-events-none w-screen h-screen min-h-screen">
            <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-gradient-to-br from-purple-600 via-fuchsia-500 to-blue-500 opacity-30 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-tr from-blue-400 via-purple-400 to-fuchsia-400 opacity-20 rounded-full blur-2xl animate-pulse-slow" />
            <div className="absolute inset-0 bg-black bg-opacity-80 backdrop-blur-2xl" />
        </div>
        {/* Enhanced App Logo and Name */}
        <div className="flex flex-col items-center z-30 mb-10 ">
            <div className="relative flex items-center justify-center">
                <div className="absolute -inset-2 sm:-inset-3 rounded-full bg-gradient-to-br from-purple-500/40 via-fuchsia-400/30 to-blue-400/30 blur-xl animate-pulse-slow" />
                <LogoIcon className="w-20 h-20 sm:w-28 sm:h-28 text-purple-500 drop-shadow-2xl z-10" />
            </div>
            <span className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-br from-purple-400 via-fuchsia-300 to-blue-400 drop-shadow-xl tracking-tight animate-fade-in-scale shadow-lg">
                Grow With Me
            </span>
            <span className="mt-2 text-base sm:text-lg text-neutral-300 font-medium tracking-wide opacity-80 animate-fade-in-scale delay-200">
                AI-powered co-founder & investor matchmaking
            </span>
        </div>
        {/* Auth Card */}
        <div className="relative max-w-md w-full bg-gradient-to-br from-neutral-900/90 via-neutral-900/80 to-neutral-800/90 border border-purple-700/30 rounded-2xl p-8 space-y-6 animate-fade-in-scale shadow-2xl shadow-purple-900/20 z-30 backdrop-blur-xl">
            <h2 className="text-3xl font-extrabold text-white drop-shadow-lg">Join the Network</h2>
            <p className="text-neutral-300 text-lg font-medium">
                Sign in to save your profile and connect with others, or continue as a guest to explore the platform.
            </p>
            <div className="flex flex-col space-y-4 pt-4">
                {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-lg text-sm mb-4 text-left">{error}</div>}
                {/* Hide Google sign-in button if already authenticated or in Android WebView with token */}
                {!authUser && !(typeof window !== 'undefined' && window.location.search.includes('token')) && (
                    <button
                        onClick={onGoogleLogin}
                        className="flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-extrabold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg shadow-purple-600/20 text-lg tracking-wide border-2 border-white/10 focus:outline-none focus:ring-4 focus:ring-purple-400/30"
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
};

export default AuthComponent;
