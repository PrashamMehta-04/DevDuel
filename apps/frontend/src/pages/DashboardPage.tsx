import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Swords, Code2, Trophy, Flame, Target, Users, Zap, Clock, Loader2, History, LogOut, Shield, Plus, Check, Copy, BrainCircuit } from 'lucide-react';
import { useArenaStore } from '../store/useArenaStore';
import { RankBadge } from '../components/RankBadge';
import { socket } from '../socket';
import { SOCKET_EVENTS } from '@devduel/shared';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setGameMode, setMatchId, setMatchEndTime, userId, username, elo, matchesWon, setProblem, setUserId, setUsername, setElo, setMatchesWon, setMatchesPlayed, isAdmin, setOpponentUsername, setOpponentElo } = useArenaStore();
  
  const [isSearching, setIsSearching] = useState(false);
  const [isStartingSolo, setIsStartingSolo] = useState(false);
  const [isCreatingPrivate, setIsCreatingPrivate] = useState(false);
  const [isJoiningPrivate, setIsJoiningPrivate] = useState(false);
  const [privateRoomCode, setPrivateRoomCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  
  const [userStats, setUserStats] = useState({ problemsSolved: 0, globalRank: 'Top 100%', streak: 0 });
  const [globalStats, setGlobalStats] = useState({ solvedToday: 0 });
  const [dailyProblem, setDailyProblem] = useState<{id: string, title: string, description: string} | null>(null);

  useEffect(() => {
    if (userId) {
      fetch(`/api/users/${userId}/stats`, { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (!data.error) setUserStats(data);
        })
        .catch(console.error);
    }
    fetch('/api/stats/global', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (!data.error) setGlobalStats(data);
      })
      .catch(console.error);
  }, [userId]);

  useEffect(() => {
    fetch('/api/problems/daily')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setDailyProblem(data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (location.state?.isNewUser) {
      navigate('/profile', { state: { isNewUser: true }, replace: true });
    }
  }, [location.state, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUserId('');
    setUsername('Guest');
    setElo(1200);
    setMatchesWon(0);
    setMatchesPlayed(0);
    navigate('/login');
  };

  useEffect(() => {
    const onMatchFound = (payload: { matchId: string, opponentId: string, opponentUsername?: string, opponentRating?: number, endTime: number, problem?: { title: string; description: string } }) => {
      setIsSearching(false);
      setIsJoiningPrivate(false);
      setMatchId(payload.matchId);
      setMatchEndTime(payload.endTime);
      if (payload.opponentUsername) setOpponentUsername(payload.opponentUsername);
      if (payload.opponentRating) setOpponentElo(payload.opponentRating);
      if (payload.problem) {
        setProblem(payload.problem);
      }
      setGameMode(payload.matchId.startsWith('solo') ? 'solo' : 'battle');
      navigate('/arena');
    };

    const onPrivateMatchCreated = (payload: { roomCode: string }) => {
      setIsCreatingPrivate(false);
      setPrivateRoomCode(payload.roomCode);
    };

    const onJoinPrivateError = (payload: { error: string }) => {
      setIsJoiningPrivate(false);
      alert(payload.error);
    };

    socket.on(SOCKET_EVENTS.MATCH_FOUND, onMatchFound);
    socket.on(SOCKET_EVENTS.PRIVATE_MATCH_CREATED, onPrivateMatchCreated);
    socket.on(SOCKET_EVENTS.JOIN_PRIVATE_MATCH_ERROR, onJoinPrivateError);
    return () => {
      socket.off(SOCKET_EVENTS.MATCH_FOUND, onMatchFound);
      socket.off(SOCKET_EVENTS.PRIVATE_MATCH_CREATED, onPrivateMatchCreated);
      socket.off(SOCKET_EVENTS.JOIN_PRIVATE_MATCH_ERROR, onJoinPrivateError);
    };
  }, [navigate, setGameMode, setMatchId, setOpponentUsername, setOpponentElo, setProblem, setMatchEndTime]);

  const handleFindMatch = () => {
    setIsSearching(true);
    socket.emit(SOCKET_EVENTS.FIND_MATCH, { userId, username, rating: elo });
  };

  const handleCreatePrivateMatch = () => {
    setIsCreatingPrivate(true);
    socket.emit(SOCKET_EVENTS.CREATE_PRIVATE_MATCH, { userId, username, rating: elo });
  };

  const handleJoinPrivateMatch = () => {
    if (!joinCode.trim()) return;
    setIsJoiningPrivate(true);
    socket.emit(SOCKET_EVENTS.JOIN_PRIVATE_MATCH, { userId, username, rating: elo, roomCode: joinCode.trim() });
  };

  const handleStartPractice = () => {
    setIsStartingSolo(true);
    socket.emit(SOCKET_EVENTS.START_PRACTICE, { userId, username });
    // It will trigger MATCH_FOUND quickly
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
        <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg border border-white/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <Swords size={20} className="text-blue-400" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-white">DEV<span className="text-gradient">DUEL</span></h1>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/leaderboard" className="flex items-center gap-2 px-4 py-2 glass-panel rounded-full border border-white/5 hover:bg-white/10 transition-colors">
            <Trophy size={16} className="text-yellow-400" />
            <span className="text-sm font-bold text-gray-200">Leaderboard</span>
          </Link>
          {isAdmin && (
            <>
              <Link to="/admin" state={{ tab: 'create' }} className="flex items-center gap-2 px-4 py-2 glass-panel rounded-full border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 transition-colors">
                <Plus size={16} className="text-purple-400" />
                <span className="text-sm font-bold text-gray-200">Create Problem</span>
              </Link>
              <Link to="/admin" state={{ tab: 'list' }} className="flex items-center gap-2 px-4 py-2 glass-panel rounded-full border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 transition-colors">
                <Shield size={16} className="text-purple-400" />
                <span className="text-sm font-bold text-gray-200">Manage Problems</span>
              </Link>
            </>
          )}
          <Link to="/history" className="flex items-center gap-2 px-4 py-2 glass-panel rounded-full border border-white/5 hover:bg-white/10 transition-colors">
            <History size={16} className="text-blue-400" />
            <span className="text-sm font-bold text-gray-200">History</span>
          </Link>
          <div className="flex items-center gap-2 px-4 py-2 glass-panel rounded-full border border-white/5">
            <Flame size={16} className="text-orange-400" />
            <span className="text-sm font-bold text-gray-200">{userStats.streak} Day Streak</span>
          </div>
          <button onClick={handleLogout} className="p-2 glass-panel rounded-full border border-white/5 hover:bg-white/10 transition-colors" title="Logout">
            <LogOut size={16} className="text-red-400" />
          </button>
          <Link to="/profile" className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-0.5 cursor-pointer hover:opacity-80 transition-opacity shadow-[0_0_15px_rgba(168,85,247,0.3)] block">
            <div className="h-full w-full rounded-full bg-[#0B0F19] flex items-center justify-center">
              <span className="text-sm font-bold text-gray-200">{username.charAt(0).toUpperCase()}</span>
            </div>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-8 flex flex-col gap-8 mt-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight mb-2">Welcome back, {username}</h2>
          <p className="text-gray-400 font-medium">Ready for your next coding challenge?</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Private Duel Card */}
          <div className="glass-panel p-8 rounded-3xl border border-purple-500/30 flex flex-col items-center text-center relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-[50px] rounded-full group-hover:bg-purple-500/40 transition-colors pointer-events-none"></div>
            
            <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              <Users size={32} className="text-purple-400" />
            </div>
            
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Private Duel</h2>
            <p className="text-gray-400 font-medium mb-8 text-sm">Challenge a friend to a 1v1 battle.</p>
            
            <div className="w-full space-y-4">
              {privateRoomCode ? (
                <div className="bg-black/40 rounded-xl p-4 border border-purple-500/30">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Room Code</span>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black tracking-widest text-white">{privateRoomCode}</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(privateRoomCode);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                    >
                      {copiedCode ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={handleCreatePrivateMatch}
                  disabled={isCreatingPrivate}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] flex items-center justify-center gap-2"
                >
                  {isCreatingPrivate ? <Loader2 className="animate-spin" size={20} /> : <><Users size={20} /> Create Room</>}
                </button>
              )}

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-xs font-bold text-gray-500 uppercase tracking-widest">OR</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold tracking-widest text-center focus:outline-none focus:border-purple-500/50 uppercase"
                />
                <button 
                  onClick={handleJoinPrivateMatch}
                  disabled={isJoiningPrivate || joinCode.length < 1}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isJoiningPrivate ? <Loader2 className="animate-spin" size={20} /> : 'Join'}
                </button>
              </div>
            </div>
          </div>

          {/* Multiplayer Battle */}
          <div className="glass-panel rounded-3xl p-8 border border-white/10 relative overflow-hidden group">
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] -mr-10 -mb-10 transition-all duration-700 group-hover:bg-blue-500/20 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl border border-white/10 inline-block mb-5 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                  <Zap size={24} className="text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Ranked Battle</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-6 font-medium">
                  Match against an opponent of similar skill. First to solve the algorithmic challenge wins Elo points.
                </p>
              </div>
              
              <button 
                onClick={handleFindMatch}
                disabled={isSearching}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-3.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] hover:-translate-y-0.5 flex items-center justify-center gap-2 border border-blue-400/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-auto"
              >
                {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Swords size={18} />}
                {isSearching ? 'Searching...' : 'Find Match'}
              </button>
            </div>
          </div>

          {/* Practice Mode Card */}
          <div className="glass-panel p-8 rounded-3xl border border-green-500/30 flex flex-col items-center text-center relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 blur-[50px] rounded-full group-hover:bg-green-500/40 transition-colors pointer-events-none"></div>
            
            <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mb-6 border border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.4)]">
              <BrainCircuit size={32} className="text-green-400" />
            </div>
            
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Practice Range</h2>
            <p className="text-gray-400 font-medium mb-8 text-sm">Practice problems stress-free with no timer or rating changes.</p>
            
            <button 
              onClick={handleStartPractice}
              disabled={isStartingSolo}
              className="w-full mt-auto bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] flex items-center justify-center gap-2"
            >
              {isStartingSolo ? <Loader2 className="animate-spin" size={20} /> : <><BrainCircuit size={20} /> Start Practice</>}
            </button>
          </div>

        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
          <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col items-center justify-center text-center hover:bg-white/[0.02] transition-colors">
            <Trophy size={28} className="text-yellow-400 mb-3 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-white tracking-tight">{elo}</span>
              <RankBadge elo={elo} size="sm" />
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Elo Rating</span>
          </div>
          <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col items-center justify-center text-center hover:bg-white/[0.02] transition-colors">
            <Swords size={28} className="text-blue-400 mb-3 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            <span className="text-3xl font-black text-white tracking-tight">{matchesWon}</span>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Matches Won</span>
          </div>
          <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col items-center justify-center text-center hover:bg-white/[0.02] transition-colors">
            <Code2 size={28} className="text-green-400 mb-3 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
            <span className="text-3xl font-black text-white tracking-tight">{userStats.problemsSolved}</span>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Problems Solved</span>
          </div>
          <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col items-center justify-center text-center hover:bg-white/[0.02] transition-colors">
            <Target size={28} className="text-red-400 mb-3 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]" />
            <span className="text-3xl font-black text-white tracking-tight">{userStats.globalRank}</span>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Global Rank</span>
          </div>
        </div>

      </main>

    </div>
  );
};

export default DashboardPage;
