import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Swords, ArrowLeft, Trophy, Flame, Target, Users, Zap, Clock, Loader2, History, LogOut, Check } from 'lucide-react';
import { useArenaStore } from '../store/useArenaStore';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, username, elo, matchesWon, matchesPlayed, setUserId, setUsername, setElo, setMatchesWon, setMatchesPlayed, defaultLanguage, setDefaultLanguage, supportedLanguages } = useArenaStore();
  
  const [newUsername, setNewUsername] = useState(username);
  const [newDefaultLanguage, setNewDefaultLanguage] = useState(defaultLanguage || 'javascript');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [isNewUser, setIsNewUser] = useState(location.state?.isNewUser || false);

  useEffect(() => {
    setNewUsername(username);
    setNewDefaultLanguage(defaultLanguage || 'javascript');
    if (isNewUser) {
      window.history.replaceState({}, document.title);
    }
  }, [username, defaultLanguage, isNewUser]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUserId('');
    setUsername('Guest');
    setElo(1200);
    setMatchesWon(0);
    setMatchesPlayed(0);
    navigate('/login');
  };

  const handleSaveSettings = async () => {
    if (!newUsername.trim()) return;
    
    setSettingsError('');
    setSettingsSuccess('');
    
    let languageChanged = false;
    if (newDefaultLanguage !== defaultLanguage) {
      setDefaultLanguage(newDefaultLanguage);
      languageChanged = true;
    }
    
    if (newUsername === username) {
      if (languageChanged) {
        setSettingsSuccess('Changes saved successfully!');
        setTimeout(() => setSettingsSuccess(''), 3000);
      }
      return;
    }
    
    setSettingsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username: newUsername.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      setUsername(data.username);
      setIsNewUser(false);
      setSettingsSuccess('Changes saved successfully!');
      setTimeout(() => setSettingsSuccess(''), 3000);
    } catch (err: any) {
      setSettingsError(err.message);
    } finally {
      setSettingsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col bg-[#0B0F19] text-white">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[150px] animate-float-slow"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[150px] animate-float-fast"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 glass-panel border-b border-white/5 px-8 py-4 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity text-gray-300">
          <ArrowLeft size={20} />
          <span className="font-bold">Back to Dashboard</span>
        </Link>
        <button onClick={handleLogout} className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-xl transition-colors font-bold text-sm border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
          <LogOut size={16} /> Logout
        </button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto p-8 flex flex-col gap-8 mt-4">
        
        {isNewUser && (
          <div className="bg-blue-500/20 border border-blue-500/30 text-blue-400 px-6 py-4 rounded-2xl font-medium shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            Welcome to DevDuel! Please set your username before jumping into the arena.
          </div>
        )}

        <div className="flex items-center gap-6">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-1 shadow-[0_0_30px_rgba(168,85,247,0.4)]">
            <div className="h-full w-full rounded-full bg-[#0B0F19] flex items-center justify-center">
              <span className="text-4xl font-black text-white">{username.charAt(0).toUpperCase()}</span>
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-black tracking-tight mb-2 text-glow">{username}</h2>
            <p className="text-gray-400 font-medium">DevDuel Contender</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
          
          {/* Profile Settings */}
          <div className="glass-panel p-8 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <h3 className="text-2xl font-bold mb-2">Edit Profile</h3>
            <p className="text-gray-400 text-sm mb-6">Update your username to be recognized in the arena.</p>
            
            <div className="space-y-4">
              {settingsError && (
                <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
                  {settingsError}
                </div>
              )}
              {settingsSuccess && (
                <div className="bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl text-sm font-medium">
                  {settingsSuccess}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Username</label>
                <input 
                  type="text" 
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                  placeholder="Enter new username"
                  disabled={settingsLoading}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Default Language</label>
                <select
                  value={newDefaultLanguage}
                  onChange={(e) => setNewDefaultLanguage(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium appearance-none"
                  disabled={settingsLoading}
                >
                  {supportedLanguages.map(lang => (
                    <option key={lang.id} value={lang.id} className="bg-[#0B0F19]">
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <button 
                onClick={handleSaveSettings}
                disabled={settingsLoading || !newUsername.trim() || (newUsername === username && newDefaultLanguage === defaultLanguage)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl py-3.5 font-bold transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
              >
                {settingsLoading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                Save Changes
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="space-y-4">
            <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
              <div className="p-4 bg-yellow-500/10 rounded-xl">
                <Trophy size={32} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Elo Rating</div>
                <div className="text-3xl font-black">{elo}</div>
              </div>
            </div>
            
            <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
              <div className="p-4 bg-blue-500/10 rounded-xl">
                <Swords size={32} className="text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Matches Won</div>
                <div className="text-3xl font-black">{matchesWon}</div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
              <div className="p-4 bg-green-500/10 rounded-xl">
                <Users size={32} className="text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Matches Played</div>
                <div className="text-3xl font-black">{matchesPlayed}</div>
              </div>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
