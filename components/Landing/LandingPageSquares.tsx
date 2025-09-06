import React from "react";
import Squares from "./Squares";
import { LogoIcon } from "../icons";

const LandingPageSquares: React.FC = () => {
  const handleGetStarted = () => {
    window.location.href = "/Grow-With-Me-AI/auth";
  };

  return (
  <div className="min-h-screen w-full font-sans text-white bg-transparent flex flex-col">
  <div className="fixed inset-0 z-0">
        <Squares 
          speed={0.5}
          squareSize={40}
          direction="diagonal"
          borderColor="rgba(255,255,255,0.08)"
          hoverFillColor="rgba(255,255,255,0.16)"
        />
      </div>
  <div className="relative z-10 flex flex-col items-center w-full flex-grow pointer-events-none">
  <header className="relative w-full h-3 flex items-center justify-between px-4 sm:px-6 md:px-12 z-20 pointer-events-auto">
          <div className="flex items-center gap-1">
            <LogoIcon className="w-8 h-8 text-indigo-500" />
            <span className="font-montserrat text-md md:text-3xl font-semibold text-white tracking-tight">row With Me</span>
          </div>
          <button className="bg-white text-[#18141c] rounded-2xl px-6 py-2 font-medium text-base shadow hover:bg-gray-200 transition pointer-events-auto" onClick={handleGetStarted}>Get Started</button>
        </header>
  <main className="flex flex-col items-center justify-center text-center max-w-2xl mt-8 px-4 sm:px-6 md:px-10 z-20 w-full">
          <h1 className="text-4xl sm:text-3xl md:text-4xl lg:text-7xl font-bold mb-6 mt-3 leading-tight">Find Your Perfect<br /><span className="text-indigo-500">Co-Founder</span></h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-300 mb-8 font-light">Leverage the power of AI to connect with innovators, builders, and investors who share your vision.</p>
          <div className="flex flex-wrap gap-3 sm:gap-5 justify-center mb-8 w-full">
            <div className="text-gray-400 text-sm md:text-base"><span className="text-white font-semibold text-lg md:text-xl mr-2">10K+</span>Active Users</div>
            <div className="text-gray-400 text-sm md:text-base"><span className="text-white font-semibold text-lg md:text-xl mr-2">500+</span>Successful Matches</div>
            <div className="text-gray-400 text-sm md:text-base"><span className="text-white font-semibold text-lg md:text-xl mr-2">50+</span>Countries</div>
            <div className="text-gray-400 text-sm md:text-base"><span className="text-white font-semibold text-lg md:text-xl mr-2">95%</span>Satisfaction Rate</div>
          </div>
          <div className="grid gap-3 sm:gap-4 w-full">
              <div className="text-gray-300 rounded-lg px-5 py-4 text-sm font-normal"> <b className="text-white">AI-Powered Matchmaking:</b> Advanced algorithms analyze compatibility across skills, goals, and vision to connect you with the perfect co-founder.</div>
              <div className="text-gray-300 rounded-lg px-5 py-4 text-sm font-normal"> <b className="text-white">Global Network:</b> Connect with thousands of entrepreneurs, investors, and innovators from around the world.</div>
              <div className="text-gray-300 rounded-lg px-5 py-4 text-sm font-normal"> <b className="text-white">Enterprise Security:</b> Bank-level encryption and privacy controls ensure your ideas and conversations remain confidential.</div>
              <div className="text-gray-300 rounded-lg px-5 py-4 text-sm font-normal"> <b className="text-white">Launch Together:</b> From ideation to execution, our platform provides the tools and connections to bring your vision to life.</div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LandingPageSquares;
