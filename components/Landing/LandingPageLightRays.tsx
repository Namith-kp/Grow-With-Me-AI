import React from "react";
import LightRays from "./LightRays";
import { LogoIcon } from "../icons";

const LandingPageLightRays: React.FC = () => {
  const handleGetStarted = () => {
    window.location.href = "/Grow-With-Me-AI/auth";
  };
  return (
    <div className="min-h-screen w-full font-sans text-white flex flex-col overflow-hidden">
  <div className="fixed top-0 left-0 w-screen h-screen">
        <LightRays
          raysOrigin="top-center"
          raysColor="#f6f8f8ff"
          raysSpeed={1.5}
          lightSpread={0.8}
          rayLength={3}
          followMouse={true}
          mouseInfluence={0.3}
          noiseAmount={0.1}
          distortion={0.05}
          className="w-full h-full"
        />
      </div>
      <div className="relative z-10 flex flex-col items-center w-full flex-grow">
        <header className="w-full flex items-center justify-between px-2 md:px-12 mb-8">
          <div className="flex items-center gap-1">
            <LogoIcon className="w-8 h-8 text-indigo-500" />
            <span className="font-montserrat text-md md:text-3xl font-semibold text-white tracking-tight">row With Me</span>
          </div>
          <button className="bg-white text-[#18141c] rounded-2xl px-6 py-2 font-medium text-base shadow hover:bg-gray-200 transition" onClick={handleGetStarted}>Get Started</button>
        </header>
        <main className="flex flex-col items-stretch justify-start text-center max-w-3xl mx-auto w-full overflow-y-auto">
          <h1 className="text-4xl md:text-7xl font-bold mb-6 leading-tight">Find Your Perfect<br /><span className="text-indigo-500">Co-Founder</span></h1>
          <p className="text-base md:text-lg text-gray-300 mb-8 font-light">Empowering founders, innovators, and investors to connect, collaborate, and launch world-changing startups. Move your mouse to see the interactive light rays background!</p>

          {/* About Section */}
          <section className="w-full mb-8 text-left bg-white/5 rounded-xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-indigo-400 mb-3">About Grow With Me</h2>
            <p className="text-gray-200 text-base mb-4">Grow With Me is a next-generation platform designed to break down barriers and make entrepreneurship accessible to everyone, everywhere.</p>
            <ul className="list-disc pl-5 text-gray-300 text-sm space-y-2">
              <li>AI-driven matchmaking for co-founders and teams</li>
              <li>Secure, global networking and messaging</li>
              <li>Real-time feedback and mentorship</li>
              <li>Investor pitch and negotiation tools</li>
            </ul>
          </section>

          {/* Features Section */}
          <section className="w-full mb-8">
            <h2 className="text-xl font-semibold text-indigo-400 mb-4 text-left">Key Features</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-white/10 rounded-lg p-5 text-left">
                <h3 className="text-white font-semibold mb-2">Smart Matchmaking</h3>
                <p className="text-gray-300 text-sm">Advanced algorithms analyze compatibility across skills, goals, and vision to connect you with the perfect co-founder.</p>
              </div>
              <div className="bg-white/10 rounded-lg p-5 text-left">
                <h3 className="text-white font-semibold mb-2">Global Community</h3>
                <p className="text-gray-300 text-sm">Connect with thousands of entrepreneurs, investors, and innovators from around the world.</p>
              </div>
              <div className="bg-white/10 rounded-lg p-5 text-left">
                <h3 className="text-white font-semibold mb-2">Secure Collaboration</h3>
                <p className="text-gray-300 text-sm">Bank-level encryption and privacy controls ensure your ideas and conversations remain confidential.</p>
              </div>
              <div className="bg-white/10 rounded-lg p-5 text-left">
                <h3 className="text-white font-semibold mb-2">Launch & Grow</h3>
                <p className="text-gray-300 text-sm">From ideation to execution, our platform provides the tools and connections to bring your vision to life.</p>
              </div>
            </div>
          </section>

          {/* Timeline Section */}
          <section className="w-full mb-8">
            <h2 className="text-xl font-semibold text-indigo-400 mb-4 text-left">How It Works</h2>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col items-center">
                <div className="bg-indigo-500 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold mb-2">1</div>
                <span className="text-gray-200 text-sm">Sign Up & Create Profile</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-indigo-500 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold mb-2">2</div>
                <span className="text-gray-200 text-sm">Share Ideas & Connect</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-indigo-500 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold mb-2">3</div>
                <span className="text-gray-200 text-sm">Build Teams & Pitch</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-indigo-500 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold mb-2">4</div>
                <span className="text-gray-200 text-sm">Launch & Grow</span>
              </div>
            </div>
          </section>

          {/* Team Section */}
          <section className="w-full mb-8">
            <h2 className="text-xl font-semibold text-indigo-400 mb-4 text-left">Meet the Team</h2>
            <div className="flex flex-wrap gap-10 justify-center">
              <div className="flex flex-col items-center">
                <img src="/team1.png" alt="Namith KP" className="w-16 h-16 rounded-full mb-2 border-2 border-indigo-500" onError={(e) => {e.currentTarget.src = 'https://ui-avatars.com/api/?name=Namith+KP&background=4f46e5&color=fff'}} />
                <span className="text-white font-medium">Namith</span>
                <span className="text-gray-400 text-xs">Founder & Lead Developer</span>
              </div>
              <div className="flex flex-col items-center">
                <img src="/team2.png" alt="Co-Founder" className="w-16 h-16 rounded-full mb-2 border-2 border-indigo-500" onError={(e) => {e.currentTarget.src = 'https://ui-avatars.com/api/?name=Akash+Kumar&background=4f46e5&color=fff'}} />
                <span className="text-white font-medium">Akash Kumar</span>
                <span className="text-gray-400 text-xs">Co-Founder & Product</span>
              </div>
              <div className="flex flex-col items-center">
                <img src="/team3.png" alt="Marketing Specialist" className="w-16 h-16 rounded-full mb-2 border-2 border-indigo-500" onError={(e) => {e.currentTarget.src = 'https://ui-avatars.com/api/?name=Gagan&background=4f46e5&color=fff'}} />
                <span className="text-white font-medium">Gagan</span>
                <span className="text-gray-400 text-xs">Marketing Specialist</span>
              </div>
              <div className="flex flex-col items-center">
                <img src="/team3.png" alt="Product Analyst" className="w-16 h-16 rounded-full mb-2 border-2 border-indigo-500" onError={(e) => {e.currentTarget.src = 'https://ui-avatars.com/api/?name=Ujwal+Raj&background=4f46e5&color=fff'}} />
                <span className="text-white font-medium">Ujwal Raj</span>
                <span className="text-gray-400 text-xs">Product Analyst</span>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default LandingPageLightRays;
