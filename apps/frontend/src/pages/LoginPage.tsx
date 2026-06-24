import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Swords, ArrowRight, Loader2, Key } from 'lucide-react';
import { useArenaStore } from '../store/useArenaStore';

const LoginPage: React.FC = () => {
  const [username, setUsernameInput] = useState('');
  const [password, setPasswordInput] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUserId, setUsername, setElo, setMatchesWon, setMatchesPlayed } = useArenaStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Both fields are required');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const endpoint = isRegistering ? '/api/register' : '/api/login';
      const res = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate');
      }
      
      localStorage.setItem('token', data.token);
      setUserId(data.id);
      setUsername(data.username);
      setElo(data.elo);
      setMatchesWon(data.matchesWon);
      setMatchesPlayed(data.matchesPlayed);
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
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
              {isRegistering ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-400 font-medium">
              {isRegistering ? 'Sign up to start dueling' : 'Log in to enter the arena'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Swords size={18} className="text-gray-500" />
                </div>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="ProCoder123"
                  className="w-full bg-black/40 border border-white/10 text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Key size={18} className="text-gray-500" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/10 text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl py-3.5 font-bold transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <><ArrowRight size={18} /> {isRegistering ? 'Sign Up' : 'Log In'}</>}
            </button>
            
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                className="text-sm text-gray-400 hover:text-blue-400 transition-colors font-medium"
              >
                {isRegistering ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
