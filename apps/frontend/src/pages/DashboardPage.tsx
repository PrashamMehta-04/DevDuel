import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Swords, Code2, Trophy, Flame, Target, Users, Zap, Clock, Loader2, History, LogOut } from 'lucide-react';
import { useArenaStore } from '../store/useArenaStore';
import { socket } from '../socket';
import { SOCKET_EVENTS } from '@devduel/shared';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setGameMode, setMatchId, setMatchEndTime, userId, username, elo, matchesWon, setProblem, setUserId, setUsername, setElo, setMatchesWon, setMatchesPlayed } = useArenaStore();
  const [isSearching, setIsSearching] = useState(false);
  const [isStartingSolo, setIsStartingSolo] = useState(false);
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
    const onMatchFound = (payload: { matchId: string, opponentId: string, endTime: number, problem?: { title: string; description: string } }) => {
      setIsSearching(false);
      setMatchId(payload.matchId);
      setMatchEndTime(payload.endTime);
      if (payload.problem) {
        setProblem(payload.problem);
      }
      setGameMode('battle');
      navigate('/arena');
    };

    socket.on(SOCKET_EVENTS.MATCH_FOUND, onMatchFound);
    return () => {
      socket.off(SOCKET_EVENTS.MATCH_FOUND, onMatchFound);
    };
  }, [navigate, setGameMode, setMatchId]);

  const handleFindMatch = () => {
    setIsSearching(true);
    socket.emit(SOCKET_EVENTS.FIND_MATCH, { userId, rating: elo });
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
          {/* Problem of the Day */}
          <div className="lg:col-span-2 glass-panel rounded-3xl p-8 border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -mr-20 -mt-20 transition-all duration-700 group-hover:bg-blue-500/20 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col h-full justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <div className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full border border-yellow-500/30 flex items-center gap-1.5 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                    <Target size={12} /> Problem of the Day
                  </div>
                  <div className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full border border-blue-500/30 flex items-center gap-1.5 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                    <Clock size={12} /> Ends in 14h
                  </div>
                </div>
                <h3 className="text-3xl font-bold mb-3 text-glow">{dailyProblem ? dailyProblem.title : 'Loading...'}</h3>
                <p className="text-gray-400 leading-relaxed max-w-xl text-sm font-medium line-clamp-3">
                  {dailyProblem ? dailyProblem.description : ''}
                </p>
              </div>
              
              <div className="flex items-center gap-4 mt-4">
                <button 
                  disabled={isStartingSolo}
                  onClick={async () => {
                    setIsStartingSolo(true);
                    try {
                      const res = await fetch('/api/problems/two-sum');
                      if (res.ok) {
                        const problem = await res.json();
                        setProblem(problem);
                        if (problem.id) {
                          setMatchId(problem.id);
                        }
                      }
                    } catch (e) {
                      console.error("Failed to fetch random problem", e);
                    }
                    setGameMode('solo');
                    navigate('/arena');
                  }}
                  className="bg-white hover:bg-gray-100 text-black px-6 py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isStartingSolo ? <Loader2 size={18} className="animate-spin" /> : <Code2 size={18} />}
                  {isStartingSolo ? 'Loading...' : 'Solve Solo'}
                </button>
                <div className="flex items-center gap-2 text-sm text-gray-400 font-medium ml-2">
                  <Users size={16} /> <span className="text-gray-300 font-bold">{globalStats.solvedToday.toLocaleString()}</span> solved today
                </div>
              </div>
            </div>
          </div>

          {/* Multiplayer Battle */}
          <div className="glass-panel rounded-3xl p-8 border border-white/10 relative overflow-hidden group">
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-[60px] -mr-10 -mb-10 transition-all duration-700 group-hover:bg-purple-500/20 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-white/10 inline-block mb-5 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                  <Zap size={24} className="text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Ranked Battle</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-6 font-medium">
                  Match against an opponent of similar skill. First to solve the algorithmic challenge wins Elo points.
                </p>
              </div>
              
              <button 
                onClick={handleFindMatch}
                disabled={isSearching}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-3.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] hover:-translate-y-0.5 flex items-center justify-center gap-2 border border-purple-400/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Swords size={18} />}
                {isSearching ? 'Searching...' : 'Find Match'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
          <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col items-center justify-center text-center hover:bg-white/[0.02] transition-colors">
            <Trophy size={28} className="text-yellow-400 mb-3 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
            <span className="text-3xl font-black text-white tracking-tight">{elo}</span>
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
