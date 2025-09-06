import React, { useEffect, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { initScrollbarAutoHide } from '../utils/scrollbarUtils';
import { LogoIcon } from './icons';

// Clean, modern icons for features
const BrainIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);

const UsersIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
);

const ShieldIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

const RocketIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

// Scroll-aware 3D Models Component - Single Purple Model with Continuous Zoom
const ScrollAware3DModels = ({ scrollY, scrollDirection }: { scrollY: any, scrollDirection: string }) => {
    const scrollYProgress = useTransform(scrollY, [0, 3000], [0, 1]);
    
    return (
        <>
            {/* Single elegant purple dodecahedron with continuous zoom effect */}
            <mesh 
                position={[0, 0, -4]} 
                rotation={[
                    scrollYProgress.get() * Math.PI * 0.8,
                    scrollYProgress.get() * Math.PI * 1.2,
                    scrollYProgress.get() * Math.PI * 0.6
                ]}
                scale={[2 + scrollYProgress.get() * 4, 2 + scrollYProgress.get() * 4, 2 + scrollYProgress.get() * 4]}
            >
                <dodecahedronGeometry args={[1.5, 0]} />
                <meshStandardMaterial 
                    color="#8b5cf6" 
                    wireframe 
                    opacity={0.5} 
                    transparent 
                    emissive="#8b5cf6"
                    emissiveIntensity={0.2}
                />
            </mesh>
        </>
    );
};

