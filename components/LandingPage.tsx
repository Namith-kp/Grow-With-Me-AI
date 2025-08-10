import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion } from 'framer-motion';
import Globe from './Globe';
import FloatingShapes from './FloatingShapes';
import { initScrollbarAutoHide } from '../utils/scrollbarUtils';
import { LogoIcon } from './icons';

const LandingPage = ({ onGetStarted, authUser, userProfile }: { onGetStarted: () => void, authUser?: any, userProfile?: any }) => {
    useEffect(() => {
        const cleanup = initScrollbarAutoHide();
        return cleanup;
    }, []);

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen w-full px-2 sm:px-4 pt-8 pb-8 text-center overflow-hidden z-10">
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
                <span className="mt-4 text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-br from-purple-400 via-fuchsia-300 to-blue-400 drop-shadow-xl tracking-tight animate-fade-in-scale shadow-lg">
                    Grow With Me
                </span>
                <span className="mt-2 text-base sm:text-lg text-neutral-300 font-medium tracking-wide opacity-80 animate-fade-in-scale delay-200">
                    AI-powered co-founder & investor match making
                </span>
            </div>
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
            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
                className="text-3xl xs:text-4xl sm:text-5xl md:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-white via-purple-200 to-fuchsia-200 mb-4 z-20 leading-tight drop-shadow-2xl"
            >
                Find Your Perfect Co-Founder
            </motion.h1>
            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: 'easeInOut' }}
                className="text-neutral-200 max-w-xs xs:max-w-md sm:max-w-2xl mx-auto mb-10 z-20 text-base xs:text-lg sm:text-xl font-medium drop-shadow-lg"
            >
                Leverage the power of AI to connect with innovators, builders, and investors who share your vision.<br className="hidden sm:inline" /> Your next big partnership starts here.
            </motion.p>
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6, ease: 'backOut' }}
                onClick={() => {
                    if (authUser && !authUser.isAnonymous && userProfile) {
                        window.dispatchEvent(new CustomEvent('navigate-dashboard'));
                    } else {
                        onGetStarted();
                    }
                }}
                className="relative bg-gradient-to-r from-purple-600 via-fuchsia-500 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-extrabold py-3 px-8 xs:py-4 xs:px-12 rounded-full transition-all duration-300 shadow-2xl shadow-purple-600/30 transform hover:scale-105 z-30 text-lg xs:text-xl tracking-wide border-2 border-white/10 focus:outline-none focus:ring-4 focus:ring-purple-400/30 animate-fade-in-scale"
            >
                <span className="drop-shadow-lg">Get Started</span>
                <span className="absolute -right-4 -top-4 animate-bounce text-fuchsia-300 text-2xl select-none pointer-events-none">✨</span>
            </motion.button>

            <div className="mt-12 sm:mt-20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 max-w-xs xs:max-w-2xl sm:max-w-4xl md:max-w-6xl mx-auto z-30 w-full px-1 xs:px-0">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.9, ease: 'easeInOut' }}
                    className="bg-gradient-to-br from-purple-900/60 via-fuchsia-900/40 to-blue-900/60 p-7 rounded-2xl shadow-xl backdrop-blur-lg border border-purple-700/40 hover:scale-[1.03] transition-transform duration-300 group relative overflow-hidden"
                >
                    <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-purple-500/30 to-fuchsia-400/20 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                    <h3 className="text-2xl font-extrabold text-white mb-2 drop-shadow-lg">AI-Powered Matchmaking</h3>
                    <p className="text-neutral-200 text-base font-medium">Our advanced AI algorithm analyzes your profile, interests, and goals to connect you with the most compatible co-founders, investors, and team members.</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.1, ease: 'easeInOut' }}
                    className="bg-gradient-to-br from-blue-900/60 via-purple-900/40 to-fuchsia-900/60 p-7 rounded-2xl shadow-xl backdrop-blur-lg border border-blue-700/40 hover:scale-[1.03] transition-transform duration-300 group relative overflow-hidden"
                >
                    <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-br from-blue-400/30 to-purple-400/20 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                    <h3 className="text-2xl font-extrabold text-white mb-2 drop-shadow-lg">Collaborative Workspace</h3>
                    <p className="text-neutral-200 text-base font-medium">Work together seamlessly with built-in tools for brainstorming, project management, and communication. Turn your ideas into reality without leaving the platform.</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.3, ease: 'easeInOut' }}
                    className="bg-gradient-to-br from-fuchsia-900/60 via-blue-900/40 to-purple-900/60 p-7 rounded-2xl shadow-xl backdrop-blur-lg border border-fuchsia-700/40 hover:scale-[1.03] transition-transform duration-300 group relative overflow-hidden"
                >
                    <div className="absolute -top-8 -left-8 w-24 h-24 bg-gradient-to-br from-fuchsia-400/30 to-blue-400/20 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                    <h3 className="text-2xl font-extrabold text-white mb-2 drop-shadow-lg">Secure & Private</h3>
                    <p className="text-neutral-200 text-base font-medium">Your data is our top priority. We use state-of-the-art security measures to ensure your information is always protected and confidential.</p>
                </motion.div>
            </div>
        </div>
    );
};export default LandingPage;
