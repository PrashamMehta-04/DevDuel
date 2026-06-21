import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Swords, Mail, Lock, ArrowRight } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Temporary bypass to dashboard
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center bg-[#0B0F19] p-4">
      {/* Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[150px] animate-float-slow"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/20 blur-[150px] animate-float-fast"></div>
      </div>

      <Link to="/" className="absolute top-8 left-8 z-20 flex items-center gap-3 hover:opacity-80 transition-opacity">
        <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg border border-white/10">
          <Swords size={20} className="text-blue-400" />
        </div>
        <span className="text-xl font-black tracking-tight text-white">DEV<span className="text-gradient">DUEL</span></span>
      </Link>

      <div className="relative z-10 w-full max-w-md">
        <div className="glass-panel p-8 sm:p-10 rounded-[2rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black tracking-tight mb-2 text-white">
              {isLogin ? 'Welcome Back' : 'Join the Arena'}
            </h2>
            <p className="text-gray-400 font-medium">
              {isLogin ? 'Enter your credentials to continue' : 'Create an account to start dueling'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Swords size={18} className="text-gray-500" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="ProCoder123"
                    className="w-full bg-black/40 border border-white/10 text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                    required
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-500" />
                </div>
                <input 
                  type="email" 
                  placeholder="name@example.com"
                  className="w-full bg-black/40 border border-white/10 text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-500" />
                </div>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/10 text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                  required
                />
              </div>
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <a href="#" className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors">
                  Forgot password?
                </a>
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl py-3.5 font-bold transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-6"
            >
              {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-400 font-medium">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-400 hover:text-blue-300 font-bold transition-colors ml-1"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