const LandingPage = ({ onGetStarted, authUser, userProfile }: { onGetStarted: () => void, authUser?: any, userProfile?: any }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [scrollDirection, setScrollDirection] = useState('down');
    const [lastScrollY, setLastScrollY] = useState(0);
    const { scrollY } = useScroll();
    const y = useTransform(scrollY, [0, 300], [0, -50]);
    const opacity = useTransform(scrollY, [0, 300], [1, 0]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const cleanup = initScrollbarAutoHide();
        return cleanup;
    }, []);

    // Track scroll direction
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY) {
                setScrollDirection('down');
            } else {
                setScrollDirection('up');
            }
            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const features = [
        {
            icon: <BrainIcon />,
            title: "AI-Powered Matchmaking",
            description: "Advanced algorithms analyze compatibility across skills, goals, and vision to connect you with the perfect co-founder.",
            color: "emerald"
        },
        {
            icon: <UsersIcon />,
            title: "Global Network",
            description: "Connect with thousands of entrepreneurs, investors, and innovators from around the world.",
            color: "amber"
        },
        {
            icon: <ShieldIcon />,
            title: "Enterprise Security",
            description: "Bank-level encryption and privacy controls ensure your ideas and conversations remain confidential.",
            color: "violet"
        },
        {
            icon: <RocketIcon />,
            title: "Launch Together",
            description: "From ideation to execution, our platform provides the tools and connections to bring your vision to life.",
            color: "rose"
        }
    ];

    const stats = [
        { number: "10K+", label: "Active Users" },
        { number: "500+", label: "Successful Matches" },
        { number: "50+", label: "Countries" },
        { number: "95%", label: "Satisfaction Rate" }
    ];

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-black" ref={scrollRef}>
            {/* Clean, minimal background */}
            <div className="fixed inset-0 z-0">
                {/* Simple gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-black to-slate-950" />
                
                {/* Subtle animated elements */}
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
                
                {/* Minimal grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px]" />
            </div>

            {/* Enhanced 3D Background with Scroll Awareness */}
            <div className="fixed inset-0 z-10 w-full h-full">
                <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
                    <ambientLight intensity={0.4} />
                    <pointLight position={[0, 0, 10]} intensity={0.6} color="#ffffff" />
                    <pointLight position={[0, 5, 5]} intensity={0.5} color="#8b5cf6" />
                    
                    {/* Disable auto-rotation when scrolling for better control */}
                    <OrbitControls 
                        enableZoom={false} 
                        enablePan={false} 
                        autoRotate={false}
                        enableRotate={false}
                    />
                    
                    {/* Single Purple 3D Model with Zoom Effect */}
                    <ScrollAware3DModels scrollY={scrollY} scrollDirection={scrollDirection} />
                </Canvas>
            </div>

            {/* Content Overlay */}
            <div className="relative z-20 min-h-screen flex flex-col">
                {/* Clean Navigation */}
                <motion.nav 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute top-0 left-0 right-0 z-30 p-8"
                >
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <motion.div 
                            className="flex items-center space-x-3 cursor-pointer"
                            whileHover={{ scale: 1.02 }}
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        >
                            <LogoIcon className="w-8 h-8 text-emerald-400" />
                            <span className="font-montserrat text-3xl font-semibold text-white">
                                row With Me
                            </span>
                        </motion.div>
                        
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                if (authUser && !authUser.isAnonymous && userProfile) {
                                    window.dispatchEvent(new CustomEvent('navigate-dashboard'));
                                } else {
                                    onGetStarted();
                                }
                            }}
                            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-all duration-200"
                        >
                            Get Started
                        </motion.button>
                    </div>
                </motion.nav>

                {/* Hero Section - Clean and Minimal */}
                <section className="flex-1 flex items-center justify-center px-8 pt-24">
                    <div className="max-w-5xl mx-auto text-center">
                        {/* Main Heading */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="mb-12"
                        >
                            <h1 className="text-6xl md:text-7xl lg:text-8xl font-light leading-tight mb-8 text-white">
                                Find Your Perfect
                                <br />
                                <span className="text-emerald-400 font-normal">Co-Founder</span>
                            </h1>
                            
                            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-light">
                                Leverage the power of AI to connect with innovators, builders, and investors who share your vision.
                            </p>
                        </motion.div>

                        {/* Clean CTA Button */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                            className="mb-20"
                        >
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onHoverStart={() => setIsHovered(true)}
                                onHoverEnd={() => setIsHovered(false)}
                                onClick={() => {
                                    if (authUser && !authUser.isAnonymous && userProfile) {
                                        window.dispatchEvent(new CustomEvent('navigate-dashboard'));
                                    } else {
                                        onGetStarted();
                                    }
                                }}
                                className="relative px-12 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-lg rounded-lg transition-all duration-200 shadow-lg"
                            >
                                <span className="flex items-center space-x-3">
                                    <span>Start Your Journey</span>
                                    <motion.span
                                        animate={{ x: isHovered ? 4 : 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="text-xl"
                                    >
                                        →
                                    </motion.span>
                                </span>
                            </motion.button>
                        </motion.div>

                        {/* Clean Stats Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.8 }}
                            className="grid grid-cols-2 md:grid-cols-4 gap-12 max-w-4xl mx-auto"
                        >
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
                                    className="text-center"
                                >
                                    <div className="text-3xl md:text-4xl font-light text-emerald-400 mb-2">
                                        {stat.number}
                                    </div>
                                    <div className="text-sm text-gray-400 font-medium">
                                        {stat.label}
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>
            </div>

            {/* Features Section - Clean Cards */}
            <section className="relative z-20 py-24 px-8">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
                            Why Choose Grow With Me?
                        </h2>
                        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                            We've built the most advanced platform for connecting entrepreneurs with their perfect co-founders
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                whileHover={{ y: -8 }}
                                className="group p-8 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-emerald-500/30 transition-all duration-300"
                            >
                                {/* Icon */}
                                <div className={`w-12 h-12 bg-${feature.color}-500/20 rounded-lg flex items-center justify-center mb-6 group-hover:bg-${feature.color}-500/30 transition-colors duration-300`}>
                                    <div className={`text-${feature.color}-400`}>
                                        {feature.icon}
                                    </div>
                                </div>

                                {/* Content */}
                                <h3 className="text-lg font-semibold text-white mb-4">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-300 leading-relaxed text-sm">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section - Clean Design */}
            <section className="relative z-20 py-24 px-8">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
                            Success Stories
                        </h2>
                        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                            See how entrepreneurs found their perfect co-founders and built successful companies together
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                quote: "Found my technical co-founder in just 2 weeks. We've been building together for 6 months now!",
                                author: "Sarah Chen",
                                role: "Founder, TechFlow"
                            },
                            {
                                quote: "The AI matching was incredibly accurate. My co-founder and I have complementary skills that work perfectly.",
                                author: "Marcus Rodriguez",
                                role: "CEO, InnovateLab"
                            },
                            {
                                quote: "From idea to launch in 3 months. This platform made all the difference in our startup journey.",
                                author: "Alex Thompson",
                                role: "Co-Founder, DataSync"
                            }
                        ].map((testimonial, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.2 }}
                                viewport={{ once: true }}
                                className="p-8 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-emerald-500/30 transition-all duration-300"
                            >
                                <div className="text-emerald-400 text-2xl mb-4">"</div>
                                <p className="text-gray-300 mb-6 leading-relaxed text-sm">
                                    {testimonial.quote}
                                </p>
                                <div>
                                    <div className="font-semibold text-white">{testimonial.author}</div>
                                    <div className="text-sm text-gray-400">{testimonial.role}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA Section - Clean */}
            <section className="relative z-20 py-24 px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto text-center"
                >
                    <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
                        Ready to Find Your Co-Founder?
                    </h2>
                    <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
                        Join thousands of entrepreneurs who have already found their perfect match. Your next big partnership is just a click away.
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            if (authUser && !authUser.isAnonymous && userProfile) {
                                window.dispatchEvent(new CustomEvent('navigate-dashboard'));
                            } else {
                                onGetStarted();
                            }
                        }}
                        className="px-12 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-lg rounded-lg transition-all duration-200 shadow-lg"
                    >
                        Start Your Journey Today
                    </motion.button>
                </motion.div>
            </section>
        </div>
    );
};

export default LandingPage;
