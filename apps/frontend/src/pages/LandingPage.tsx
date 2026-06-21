import React from 'react';
import { Link } from 'react-router-dom';
import { Swords, Code2, Zap, Globe } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen w-full relative overflow-x-hidden bg-[#0B0F19] flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[150px] animate-float-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[150px] animate-float-fast"></div>
        <div className="absolute top-[20%] left-[60%] w-[30%] h-[30%] rounded-full bg-purple-600/10 blur-[120px] animate-float-slow" style={{ animationDelay: '-2s' }}></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg border border-white/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <Swords size={24} className="text-blue-400" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">DEV<span className="text-gradient">DUEL</span></span>
        </div>
        <div className="flex items-center gap-6 font-semibold">
          <Link to="/login" className="text-gray-300 hover:text-white transition-colors">Sign In</Link>
          <Link to="/login" className="px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all shadow-lg hover:shadow-xl text-white">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto mt-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border-blue-500/30 text-blue-300 text-sm font-bold tracking-wide mb-8 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
          <Zap size={16} className="text-blue-400" />
          <span>The New Standard for Competitive Programming</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 leading-tight">
          Code Faster. <br/>
          <span className="text-gradient">Dominate the Arena.</span>
        </h1>
        
        <p className="text-xl text-gray-400 mb-12 max-w-2xl font-medium leading-relaxed">
          Challenge developers worldwide in real-time 1v1 coding battles. Prove your skills, climb the leaderboard, and become the ultimate champion.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link to="/login" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-2xl font-bold text-lg transition-all shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] hover:-translate-y-1 border border-blue-400/30 flex items-center gap-3 text-white">
            <Swords size={20} />
            Enter the Arena
          </Link>
          <a href="#features" className="px-8 py-4 glass-panel hover:bg-white/10 rounded-2xl font-bold text-lg transition-all border border-white/10 hover:border-white/20 text-gray-200">
            View Leaderboard
          </a>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full">
          {[
            { icon: <Zap size={24}/>, title: "Real-time Execution", desc: "Instantly run code against hidden test cases in isolated environments." },
            { icon: <Globe size={24}/>, title: "Global Matchmaking", desc: "Get matched with opponents of similar skill levels instantly." },
            { icon: <Code2 size={24}/>, title: "Multi-Language", desc: "Write in Python, JavaScript, TypeScript, C++, and Java." }
          ].map((feature, i) => (
            <div key={i} className="glass-panel p-8 rounded-3xl text-left hover:-translate-y-2 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
              <p className="text-gray-400 font-medium leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-white/5 mt-20 text-center text-gray-500 font-medium">
        © 2026 DevDuel. All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;
