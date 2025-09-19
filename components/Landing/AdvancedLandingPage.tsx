import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { User } from '../../types';

interface AdvancedLandingPageProps {
  onGetStarted: () => void;
  authUser?: any;
  userProfile?: User;
}

// Professional dark geometric background pattern
const GeometricPattern = () => {
  return (
    <div className="fixed inset-0 overflow-hidden w-screen h-screen" style={{ margin: 0, padding: 0 }}>
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-900 to-black w-full h-full"></div>
      <div className="absolute inset-0">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.1)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
        
        {/* Professional accent shapes */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-indigo-600/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 left-20 w-48 h-48 bg-gradient-to-tr from-purple-500/15 to-blue-600/25 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-bl from-blue-400/20 to-indigo-500/15 rounded-full blur-2xl"></div>
        
        {/* Subtle geometric lines */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="professional-lines" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              <path d="M0 100 L200 0" stroke="rgba(148,163,184,0.15)" strokeWidth="1"/>
              <path d="M0 0 L200 100" stroke="rgba(148,163,184,0.1)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#professional-lines)"/>
        </svg>
      </div>
    </div>
  );
};

// Professional Logo Component
const LogoIcon = () => (
  <img 
    src="/myicon4.png" 
    alt="G Logo" 
    width="37" 
    height="37" 
    className="rounded-lg"
  />
);

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 2000, suffix = '' }: { end: number; duration?: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [isInView, end, duration]);

  return (
    <span className="inline-block">
      {count.toLocaleString()}{suffix}
    </span>
  );
};

const AdvancedLandingPage: React.FC<AdvancedLandingPageProps> = ({ onGetStarted, authUser, userProfile }) => {
  return (
    <div className="min-h-screen w-screen relative bg-gray-900 overflow-x-hidden" style={{ margin: 0, padding: 0 }}>
      <GeometricPattern />
      
      {/* Navigation */}
      <nav className="relative z-10 px-4 sm:px-6 lg:px-8 py-4 w-full">
        <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
          <div className="flex items-center">
            <LogoIcon />
            <span className="text-xl sm:text-4xl font-semibold text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>row With Me</span>
          </div>
          <div className="hidden md:flex items-center space-x-4 lg:space-x-8">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors text-sm lg:text-base">Features</a>
            <button
              onClick={() => {
                console.log('Header Get Started button clicked');
                onGetStarted();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 lg:px-6 py-2 rounded-lg font-medium transition-colors text-sm lg:text-base"
            >
              Get Started
            </button>
          </div>
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => {
                console.log('Mobile Get Started button clicked');
                onGetStarted();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 min-h-[80vh] flex items-center w-full">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight mb-4 sm:mb-6">
                Find Your Perfect
                <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent block sm:inline"> Co-Founder</span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Connect with like-minded entrepreneurs, developers, and investors using our AI-powered matching platform. Build the startup of your dreams with the right team.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                <button
                  onClick={() => {
                    console.log('Start Building Today button clicked');
                    onGetStarted();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-all hover:scale-105 w-full sm:w-auto"
                >
                  Start Building Today
                </button>
                <button className="border-2 border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-colors w-full sm:w-auto">
                  Watch Demo
                </button>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative mt-8 lg:mt-0"
            >
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border border-gray-700 max-w-md mx-auto lg:max-w-none">
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white text-sm sm:text-base">AI-Powered Matching</h3>
                      <p className="text-gray-300 text-xs sm:text-sm">Find compatible partners instantly</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white text-sm sm:text-base">Verified Profiles</h3>
                      <p className="text-gray-300 text-xs sm:text-sm">Connect with trusted professionals</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white text-sm sm:text-base">Fast Connections</h3>
                      <p className="text-gray-300 text-xs sm:text-sm">Start collaborating in minutes</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-gray-800/30 w-full">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                <AnimatedCounter end={10000} suffix="+" />
              </div>
              <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">Active Users</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                <AnimatedCounter end={2500} suffix="+" />
              </div>
              <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">Successful Matches</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                <AnimatedCounter end={150} suffix="+" />
              </div>
              <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">Startups Launched</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center"
            >
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                <AnimatedCounter end={50} suffix="M+" />
              </div>
              <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">Funding Raised</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 w-full">
        <div className="max-w-7xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
              Everything You Need to Build Your Startup
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-300 max-w-3xl mx-auto px-4">
              Our comprehensive platform provides all the tools and connections you need to turn your idea into a successful business.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: "🤖",
                title: "AI-Powered Matching",
                description: "Advanced algorithms analyze skills, interests, and goals to find your perfect co-founder match."
              },
              {
                icon: "💬",
                title: "Real-Time Messaging",
                description: "Connect instantly with potential partners through our secure messaging platform."
              },
              {
                icon: "💡",
                title: "Ideas Board",
                description: "Share your startup ideas and discover exciting projects looking for co-founders."
              },
              {
                icon: "📊",
                title: "Analytics Dashboard",
                description: "Track your networking progress and optimize your profile for better matches."
              },
              {
                icon: "🔒",
                title: "Secure Platform",
                description: "Enterprise-grade security with verified profiles and encrypted communications."
              },
              {
                icon: "🌍",
                title: "Global Network",
                description: "Connect with entrepreneurs, developers, and investors from around the world."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-700 hover:shadow-xl transition-shadow"
              >
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{feature.icon}</div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed text-sm sm:text-base">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 bg-gray-800/30 w-full">
        <div className="max-w-7xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
              Trusted by Successful Entrepreneurs
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-300">
              See what our community has to say about their experience
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                name: "Sarah Chen",
                role: "CEO, TechFlow",
                avatar: "👩‍💼",
                quote: "Found my perfect CTO within 2 weeks. The AI matching was incredibly accurate and saved us months of searching."
              },
              {
                name: "Marcus Rodriguez",
                role: "Founder, GreenTech Solutions",
                avatar: "👨‍💻",
                quote: "The platform connected me with investors who truly understood our vision. We closed our Series A in record time."
              },
              {
                name: "Emily Watson",
                role: "Co-founder, HealthAI",
                avatar: "👩‍⚕️",
                quote: "Amazing community of like-minded entrepreneurs. The networking opportunities here are unmatched."
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-700"
              >
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="text-2xl sm:text-3xl mr-3 sm:mr-4 flex-shrink-0">{testimonial.avatar}</div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-white text-sm sm:text-base">{testimonial.name}</h4>
                    <p className="text-gray-400 text-xs sm:text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-300 italic text-sm sm:text-base">"{testimonial.quote}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-blue-600 to-indigo-600 w-full">
        <div className="max-w-4xl mx-auto text-center w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">
              Ready to Find Your Co-Founder?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              Join thousands of entrepreneurs who have found their perfect business partners through our platform.
            </p>
            <button
              onClick={() => {
                console.log('Get Started for Free button clicked');
                onGetStarted();
              }}
              className="bg-white text-blue-600 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-gray-50 transition-colors w-full sm:w-auto max-w-sm mx-auto"
            >
              Get Started for Free
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AdvancedLandingPage;
